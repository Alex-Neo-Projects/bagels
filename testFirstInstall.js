import { exec, execSync } from 'child_process'

function runWithTryCatch(line) {
  try {
    line();
  } 
  catch (e) {}
}

function convertToSeconds(milliseconds) {
  return milliseconds / 1000;
}

const bunUninstall = new Promise((resolve, reject) => {
  exec('bun remove -g bagels', (error, stdout, stderr) => {
    if (error) {
      reject(error);
    } else {
      resolve({ stdout, stderr });
    }
  });
});

const npmUninstall = new Promise((resolve, reject) => {
  exec('npm uninstall -g bagels', (error, stdout, stderr) => {
    if (error) {
      reject(error);
    } else {
      resolve({ stdout, stderr });
    }
  });
});

const yarnUninstall = new Promise((resolve, reject) => {
  exec('yarn global remove bagels', (error, stdout, stderr) => {
    if (error) {
      reject(error);
    } else {
      resolve({ stdout, stderr });
    }
  });
});


console.time('done UNinstalling 🥯 from bun, yarn, and npm')
Promise.all([bunUninstall, yarnUninstall, npmUninstall]);

console.timeEnd('done UNinstalling 🥯 from bun, yarn, and npm')

const start = Date.now();

const bunPromise = new Promise((resolve, reject) => {
  exec('bun i -g bagels', (error, stdout, stderr) => {
    if (error) {
      reject(error);
    } else {
      console.log(`bun time taken: ${convertToSeconds(Date.now() - start)}s`);
      resolve({ stdout, stderr });
    }
  });
});

const yarnPromise = new Promise((resolve, reject) => {
  exec('yarn global add bagels', (error, stdout, stderr) => {
    if (error) {
      console.log('rejecting yarn with: ', error);
      reject(error);
    } else {
      console.log(`yarn time taken: ${convertToSeconds(Date.now() - start)}s`);
      resolve({ stdout, stderr });
    }
  });
});

const npmPromise = new Promise((resolve, reject) => {
  exec('npm i -g bagels', (error, stdout, stderr) => {
    if (error) {
      console.log('rejecting NPM with: ', error);
      reject(error);
    } else {
      console.log(`NPM time taken: ${convertToSeconds(Date.now() - start)}s`);
      resolve({ stdout, stderr });
    }
  });
});

Promise.all([yarnPromise, npmPromise, bunPromise])