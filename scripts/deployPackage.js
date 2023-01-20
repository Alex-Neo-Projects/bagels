import fs from 'fs'; 
import { exec, execSync } from 'child_process'
import { firstInstallTimes } from './testFirstInstall.js';
import { measureSize } from './measureSize.js';

async function updatePackageNumber() { 
  // Step 1: update the package # 
  const packageJson = fs.readFileSync('../package.json')

  const jsonifiedPackageJson = await JSON.parse(packageJson);
  let version = jsonifiedPackageJson['version']; 

  let splits = version.split('.');
  let numberVer = parseInt(splits[2])

  splits[2] = (numberVer += 1).toString();

  const newVersion = splits.join('.');

  jsonifiedPackageJson['version'] = newVersion; 

  fs.writeFileSync('../package.json', JSON.stringify(jsonifiedPackageJson, null, 2));
}

async function main() { 
  updatePackageNumber();
  
  console.time('Done publishing 🥯')
  execSync('npm publish', { cwd: '../'});
  console.timeEnd('Done publishing 🥯')

  await firstInstallTimes();
  await measureSize();
}

main();