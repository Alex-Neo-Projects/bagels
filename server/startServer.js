import fs from 'fs'
import solc from 'solc'
import { ContractFactory, ethers } from 'ethers'
import express from 'express'
import cors from 'cors'
import chokidar from 'chokidar'
import path from 'path'
import fetch from 'node-fetch'

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545')
// hardcoded private key from one of the anvil wallets
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

let client = null
let node_modulesDirLocation = ''
let libDirLocation = ''
let solidityFileDirMappings = {}
let contracts = {}

app.get('/', (req, res) => {
  res.send('Welcome to the bagels API')
})

app.get('/solidityFiles', async (req, res) => {
  try {
    getSolidityFiles()

    return res.status(200).send({ files: Object.keys(solidityFileDirMappings) })
  } catch (e) {
    return res.status(500).send({ error: e.message })
  }
})

app.post('/deployContract', async (req, res) => {
  try {
    const { contractFilename, constructor } = req.body

    if (!contractFilename) {
      throw new Error('Cannot deploy contract, no filename provided')
    }

    let firstDeploy =
      contracts[contractFilename]['historicalChanges'].length === 0

    if (firstDeploy) {
      const [abis, byteCodes] = await compileContract(contractFilename)

      let tempContract
      if (constructor.length > 0) {
        let [factory, contract] = await deployContracts(
          abis,
          byteCodes,
          constructor,
        )
        tempContract = contract
      } else {
        let [factory, contract] = await deployContracts(abis, byteCodes, [])
        tempContract = contract
      }
      const contract = createNewContract(contractFilename, abis, tempContract)

      contracts[contractFilename]['historicalChanges'].push(
        contracts[contractFilename]['currentVersion'],
      )
      contracts[contractFilename]['currentVersion'] = contract
    }

    return res.status(200).send({
      message: 'Contract Deployed',
      contract: contracts[contractFilename]['currentVersion'],
    })
  } catch (e) {
    return res.status(500).send({ error: e.message })
  }
})

app.get('/abi', async (req, res) => {
  try {
    const { contractName } = req.query
    let [abis, bytecode] = await compileContract(contractName)
    return res.status(200).send({ abi: abis, bytecode: bytecode })
  } catch (e) {
    return res.status(500).send({ error: e.message })
  }
})

app.get('/balances', async (req, res) => {
  try {
    const ether_balance = await checkEtherBalance(provider, wallet.address)
    res.status(200).send({
      eth: ether_balance,
    })
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})

app.post('/executeTransaction', async (req, res) => {
  try {
    const {
      contractFilename,
      amount,
      functionName,
      stateMutability,
      type,
      params,
    } = req.body

    if (
      !contractFilename ||
      amount < 0 ||
      !functionName ||
      !params ||
      !stateMutability ||
      !type
    ) {
      throw new Error(
        'Unable to execute transaction, please provide correct parameters',
      )
    }

    let iface = new ethers.utils.Interface(
      Object.values(contracts[contractFilename]['currentVersion']['abis']).flat(
        1,
      ),
    )
    const functionEncodedSignature = iface.encodeFunctionData(functionName, [
      ...params.map((param) => param[0]),
    ])

    if (stateMutability === 'view' || stateMutability === 'pure') {
      let paramData = {
        from: wallet.address,
        to:
          contracts[contractFilename]['currentVersion']['contract']['address'],
        data: functionEncodedSignature,
      }

      const txRes = await callTransaction(paramData)
      let functionRes = iface.decodeFunctionResult(
        functionName,
        txRes.result,
      )

      functionRes = functionRes.map((val) => val.toString())

      return res.status(200).send({ output: functionRes })
    } else {
      let paramData = {
        from: wallet.address,
        to:
          contracts[contractFilename]['currentVersion']['contract']['address'],
        value: amount ? amount : '0x0',
        data: functionEncodedSignature,
      }

      const txRes = await sendTransaction(paramData)
      const txReceipt = await getTransaction(txRes.result)

      // Store transaction in contract history
      let txData = {
        paramData: {
          functionName: functionName,
          params: params,
          stateMutability: stateMutability,
          type: type,
          amount: amount,
          rawData: functionEncodedSignature,
        },
        receipt: txReceipt.result,
      }

      contracts[contractFilename]['currentVersion']['transactions'].push(txData)

      return res.status(200).send(txData)
    }
  } catch (e) {
    return res.status(500).send({ error: e.message })
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

app.get('/getCurrentContract', async (req, res) => {
  try {
    const { contractFilename } = req.query
    if (!contractFilename) {
      throw new Error('No contract filename provided')
    }
    return res.status(200).send({ contract: contracts[contractFilename] })
  } catch (e) {
    return res.status(500).send({ error: e.message })
  }
})

app.get('/getTransactions', async (req, res) => {
  try {
    const { contractFilename } = req.query
    if (!contractFilename) {
      throw new Error('No contract filename provided')
    }
    return res.status(200).send({
      contract: contracts[contractFilename]['currentVersion']['transactions'],
    })
  } catch (e) {
    return res.status(500).send({ error: e.message })
  }
})

// Note: do not delete this, the console.log is needed by spawnBackend.js
// because this is the signal that the server is up and running!
app.listen(PORT, () => console.log('server started and listening for requests'))

function createNewContract(filename, abis, contract) {
  let res = {
    contract: contract,
    abis: abis,
    hasConstructor: hasConstructor(abis),
    transactions: [],
  }

  return res
}

async function sendTransaction(params) {
  try {
    const txRes = await fetch(`http://127.0.0.1:8545`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendTransaction',
        params: [params],
        id: 1,
      }),
    })

    if (txRes.status === 200) {
      return await txRes.json()
    } else {
      throw new Error('Unable to send tx')
    }
  } catch (e) {
    throw new Error(e.message)
  }
}

async function callTransaction(params) {
  try {
    const txRes = await fetch(`http://127.0.0.1:8545`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [params],
        id: 1,
      }),
    })

    if (txRes.status === 200) {
      return await txRes.json()
    } else {
      throw new Error('Unable to send tx')
    }
  } catch (e) {
    throw new Error(e.message)
  }
}

async function getTransaction(txHash) {
  try {
    const txRes = await fetch(`http://127.0.0.1:8545`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    })

    if (txRes.status === 200) {
      return await txRes.json()
    } else {
      throw new Error('Unable to get tx')
    }
  } catch (e) {
    throw new Error(e.message)
  }
}

function getSolidityFiles() {
  let filesReturned = getAllFiles(userRealDirectory)
  filesReturned.map((file) => {
    const basename = path.basename(file)
    solidityFileDirMappings[[basename]] = file

    if (!(basename in contracts)) {
      contracts[basename] = {
        currentVersion: {},
        historicalChanges: [],
      }
    }
  })
}

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

    let output = JSON.parse(
      solc.compile(JSON.stringify(input), { import: findImports }),
    )

    // check if any errors with severity 'error' exists
    let errors = output.errors

    if (errors) {
      let err = errors.filter((error, _) => error.severity === 'error')
      if (err.length > 0) {
        throw new Error(JSON.stringify({ errors: err }))
      }
    }

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
    throw new Error(e.message)
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
      let nodePackagePath = path.join(node_modulesDirLocation, fileName)
      let forgePackagePath = path.join(libDirLocation, fileName)

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
  if (client) {
    client.write('data: {"msg": "redeployed"}\n\n')
  }
}

function sendErrorToFrontend(errorMessage) {
  if (client) {
    client.write(`data: {"error": "${errorMessage}"}\n\n`)
  }
}

function hasConstructor(abis) {
  return (
    Object.values(abis)
      .flat(2)
      .filter((curr) => curr.type === 'constructor').length > 0
  )
}

chokidar
  .watch(`${userRealDirectory}/**/*.sol`, {
    persistent: true,
    cwd: userRealDirectory,
  })
  .on('all', async (event, filePath) => {
    if (event === 'change') {
      console.log(`Changes found in ${filePath}, redeploying contract`)

      let fileBasename = path.basename(filePath)
      let [abis, bytecode] = await compileContract(fileBasename)

      let tempContract = null
      if (!hasConstructor(abis)) {
        let [factory, contract] = await deployContracts(abis, bytecode, [])
        tempContract = contract
      }

      contracts[fileBasename]['historicalChanges'].push(
        contracts[fileBasename]['currentVersion'],
      )
      contracts[fileBasename]['currentVersion'] = createNewContract(
        filePath,
        abis,
        tempContract === null ? {} : tempContract,
      )
      return refreshFrontend()
    }
  })
  .on('error', (e) => {
    sendErrorToFrontend(e.message)
  })
