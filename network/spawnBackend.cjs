const { spawn } = require('child_process');
const { parentPort, isMainThread } = require('worker_threads');
const path = require('path');

async function main() {
  const bagelsScriptPath = path.dirname(require.main.filename);

  let serverDir = path.join(bagelsScriptPath, '..', 'server')

  const nodeProcess = spawn('node', ['startServer.js'], {
    cwd: serverDir,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  })

  if (!isMainThread) {
    parentPort.postMessage(nodeProcess.pid)
  }
}

main()
