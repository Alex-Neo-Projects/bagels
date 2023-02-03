#!/usr/bin/env node
import { spawn } from 'child_process'
import { kill } from 'process'
import { isMainThread, parentPort } from 'worker_threads'
import { getFilepath, getPathDirname } from '../utils.js';

let anvilProcessGlobal

export function startupAnvil(network = '') {
  const anvilDir = getFilepath([getPathDirname()])

  let args = []
  if (network === 'mainnet') {
    args = [
      '--fork-url',
      'https://eth-mainnet.g.alchemy.com/v2/YKOGR_zFYv0ouTsGab24VKwOm5w7k6QZ',
    ]
  }

  const res = spawn('./anvil', args, {
    cwd: anvilDir,
    shell: true,
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  })

  return res
}

export function killAnvil() {
  if (anvilProcessGlobal) {
    kill(anvilProcessGlobal.pid, 'SIGTERM')
  } else {
    console.error('Anvil process does not exist')
  }
}

async function main() {
  const anvilProcess = startupAnvil()

  anvilProcessGlobal = anvilProcess

  if (!isMainThread) {
    parentPort.postMessage(anvilProcess.pid)
  }
}

main()
