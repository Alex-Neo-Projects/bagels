import { exec, execSync } from 'child_process'
import chalk from 'chalk';
import fs from 'fs';
  
const start = Date.now();

function convertToSeconds(milliseconds) {
  return milliseconds / 1000;
}

async function updateBenchmarksFile(yarnInstallTime, bunInstallTime, npmInstallTime) {
  const packageJson = fs.readFileSync('../package.json')

  const jsonifiedPackageJson = await JSON.parse(packageJson);
  let version = jsonifiedPackageJson['version']; 

  let installTimeObjects = {
    'bun i -g bagels': `${bunInstallTime}s`,
    'yarn global add bagels': `${yarnInstallTime}s`,
    'npm i -g bagels': `${npmInstallTime}s`
  }

  const firstInstallJson = fs.readFileSync('../__benchmarks__/firstInstall.json')
  const jsonifiedFirstInstallJson = await JSON.parse(firstInstallJson)

  jsonifiedFirstInstallJson[version] = installTimeObjects; 

  fs.writeFile('../__benchmarks__/firstInstall.json', JSON.stringify(jsonifiedFirstInstallJson, null, 2), 'utf-8', (err) => {
    if (err) throw err;
    console.log('Saved results to the __benchmarks__ folder');
  });
}

function bunUninstall() {
  return new Promise((resolve) => {
    // Bun throws an error when trying to uninstall it if it already exists
    try { 
      resolve(execSync('bun remove -g bagels'));
    } catch (e) {resolve()};
  });
}


function yarnUninstall() {
  return new Promise((resolve) => {
    try {
      resolve(execSync('yarn global remove bagels'));
    } catch (e) {resolve()};
  });
}

function npmUninstall() {
  return new Promise((resolve) => {
    try { 
      resolve(execSync('npm uninstall -g bagels'));
    } catch (e) {resolve()};
  });
}

function bunInstall() {
  return new Promise((resolve, reject) => {
    exec('bun i -g bagels', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        let bunInstallTime = convertToSeconds(Date.now() - start);
        console.log(chalk.blue.bold('bun install time taken') + `: ${bunInstallTime}s`);
        resolve(bunInstallTime);
      }
    });
  });
}

function yarnInstall() {
  return new Promise((resolve, reject) => {
    exec('yarn global add bagels', (error, stdout, stderr) => {
      if (error) {
        console.log('rejecting yarn with: ', error);
        reject(error);
      } else {
        let yarnInstallTime = convertToSeconds(Date.now() - start)
        console.log(chalk.yellow.bold('Yarn install time taken') + `: ${yarnInstallTime}s`);
        resolve(yarnInstallTime);
      }
    });
  });
}

function npmInstall() { 
  return new Promise((resolve, reject) => {
    exec('npm i -g bagels', (error, stdout, stderr) => {
      if (error) {
        console.log('rejecting NPM with: ', error);
        reject(error);
      } else {
        let npmInstallTime = convertToSeconds(Date.now() - start);
        console.log(chalk.green.bold('NPM install time taken') + `: ${npmInstallTime}s`);
        resolve(npmInstallTime);
      }
    });
  })
};

export async function firstInstallTimes() { 
  console.time('totalTime')
  
  console.time('UNinstalling 🥯 from bun, yarn, and npm')
  await Promise.all([bunUninstall(), yarnUninstall(), npmUninstall()]);
  console.timeEnd('UNinstalling 🥯 from bun, yarn, and npm')
  
  // Install the package
  // (prints out the time result from within each promise)
  const [yarnInstallTime, npmInstallTime, bunInstallTime] = await Promise.all([yarnInstall(), npmInstall(), bunInstall()])
  
  updateBenchmarksFile(yarnInstallTime, bunInstallTime, npmInstallTime); 
  
  console.time('Cleaning up and UNinstalling 🥯')
  await Promise.all([bunUninstall(), yarnUninstall(), npmUninstall()]);
  console.timeEnd('Cleaning up and UNinstalling 🥯')
  
  console.timeEnd('totalTime')
}

firstInstallTimes();