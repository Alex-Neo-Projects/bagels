#!/usr/bin/env node
import { spawn } from "child_process";
import { parentPort, isMainThread, workerData } from "worker_threads";
import { getFilepath, getPathDirname } from "../utils.js";

async function main() {
  const serverDir = getFilepath([getPathDirname(), "server"]);

  const serverToLookIn = process.cwd();

  if (!serverToLookIn) {
    console.log("error starting server, plz restart bagels!");
    return;
  }

  let networkUrl = ""

  if (workerData && workerData["network"]) {
    if (workerData["network"] === "mainnet") {
      console.log("Forking Mainnet...");
      networkUrl =
        "https://eth-mainnet.g.alchemy.com/v2/YKOGR_zFYv0ouTsGab24VKwOm5w7k6QZ";
    } else if (workerData["network"] === "polygon") {
      console.log("Forking Polygon...");
      networkUrl =
        "https://polygon-mainnet.g.alchemy.com/v2/fZritfEhq_gYVJ8cV97PHgwVUm9V_Dnx";
    } else {
      console.log(
        `Forking network: ${workerData["network"]} is not an option.`
      );
      console.log(
        `Bagels only supports forking mainnet with: bagels --fork mainnet\n`
      );
    }
  }

  const nodeProcess = spawn("node", ["startServer.js", serverToLookIn, networkUrl], {
    cwd: serverDir,
  });

  nodeProcess.stdout.on("data", (data) => {
    if (data.toString().includes("server started and listening for requests")) {
      parentPort.postMessage("started");
    } else {
      console.log(data.toString());
    }
  });

  nodeProcess.stderr.on("data", (data) => {
    if (data.toString().includes("EADDRINUSE: address already in use")) {
      console.error("Error starting the server \n");
      console.log("There is already a process on port 9090\n");
      console.log("to kill the process, run: `lsof -i tcp:9090`\n");
      console.log(
        "then run: `kill {port}` with the port printed from the above command\n"
      );
    } else {
      console.error("Error starting the server: ", data.toString());
    }
  });

  if (!isMainThread) {
    parentPort.postMessage(nodeProcess.pid);
  }
}

main();
