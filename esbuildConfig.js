import * as esbuild from 'esbuild'

async function main() {
  let context = await esbuild.context({
    entryPoints: ['./src/App.jsx'],
    bundle: true,
    outfile: './public/build/bundle.js',
  })

  console.log('Starting the server 🫡 \n')

  // exec('http-server')
  await context.watch()

  // Don't want to use port 3000/3001 in case a user is already using those ports
  let { host, port } = await context.serve({
    servedir: 'public',
    port: 9091,
  })

  console.log(`UI on: http://127.0.0.1:${port}`)

  process.on('SIGINT', async () => {
    await context.cancel()
    await context.dispose()
  })
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
