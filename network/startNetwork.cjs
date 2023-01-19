#!/usr/bin/env node

const { Worker } = require('worker_threads');
const { kill } = require('process');
const path = require('path');
// const ora = require('ora');
const { exec } = require('child_process');
const open = require('open');
const fs = require('fs');

async function workerPromise(script) {
  return await new Promise((resolve, reject) => {
    let w = new Worker(script, {})
    w.on('message', (message) => {
      resolve(message)
    })
    w.on('error', (err) => reject(err))
    w.on('exit', (exitCode) =>
      reject(`worker finished with exit code ${exitCode}`),
    )
  })
}

const children = []

async function main() {
  try {
    // Start Anvil
    const bagelsScriptPath = path.dirname(require.main.filename);

    let anvilPath = path.join(bagelsScriptPath, 'spawnAnvil.js');

    const anvilWorker = await workerPromise(`${anvilPath}`)
    
    if (!anvilWorker) {
      console.log('Unable to start Anvil')
      process.exit(1)
    }

    children.push(anvilWorker)

    let backendPath = path.join(bagelsScriptPath, 'spawnBackend.cjs');

    const backendWorker = await workerPromise(`${backendPath}`)

    if (!backendWorker) {
      console.log('Unable to start the backend')
      process.exit(1)
    }

    children.push(backendWorker)

    let frontendPath = path.join(bagelsScriptPath, 'spawnUI.cjs');

    const uiWorker = await workerPromise(`${frontendPath}`)

    if (!uiWorker) {
      console.log('Unable to start frontend')
      process.exit(1)
    }
    children.push(uiWorker)

    // Start Local Host
    open('http://localhost:9091')
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

process.on('SIGINT', () => {
  console.log(`\nShutting down ${children.length} services`)

  if (children.length >= 1) {
    children.forEach((child) => kill(child.toString()))
  }
})

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
