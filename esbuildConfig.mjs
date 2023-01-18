import * as esbuild from 'esbuild'
import { exec } from 'node:child_process'; 

let context = await esbuild.context({
  entryPoints: ['./src/App.jsx'],
  bundle: true,
  outfile: './public/build/bundle.js',
})

console.log('Starting the server 🫡 \n'); 

// exec('http-server')
await context.watch();

let { host, port } = await context.serve({
  servedir: 'public',
  port: 9091
})

console.log(`http://127.0.0.1:${port}`);
