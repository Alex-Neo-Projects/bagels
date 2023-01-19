import * as esbuild from 'esbuild'

let context = await esbuild.context({
  entryPoints: ['./src/App.jsx'],
  bundle: true,
  minify: true,
  outdir: './public/build',
})

console.log('Starting bagel 🥯 \n'); 

// exec('http-server')
await context.watch();

// Don't want to use port 3000/3001 in case a user is already using those ports
let { host, port } = await context.serve({
  servedir: 'public',
  port: 9091
})

console.log(`http://127.0.0.1:${port}`);
