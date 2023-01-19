import { spawn } from 'child_process'
import { kill } from 'process'
import { parentPort } from 'worker_threads'

let anvilProcessGlobal

export function startupAnvil(network = '') {
  let args = []
  if (network === 'mainnet') {
    args = [
      '--fork-url',
      'https://eth-mainnet.g.alchemy.com/v2/YKOGR_zFYv0ouTsGab24VKwOm5w7k6QZ',
    ]
  }

  const res = spawn('anvil', args, {
    shell: true,
  })

  return res
}

export function killAnvil() {
  if(anvilProcessGlobal) {
    kill(anvilProcessGlobal.pid)
  }else {
    console.error("Anvil process does not exist")
  }
}

async function main() {
  const anvilProcess = startupAnvil()
  anvilProcessGlobal = anvilProcess

  anvilProcess.stderr.on('data', (data) => {
    console.log('Anvil process Error: : ' + data.toString())
  })

  anvilProcess.stdout.on('data', (data) => {
    parentPort.postMessage(anvilProcess.pid)
  })

  anvilProcess.on('exit', function (code) {
    if (code) {
      console.log('Anvil process exited with code: ' + code.toString())
    }
  })
}

main()
