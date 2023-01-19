import { spawn } from 'child_process'
import { parentPort } from 'worker_threads'

async function main() {
  const anvilProcess = spawn(
    'anvil',
    [
      '--fork-url',
      'https://eth-mainnet.g.alchemy.com/v2/YKOGR_zFYv0ouTsGab24VKwOm5w7k6QZ',
    ],
    {
      shell: true,
    },
  )

  anvilProcess.stderr.on('data', (data) => {
    console.log('Anvil process Error: : ' + data.toString())
  })

  anvilProcess.stdout.on('data', (data) => {
    parentPort.postMessage(anvilProcess.pid)
  })

  anvilProcess.on('exit', function (code) {
    if(code){
      console.log('Anvil process exited with code: ' + code.toString())
    }
  })
}

main()
