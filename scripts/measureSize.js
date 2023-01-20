import { execSync } from 'child_process';
import fs from 'fs'; 

const formatBytes = (bytes) => {
  const units = ['b', 'kb', 'mb', 'gb', 'tb'];

  let i = 0;

  for (i; bytes >= 1024 && i < 4; i++) {
    bytes /= 1024;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
};

async function updateBenchmarksFile(size) {
  const packageJson = fs.readFileSync('../package.json')

  const jsonifiedPackageJson = await JSON.parse(packageJson);
  let version = jsonifiedPackageJson['version']; 

  let sizeObject = {
    'install size': `${size}`,
  }

  const sizeJson = fs.readFileSync('../__benchmarks__/size.json')
  const jsonifiedSizeJson = await JSON.parse(sizeJson)

  jsonifiedSizeJson[version] = sizeObject; 

  fs.writeFile('../__benchmarks__/size.json', JSON.stringify(jsonifiedSizeJson, null, 2), 'utf-8', (err) => {
    if (err) throw err;
    console.log('Saved size results to the __benchmarks__ folder');
  });
}

async function measureSize() {
  // execSync('bun i -g bagels');
  
  const bagelsLocation = execSync('which bagels').toString().split('\n')[0];
  
  // const packageSize = fs.statSync(bagelsLocation).size;
  // const formattedSize = formatBytes(packageSize);
  
  // console.log('Install size: ', formattedSize); 
  
  // execSync('bun remove -g bagels');
  
  // updateBenchmarksFile(formattedSize);
}

measureSize();