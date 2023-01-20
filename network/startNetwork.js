#!/usr/bin/env node
import { Worker } from 'worker_threads'
import process, { kill } from 'process'
import open from 'open'
import { getFilepath, getPathDirname } from '../utils.js'

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

let children = []

async function main() {
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

    const anvilWorker = await workerPromise(filePaths.anvilPath)
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
    children.forEach((child) => {
      kill(child, 'SIGTERM')
    })
    children = []
  }
})

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
