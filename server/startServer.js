import fs from 'fs'
import solc from 'solc'
import { ContractFactory, ethers } from 'ethers'
import express from 'express'
import cors from 'cors'
import chokidar from 'chokidar'
import path from 'path'
import { getFilepath, getPathDirname } from '../utils.js'

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
let globalAbis = {}

app.get('/', (req, res) => {
  res.send('Debugging the contract')
})

app.get('/solidityFiles', async (req, res) => {
  try {
    const files = fs.readdirSync(userRealDirectory)
    var solidityFiles = files.filter((file) => file.split('.').pop() === 'sol')

    console.log('done getting')
    return res.status(200).send({ files: solidityFiles })
  } catch (e) {
    return res.status(500).send({ error: e })
  }
})

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
    console.log(e)
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

      // console.log(callFunctionString)

      const functionResult = await eval(callFunctionString)

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

app.listen(PORT)

async function compileContract(file) {
  try {
    let input = {
      language: 'Solidity',
      sources: {
        [file]: {
          content: fs.readFileSync(
            path.resolve(userRealDirectory, file),
            'utf8',
          ),
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

    let output = JSON.parse(
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
    throw new Error(`Couldn't compile contract ${file} because of error: ${e}`)
  }
}

// NOTE: currently this only deploys 1 contract at a time
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

  console.log('b4 eval: ', deploymentString)

  const contract = await eval(deploymentString)
  console.log('Deployed Contract')

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

// Note: There HAS to be a better way to do this. But this is an initial first attempt, so I can figure out what a better solution could look like
// Finding imports explantion:
// nodeModulesImportPath == contract and node_modules are in the same directory (flat structure): 
  // test.sol
  // node_modules/
// outsideNodeModulesImportPath == the contract is nested compared to the node modules: 
  // contracts/
    // test.sol
  // node_modules/
// Man, file systems SUCK.
function findImports(filePath) {
  try {

    let nodeModulesFlatImportPath = getFilepath([
      userRealDirectory,
      'node_modules',
      filePath,
    ])

    let nodeModulesNestedImportPath = getFilepath([
      path.join(userRealDirectory, '..'),
      'node_modules',
      filePath,
    ])

    let forgeFlatLibImportPath = getFilepath([
      userRealDirectory,
      'lib',
      filePath,
    ])

    let forgeNestedLibImportPath = getFilepath([
      path.join(userRealDirectory, '..'),
      'lib',
      filePath,
    ])

    let fileInCurrentDir = path.join(userRealDirectory, filePath);

    let file;
    
    // Import is another contract in the current directory
    if (fs.existsSync(fileInCurrentDir)) {
      file = fs.readFileSync(fileInCurrentDir)
    }
    else {
      let isNodeModulesImportFlat = fs.existsSync(nodeModulesFlatImportPath);
      let isNodeModulesImportNested = fs.existsSync(nodeModulesNestedImportPath);

      let isForgeImportFlat = fs.existsSync(forgeFlatLibImportPath); 
      let isForgeImportNested = fs.existsSync(forgeNestedLibImportPath); 

      if (isNodeModulesImportFlat) file = fs.readFileSync(nodeModulesFlatImportPath);
      else if (isNodeModulesImportNested) file = fs.readFileSync(nodeModulesNestedImportPath);
      else if (isForgeImportFlat) file = fs.readFileSync(forgeFlatLibImportPath);
      else if (isForgeImportNested) file = fs.readFileSync(forgeNestedLibImportPath);
      else throw Error(`Couldn't find the import ${filePath}`)
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
  .on('all', async (event, path) => {
    if (event === 'change') {
      try {
        console.log('Watching .sol file: ', event, path)

        // If changes are made to sol file, redeploy that file
        let [abis, bytecode] = await compileContract(path)
        let [factory, contract] = await deployContracts(abis, bytecode, [])

        console.log(`Changes found in ${path}, redeployed contract`)

        globalContract = contract
        globalAbis = abis

        refreshFrontend()
      } catch (e) {
        console.log('Error deploying changed contracts: ', e.message)
      }
    }
  })
