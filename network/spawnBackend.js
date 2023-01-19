#!/usr/bin/env node
import { spawn } from 'child_process'
import { parentPort, isMainThread } from 'worker_threads'
import { getFilepath, getPathDirname } from '../utils.js'

async function main() {
  const serverDir = getFilepath([getPathDirname()])

  const nodeProcess = spawn('node', ['startServer.js'], {
    cwd: serverDir,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  })

  if (!isMainThread) {
    parentPort.postMessage(nodeProcess.pid)
  }
}

main()
