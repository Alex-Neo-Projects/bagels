import esbuild from 'esbuild'
import * as http from 'http';

let context = await esbuild.context({
  entryPoints: ['./src/App.jsx'],
  bundle: true,
  minify: true,
  outfile: './public/build/bundle.js',
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.eot': 'file', '.ttf': 'file', '.woff': 'file', '.woff2': 'file' }
})

console.log('Starting bagel 🥯 \n'); 

await context.watch();

// Serve the esbuild server on a random port (the requests are forwarded from port 9001 --> this)
let { host, port } = await context.serve({
  servedir: 'public',
  port: 1274
})

// https://github.com/evanw/esbuild/issues/1601
// Esbuild doesn't work with react router out of the box. Seems like the issue has to do with it
// running on nodeJS and not having access to browser APIs like history (which routers rely on). <--???? not sure if this is the reason tho 
// So this is a workaround proxy server that forwards the requests to esbuild
const proxy = http.createServer((req, res) => {
  const options = {
    hostname: host,
    port: port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  }

  const proxyReq = http.request(options, proxyRes => {
    if (proxyRes.statusCode === 404) {
      const redirectReq = http.request({ ...options, path: "/" }, (proxyRes) => {
        // Forward the response from esbuild to the client
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      redirectReq.end();
    } else {
      // Forward the response from esbuild to the client
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  });

  // Forward the body of the request to esbuild
  req.pipe(proxyReq, { end: true });
})

proxy.listen(9091);

console.log(`Site on: http://127.0.0.1:${port}`);
