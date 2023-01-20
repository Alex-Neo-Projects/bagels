#!/usr/bin/env node
import { spawn } from 'child_process'
import { parentPort, isMainThread } from 'worker_threads'
import { getFilepath, getPathDirname } from '../utils.js'

async function main() {
  const esBuildDir = getFilepath([getPathDirname()])

  const uiProcess = spawn('node', ['esbuildConfig.js'], {
    cwd: esBuildDir,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  })

  if (!isMainThread) {
    parentPort.postMessage(uiProcess.pid)
  }
}

main()
