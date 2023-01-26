import fs from 'fs'
import solc from 'solc'
import { ContractFactory, ethers } from 'ethers'
import express from 'express'
import cors from 'cors'
import chokidar from 'chokidar'
import path, { parse } from 'path'
import { getSolcVersionFromContract } from '../utils.js'
import { execSync } from 'child_process'
import semver, { valid } from 'semver'
import fetch from 'node-fetch'

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545')
const wallet = new ethers.Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  provider,
)

// Need to pass it in because process.cwd() after this is ran from the worker prints the location of the bagels package on the user's computer
// So we pass in the directory the user is calling bagel from
const userRealDirectory = process.argv[2]

const PORT = 9090

const app = express()
app.use(express.json())
app.use(cors())

let client
let globalContract
let node_modulesDirLocation = ''
let libDirLocation = ''
let solidityFileDirMappings = {}
let globalAbis = {}

let historicalTransactions = []

app.get('/', (req, res) => {
  res.send('Debugging the contract')
})

function getSolidityFiles() {
  let filesReturned = getAllFiles(userRealDirectory)

  filesReturned.map((file) => {
    const basename = path.basename(file)
    solidityFileDirMappings[[basename]] = file
  })
}

app.get('/solidityFiles', async (req, res) => {
  try {
    getSolidityFiles()

    return res.status(200).send({ files: Object.keys(solidityFileDirMappings) })
  } catch (e) {
    console.log('error: ', e)
    return res.status(500).send({ error: e })
  }
})

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function (file) {
    // Keep track of node_modules folder location (for use in imports) and return (no need to scan entire node_modules folder)
    if (file.includes('node_modules')) {
      node_modulesDirLocation = path.join(dirPath, '/', file)
      return
    }
    // Same as above for lib/ (used in forge);
    else if (file.includes('lib')) {
      libDirLocation = path.join(dirPath, '/', file)
      return
    } else if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles)
    } else {
      // Only want .sol files, need to exclude .t.sol and .s.sol (forge)
      if (file.split('.').pop() === 'sol' && file.split('.').length === 2)
        arrayOfFiles.push(path.join(dirPath, '/', file))
    }
  })

  return arrayOfFiles
}

app.post('/deployContract', async (req, res) => {
  try {
    const { abi, bytecode, constructor } = req.body

    let [factory, contract] = await deployContracts(abi, bytecode, constructor)

    globalContract = contract

    return res.status(200).send({ message: 'Contract Deployed' })
  } catch (e) {
    console.log('Contract deployment error: ', e)
    return res.status(500).send({ error: e })
  }
})

app.get('/abi', async (req, res) => {
  const { contractName } = req.query

  try {
    let [abis, bytecode] = await compileContract(contractName)
    globalAbis = abis
    return res.status(200).send({ abi: globalAbis, bytecode: bytecode })
  } catch (e) {
    return res.status(500).send({ error: e })
  }
})

app.get('/balances', async (req, res) => {
  try {
    const ether_balance = await checkEtherBalance(provider, wallet.address)

    let balances = {
      eth: ether_balance,
    }

    res.status(200).send(balances)
  } catch (e) {
    console.error(e.message)
    res.status(500).send({ error: e })
  }
})

app.post('/executeTransaction', async (req, res) => {
  const { functionName, params, stateMutability, amount } = req.body

  try {
    if (
      stateMutability === 'view' ||
      stateMutability === 'nonpayable' ||
      stateMutability === 'payable'
    ) {
      // Need to just call the function
      let callFunctionString = 'globalContract.functions.' + functionName + '('

      // param[0] === value
      // param[1] === type
      for (let paramIndex = 0; paramIndex < params.length; paramIndex++) {
        // If it's a string, add quotation marks
        if (
          params[paramIndex][1] === 'string' ||
          params[paramIndex][1] === 'address'
        ) {
          callFunctionString += "'" + params[paramIndex][0] + "'"
        }
        // If not a string, no need for quotation marks
        else callFunctionString += params[paramIndex][0]

        // Add commas if there are multiple params
        if (paramIndex < params.length - 1) {
          callFunctionString += ','
        }
      }

      // payable functions
      if (stateMutability === 'payable' && amount > 0) {
        callFunctionString += `${
          params.length === 0 ? '' : ','
        }{value: ethers.utils.parseEther("${amount}")}`
      }

      callFunctionString += ')'

      const functionResult = await eval(callFunctionString)

      if (stateMutability === 'nonpayable' || stateMutability === 'payable') {
        historicalTransactions.unshift({
          res: functionResult,
          functionName: functionName,
          params: params,
          stateMutability: stateMutability,
        })
      }

      return res.send({
        result: functionResult[0] ? functionResult[0].toString() : '',
      })
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send({ error: e })
  }
})

app.get('/subscribeToChanges', async (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }
  res.writeHead(200, headers)
  res.write('data: {"msg": "redeployed"}\n\n')

  client = res

  req.on('close', () => {
    console.log(`Connection closed`)
    client = null
  })
})

app.post('/test', (req, res) => {
  refreshFrontend()
  res.send(200)
})

app.get('/getHistoricalTransactions', async (req, res) => {
  try {
    return res
      .status(200)
      .send({ historicalTransactions: historicalTransactions })
  } catch (e) {
    return res.status(500).send({ error: e })
  }
})

app.get('/currentContractAddress', (req, res) => {
  try {
    return res.status(200).send({ address: globalContract['address'] })
  } catch (e) {
    return res.status(500).send({ error: e })
  }
})

app.listen(PORT)

async function compileSpecificSolVersion(input, version) {
  return new Promise(async (resolve, reject) => {
    await solc.loadRemoteVersion(version, function (err, solcSnapshot) {
      if (err) {
        console.log('\n\n\nERROR!!!! loading remote version: ' + err + '\n\n\n')
        reject(err)
      } else {
        let output = JSON.parse(
          solcSnapshot.compile(JSON.stringify(input), { import: findImports }),
        )
        resolve(output)
      }
    })
  })
}

// Simply loop through solidity versions and pick the earliest version that is valid for the solc version specified in the contract
// Reason I did earliest version: some solc versions, like pragma solidity >0.5.1, will allow for 0.8.0 even if 0.8.0 contains non backward-compatible breaking changes
async function pickValidSolcVersion(contractSolcVersion) {
  // TODO: Probably should just cache this locally instead of making this API call (slow) so often
  const res = await fetch('https://binaries.soliditylang.org/bin/list.json')
  const parsedRes = await res.json()

  const validVersion = parsedRes['builds'].find((item) =>
    semver.satisfies(item['longVersion'], contractSolcVersion),
  )

  return 'v' + validVersion['longVersion']
}

async function compileContract(file) {
  try {
    if (JSON.stringify(solidityFileDirMappings) === '{}') getSolidityFiles()

    const fileAsString = fs
      .readFileSync(solidityFileDirMappings[file])
      .toString()

    let input = {
      language: 'Solidity',
      sources: {
        [file]: {
          content: fileAsString,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
      },
    }
    let output

    // Find specific solc version (slow, so commented out for now)
    // const installedSolcVersion = execSync('solcjs --version').toString().split('+')[0];
    // const installedSolcVersion = '0.8.17+commit.8df45f5f.Emscripten.clang';

    // const contractSolcVersion = getSolcVersionFromContract(fileAsString);
    // if (!semver.satisfies(installedSolcVersion, contractSolcVersion)) {
    //   const validSolcVersion = await pickValidSolcVersion(contractSolcVersion);
    //   output = await compileSpecificSolVersion(input, validSolcVersion);
    // }

    output = JSON.parse(
      solc.compile(JSON.stringify(input), { import: findImports }),
    )

    let abis = {}
    let byteCodes = {}

    // `output` here contains the JSON output as specified in the documentation
    for (let contractName in output.contracts[file]) {
      abis[contractName] = output.contracts[file][contractName].abi
      byteCodes[contractName] =
        output.contracts[file][contractName].evm.bytecode.object
    }

    return [abis, byteCodes]
  } catch (e) {
    console.log('e: ', e)
    throw new Error(
      `Couldn't compile contract ${file} because of error: ${e.message}`,
    )
  }
}

async function deployContracts(abis, bytecodes, constructor) {
  let abi = Object.values(abis)[0]
  const factory = new ContractFactory(abi, Object.values(bytecodes)[0], wallet)

  let deploymentString = 'factory.deploy('

  for (
    var currentIndex = 0;
    currentIndex < constructor.length;
    currentIndex++
  ) {
    let param = constructor[currentIndex][0]
    let type = constructor[currentIndex][1]

    if (type === 'string') deploymentString += "'" + param + "'"
    else deploymentString += param

    // Add commas if there are multiple params
    if (currentIndex < constructor.length) {
      deploymentString += ','
    }
  }

  deploymentString += ')'

  const contract = await eval(deploymentString)

  return [factory, contract]
}

async function checkEtherBalance(provider, address) {
  try {
    const balance = await provider.getBalance(address)
    const balanceInEther = ethers.utils.formatEther(balance)
    return balanceInEther
  } catch (e) {
    console.log('error getting balance: ', e)
    throw new Error(e.message)
  }
}

function findImports(fileName) {
  try {
    // Needed because sometimes imports look like: interfaces/IUniswapV2ERC20.sol while our mappings array would only have IUniswapV2ERC20.sol
    const justTheFileName = path.basename(fileName)

    let file

    // Import is another contract somewhere inside the root directory
    if (fs.existsSync(solidityFileDirMappings[justTheFileName])) {
      file = fs.readFileSync(solidityFileDirMappings[justTheFileName])
    } else {
      let nodePackagePath = path.join(node_modulesDirLocation, justTheFileName)
      let forgePackagePath = path.join(libDirLocation, justTheFileName)

      if (fs.existsSync(nodePackagePath)) {
        file = fs.readFileSync(nodePackagePath)
      } else if (fs.existsSync(forgePackagePath)) {
        file = fs.readFileSync(forgePackagePath)
      } else throw Error(`Couldn't find the import ${file}`)
    }

    return {
      contents: file.toString(),
    }
  } catch (e) {
    throw new Error(e.message)
  }
}

function refreshFrontend() {
  // send data to the client
  client.write('data: {"msg": "redeployed"}\n\n')
}

chokidar
  .watch(`${userRealDirectory}/**/*.sol`, {
    persistent: true,
    cwd: userRealDirectory,
  })
  .on('all', async (event, filePath) => {
    if (event === 'change') {
      try {
        console.log('Watching .sol file: ', event, filePath)

        // If changes are made to sol file, redeploy that file
        let [abis, bytecode] = await compileContract(path.basename(filePath))
        let [factory, contract] = await deployContracts(abis, bytecode, [])

        console.log(`Changes found in ${filePath}, redeployed contract`)

        globalContract = contract
        globalAbis = abis

        refreshFrontend()
      } catch (e) {
        console.log('Error deploying changed contracts: ', e.message)
      }
    }
  })
