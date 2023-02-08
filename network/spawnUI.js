#!/usr/bin/env node
import { spawn } from 'child_process'
import { parentPort, isMainThread } from 'worker_threads'
import { getFilepath, getPathDirname } from '../utils.js'

async function main() {
  const esBuildDir = getFilepath([getPathDirname()])

  const uiProcess = spawn('node', ['esbuildConfig.js'], {cwd: esBuildDir})

  uiProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Started bagels on')) {
      parentPort.postMessage('started')
      console.log(data.toString())
    }
  })

  uiProcess.stderr.on('data', (data) => {
    if (data.toString().includes('bind: address already in use')) {
      console.error('Error starting the server \n')
      console.log('There is already a process on port 1274\n')
      console.log('to kill the process, run: `lsof -i tcp:1274`\n')
      console.log('then run: `kill {port}` with the port printed from the above command\n')
    } else {
      console.error('Error starting the server: ', data.toString()); 
    }
  });

  if (!isMainThread) {
    parentPort.postMessage(uiProcess.pid)
  }
}

main()
