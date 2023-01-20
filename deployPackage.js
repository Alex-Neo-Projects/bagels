import fs from 'fs'; 
import { exec, execSync } from 'child_process'

async function updatePackageNumber() { 
  // Step 1: update the package # 
  const packageJson = fs.readFileSync('package.json')

  const jsonifiedPackageJson = await JSON.parse(packageJson);
  let version = jsonifiedPackageJson['version']; 

  let splits = version.split('.');
  let numberVer = parseInt(splits[2])

  splits[2] = (numberVer += 1).toString();

  const newVersion = splits.join('.');

  jsonifiedPackageJson['version'] = newVersion; 

  fs.writeFileSync('package.json', JSON.stringify(jsonifiedPackageJson, null, 2));
}

function main() { 
  console.time('done installing 🥯')
  
  updatePackageNumber(); 
  
  console.log('bun remove'); 

  execSync('bun remove -g bagels')

  console.log('publish');

  execSync('npm publish');
  
  console.log('bun install')
  execSync('bun i -g bagels')
  
  console.timeEnd('done installing 🥯')
}

main();