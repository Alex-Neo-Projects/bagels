#!/usr/bin/env node
import { Worker } from "worker_threads";
import process, { kill } from "process";
import open from "open";
import { getFilepath, getPathDirname } from "../utils.js";
import { PostHog } from "posthog-node";
import os from "os";
import { platform } from "node:process";
import { execSync, spawnSync } from "child_process";

const PLATFORM = platform;

const client = new PostHog("phc_XmppwnWycFgtoeRJR93d1QaiYtZ4CPSJs4Dts5uTRm4", {
  host: "https://app.posthog.com",
});
let children = [];

async function workerPromise(script, data) {
  return await new Promise((resolve, reject) => {
    let w = new Worker(script, { workerData: data });
    let pid;

    w.on("message", (message) => {
      // This means that the worker is done *starting*
      // Necessary to avoid race condition where the backend is slower to start than the frontend
      // We resolve the PID anyway though, because it's used to kill the process later
      if (message === "started") {
        resolve(pid);
      } else {
        pid = message;
      }
    });
    w.on("error", (err) => reject(err));
    w.on("exit", (exitCode) => {
      reject(`worker finished with exit code ${exitCode}`);
    });
  });
}

function checkIfRunning() {
  // Check either anvil or backend or frontend are running
  switch (PLATFORM) {
    case "linux":
    case "darwin":
      // anvil
      try {
        execSync("lsof -ti tcp:8545 | xargs kill");
      } catch (e) {
        throw new Error(e.message)
      }

      // backend
      try {
        execSync("lsof -ti tcp:9090 | xargs kill");
      } catch (e) {
        throw new Error(e.message)
      }

      // frontend
      try {
        execSync("lsof -ti tcp:1274 | xargs kill");
      } catch (e) {
        throw new Error(e.message)
      }
      break;
    case "win32":
      try {
        execSync("netstat -ti tcp:1274 | xargs kill");
      } catch (e) {
        throw new Error(e.message)
      }
      break;
    default:
      console.log("Unable to check platform, moving on!");
  }
}

async function main() {
  try {
    checkIfRunning();
  } catch (e) {
    console.error(e.message);
    process.exit(1)
  }

  try {
    let filePaths = {
      anvilPath: getFilepath([getPathDirname(), 'network', 'spawnAnvil.js']),
      backendPath: getFilepath([
        getPathDirname(),
        'network',
        'spawnBackend.js',
      ]),
      frontendPath: getFilepath([getPathDirname(), 'network', 'spawnUI.js']),
    }

    let forkNetwork;

    // Only args is forking
    if (process.argv.indexOf('--fork') >= 0) {
      // Just get whatever is after --fork
      forkNetwork = process.argv[process.argv.indexOf('--fork') + 1];
    }

    const anvilWorker = await workerPromise(filePaths.anvilPath, {'network': forkNetwork})

    if (!anvilWorker) {
      console.log('Unable to start Anvil')
      process.exit(1)
    }

    children.push(anvilWorker)

    const backendWorker = await workerPromise(filePaths.backendPath)
    if (!backendWorker) {
      console.log('Unable to start the backend')
      process.exit(1)
    }

    children.push(backendWorker)

    const uiWorker = await workerPromise(filePaths.frontendPath)
    if (!uiWorker) {
      console.log('Unable to start frontend')
      process.exit(1)
    }
    children.push(uiWorker)

    // Capture bagels starts
    client.capture({
      distinctId: os.userInfo().username,
      event: 'bagels-started'
    })

    // Start Local Host
    open('http://localhost:9091/')
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }

  process.on('SIGINT', () => {
    console.log("\n🥯 Closing Bagels!")
    if (children.length >= 1) {
      children.forEach((child) => {
        kill(child, 'SIGTERM')
      })
      children = []
    }
    process.exit(1)
  })
}

main();
