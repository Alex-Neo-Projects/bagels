import fs from 'fs'
import bagelsSolc from "bagels-solc-js";
import { ContractFactory, ethers } from 'ethers'
import express from 'express'
import cors from 'cors'
import chokidar from 'chokidar'
import path from 'path'
import fetch from 'node-fetch'
import { getPragmaSolidity } from './parseSolcVersion.js';

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
    const solidityFiles = getSolidityFiles()

    return res.status(200).send({ files: solidityFiles})
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

    let firstDeploy = false

    // This would be easier in typescript... simply contracts?.contractFilename?.historicalChanges?.length === 0 😩
    if (contracts[contractFilename]) {
      if (contracts[contractFilename]['historicalChanges'].length === 0) {
        firstDeploy = true
      }
    }

    if (firstDeploy || constructor.length > 0) {
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

    let txRes
    let txReceipt

    // Convert the value to a hex value since the frontend sends ints
    let hexAmount = amount ? amount.toString(16) : '0x0'

    let paramData = {
      from: wallet.address,
      to: contracts[contractFilename]['currentVersion']['contract']['address'],
      value: hexAmount,
      data: functionEncodedSignature,
    }

    if (!paramData.to) {
      throw new Error("Error: Couldn't deploy contract.")
    }

    // Need to use eth_call RPC function for view only functions
    if (
      stateMutability === 'pure' ||
      stateMutability === 'view' ||
      stateMutability === 'constant'
    ) {
      txRes = await callContractFunction(paramData)

      // No tx receipt returned by eth_call since it's not modifying state.
      txReceipt = null

      let output = '';
      if (txRes['error']) {
        output += txRes['error']['message'];
      } else {
        output += 'Output: ' + decodeFunctionResult(iface, functionName, txRes.result)
      }

      txRes.result = output;
    }
    // If it's a write function, we need to use the send_transaction RPC call
    else {
      txRes = await sendTransaction(paramData)


      let txHash = txRes.result;
      txReceipt = await getTransaction(txRes.result)

      // 0 === failed tx
      // 1 === succeesed
      const txStatus = parseInt(txReceipt.result.status, 16);

      if (txStatus === 0) {
        // For some reason, the tx fail logs are always empty, so I haven't been able to 
        // get the revert reason.
        txRes['error'] = {'message': 'Transaction failed (reverted)'};
      } else {
        const decoded = decodeFunctionResult(iface, functionName, txRes.result);
        
        let txOutput = '';

        if (decoded) { 
          txOutput += 'Output: ' + decodeFunctionResult(iface, functionName, txRes.result) + '\n\n';
        }
        txOutput += `Transaction hash: ${txHash}`

        txRes.result = txOutput;
      }

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
        receipt: txReceipt ? txReceipt.result : null,
      }

      contracts[contractFilename]['currentVersion']['transactions'].push(txData)
    }

    if (txRes.error) {
      return res.status(500).send({ error: txRes.error.message })
    }

    return res.status(200).send({ output: [txRes.result] })
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

// Note: do not delete this, the console.log is needed by spawnBackend.js
// because this is the signal that the server is up and running!
app.listen(PORT, () => console.log('server started and listening for requests'))

function decodeFunctionResult(iface, functionName, txResult) {
  let functionResult = iface.decodeFunctionResult(functionName, txResult);

  let finalResult = '';
  for (var index = 0; index < functionResult.length; index++) {
    finalResult += functionResult[index].toString()

    if (functionResult.length > 1 && index !== functionResult.length -1) { 
      finalResult += ', '
    }
  }

  return finalResult;
}

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

async function callContractFunction(params) {
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

  let returnValues = []; 

  filesReturned.map((file) => {
    const readFile = fs.readFileSync(file).toString();
    const lines = readFile.split('\n'); 

    // Set to true if we have evidence that a file is a contract and not an interface or library 
    let isContract = false;

    lines.forEach((line) => {
      if (line.includes('contract ')) {
        // TODO: Write unit tests to try more ideas later.
        // Invalid examples of the contract string: 
        // contract is contained by quotes: return "This is a new contract ";
        // Contract is on the same line as a comment: // this is for a contract of type X

        if (!line.includes('//')) {
          if (!line.includes(";")) {
            isContract = true;
          }
        }
      } 
    })

    // Still need to add interface/library contracts to solidityFileDirMappings since they could be imported elsewhere.
    const basename = path.basename(file)
    solidityFileDirMappings[[basename]] = file
    
    if (!(basename in contracts)) {
      contracts[basename] = {
        currentVersion: {},
        historicalChanges: [],
      }
    }
    
    // Only return contracts contracts that are not an interface or library to the bagels UI
    if (isContract) {
      returnValues.push(basename);
    }
  })

  return returnValues;
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

    const specificSolVersion = bagelsSolc.default;

    const contractPragmaVersion = getPragmaSolidity(fileAsString);
    const solc = await specificSolVersion(contractPragmaVersion);

    let output = JSON.parse(
      solc.compile(JSON.stringify(input), { import: findImports }),
    )

    // check if any errors with severity 'error' exists
    let errors = output.errors

    if (errors) {
      let err = errors
        .filter((error) => error.severity === 'error')
        .map((error) => error.formattedMessage)

      if (err.length > 0) {
        throw new Error(err)
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

  try {
    for (
      var currentIndex = 0;
      currentIndex < constructor.length;
      currentIndex++
    ) {
      let param = constructor[currentIndex][0]
      let type = constructor[currentIndex][1]

      if (type === 'string') deploymentString += `"${param}"`
      else if (type === 'address') deploymentString += `"${param}"`
      else deploymentString += param

      // Add commas if there are multiple params
      if (currentIndex < constructor.length) {
        deploymentString += ','
      }
    }
    deploymentString += ')'

    const contract = await eval(deploymentString)

    return [factory, contract]
  } catch (e) {
    return [null, null]
  }
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
      // Given an import like @openzeppelin/Test
      // This assumes folder structure
      let nodePackagePath = path.join(node_modulesDirLocation, fileName)
      
      // Whereas this assumes the file is in node_modules/test.sol
      let fileInNodePackagePath = path.join(node_modulesDirLocation, justTheFileName)

      // Same situation for forge. Especially useful for forge since you might
      // have a folder called lib/ that's *not* used in forge
      let forgePackagePath = path.join(libDirLocation, fileName)
      let fileInForgePackagePath = path.join(libDirLocation, justTheFileName)

      if (fs.existsSync(nodePackagePath)) {
        file = fs.readFileSync(nodePackagePath)
      } 
      else if (fs.existsSync(fileInNodePackagePath)) {
        file = fs.readFileSync(fileInNodePackagePath);
      }
      else if (fs.existsSync(forgePackagePath)) {
        file = fs.readFileSync(forgePackagePath)
      } 
      else if (fs.existsSync(fileInForgePackagePath)) {
        file = fs.readFileSync(fileInForgePackagePath);
      } 
      else throw Error(`Couldn't find the import ${fileName}`)
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
  if (!abis) return null

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

      let tempAbis = null
      let tempBytcode = null
      try {
        let [abis, bytecode] = await compileContract(fileBasename)

        tempAbis = abis
        tempBytcode = bytecode
      } catch (e) {
        // This will refresh the frontend, then deploy the new version.
        // The errors will show on the frontend because they'll be received from the deploy
        return refreshFrontend()
      }

      // We check for constructors here because we only auto-deploy contracts w/ constructors
      let tempContract = null
      if (!hasConstructor(tempAbis)) {
        let [factory, contract] = await deployContracts(
          tempAbis,
          tempBytcode,
          [],
        )
        tempContract = contract
      }

      contracts[fileBasename]['historicalChanges'].push(
        contracts[fileBasename]['currentVersion'],
      )

      contracts[fileBasename]['currentVersion'] = createNewContract(
        filePath,
        tempAbis,
        tempContract === null ? {} : tempContract,
      )

      return refreshFrontend()
    }
  })
  .on('error', (e) => {
    sendErrorToFrontend(e.message)
  })
