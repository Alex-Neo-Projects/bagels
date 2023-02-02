import fs from 'fs'; 
import { exec, execSync } from 'child_process'
import fetch from 'node-fetch';

async function updatePackageNumber(version) { 
  return new Promise(async (resolve, reject) => {
    try {
      const packageJson = fs.readFileSync('package.json')

      const jsonifiedPackageJson = await JSON.parse(packageJson);

      // Step 1: update the package # 
      let splits = version.split('.');
      let numberVer = parseInt(splits[2])
    
      splits[2] = (numberVer += 1).toString();
    
      const newVersion = splits.join('.');
    
      jsonifiedPackageJson['version'] = newVersion; 
    
      fs.writeFileSync('package.json', JSON.stringify(jsonifiedPackageJson, null, 2));
  
      resolve();
    } catch (e) { 
      reject(e);
    }
  })
}

async function getLatestVersionFromNPM() { 
  return new Promise(async (resolve, reject) => {
    try { 
      const response = await fetch('https://registry.npmjs.org/bagels')
      const parsedResponse = await response.json(response); 

      const latestVersion = parsedResponse['dist-tags']['latest']

      resolve(latestVersion);
    } catch (e) { 
      reject(e);
    }
  })
}

async function main() { 
  console.time('Got latest version from NPM')
  const latestVersion = await getLatestVersionFromNPM();
  console.timeEnd('Got latest version from NPM')

  console.time('updated package number')
  await updatePackageNumber(latestVersion); 
  console.timeEnd('updated package number')

  console.time('done publishing')
  execSync('npm publish');
  console.timeEnd('done publishing')
}

main();