#!/usr/bin/env node
import { spawn } from 'child_process'
import { kill } from 'process'
import { isMainThread, parentPort, workerData } from 'worker_threads'
import { getFilepath, getPathDirname } from '../utils.js';

let anvilProcessGlobal

export function startupAnvil() {
  const anvilDir = getFilepath([getPathDirname()])

  let args = []

  if (workerData && workerData['network']) {
    if (workerData['network'] === 'mainnet') {
      console.log('Forking mainnet plz wait...');
  
      args = [
        '--fork-url',
        'https://eth-mainnet.g.alchemy.com/v2/YKOGR_zFYv0ouTsGab24VKwOm5w7k6QZ',
      ]
    }
    else if (workerData['network'] === 'polygon') { 
      console.log('Forking polygon plz wait...');

      args = [
        '--fork-url',
        'https://polygon-mainnet.g.alchemy.com/v2/fZritfEhq_gYVJ8cV97PHgwVUm9V_Dnx',
      ]
    }
    else { 
      console.log(`Forking network: ${workerData['network']} is not an option.`)
      console.log(`Bagels only supports forking mainnet with: bagels --fork mainnet\n`)
    }
  }

  const nodeProcess = spawn('./anvil', args, { cwd: anvilDir})

  nodeProcess.stdout.on('data', (data) => {
    parentPort.postMessage('started')
  })

  nodeProcess.stderr.on('data', (data) => {
    if (data.toString().includes('Address already in use')) {
      console.error('Error starting the local network\n')
      console.log('There is already a process on port 8545\n')
      console.log('to kill the process, run: `lsof -i tcp:8545`\n')
      console.log('then run: `kill {port}` with the port printed from the above command\n')
    } else {
      console.error('Error starting the local network: ', data.toString()); 
    }
  });

  return nodeProcess
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
