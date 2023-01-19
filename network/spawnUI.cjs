const { spawn } = require('child_process');
const { parentPort, isMainThread } = require('worker_threads');
const path = require('path');

async function main() {
  const bagelsScriptPath = path.dirname(require.main.filename);

  let esBuildDir = path.join(bagelsScriptPath, '..')

  const uiProcess = spawn('bun', ['esbuildConfig.js'], {
    cwd: esBuildDir,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  })

  if (!isMainThread) {
    parentPort.postMessage(uiProcess.pid)
  }
}

main()
