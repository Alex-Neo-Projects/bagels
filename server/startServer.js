import path from 'path'
import fs from 'fs'
import solc from 'solc'
import { ContractFactory, ethers } from 'ethers'
import express from 'express'
import { usdc_abi } from './abis/usdc.js'
import cors from 'cors'
import chokidar from 'chokidar'

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545')
const wallet = new ethers.Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  provider,
)

const PORT = 9090

const app = express()
const __dirname = path.resolve()
app.use(express.json())
app.use(cors())

let globalContract;

// Adding a server for ui tool
app.get('/', (req, res) => {
  res.send('Debugging the contract')
})

let globalAbis = {}
let solidityFiles = []; 

const getFiles = (path) => {
  if (fs.lstatSync(path).isDirectory()) { 
    fs.readdirSync(path).forEach(f => {   
      getFiles(path + '/' + f)
    })
  } else if (path.endsWith(".sol")) {
    console.log('pushing')
    solidityFiles.push(path)
  }

  return solidityFiles; 
}

app.get('/solidityFiles', async (req, res) => {
  const files = fs.readdirSync(__dirname)

  var solidityFiles = files.filter((file) => file.split('.').pop() === 'sol')

  return res.status(200).send({'files': solidityFiles})
}); 

app.post('/deployContract', async (req, res) => {
  try { 
    const { abi, bytecode, constructor } = req.body; 
  
    let [factory, contract] = await deployContracts(abi, bytecode, constructor)
    globalContract = contract
  
    return res.status(200).send('asdf')
  } catch (e) {
    console.log('contract deployment error: ', e);

    return res.status(500).send({'error': e});
  }
})

app.get('/abi', async (req, res) => {
  const { contractName } = req.query; 

  let [abis, bytecode] = await compileContract(contractName)

  globalAbis = abis;

  return res.status(200).send({'abi': globalAbis, 'bytecode': bytecode})
})

app.get('/balances', async (req, res) => {
  try {
    const ether_balance = await checkEtherBalance(provider, wallet.address)
    const usdc_balance = await checkUSDCBalance(provider, wallet.address)

    let balances = {
      eth: ether_balance,
      usdc: usdc_balance,
    }

    res.send(balances)
  } catch (e) {
    console.error(e.message)
  }
})

app.post('/fundUSDC', async (req, res) => {
  const receipt = await fundUSDC(provider, wallet)
  res.send(receipt)
})

// Construct function from abi
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
      for (var paramIndex = 0; paramIndex < params.length; paramIndex++) {
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
        callFunctionString += `{value: ethers.utils.parseEther("${amount}")}`
      }
      callFunctionString += ')'

      console.log(callFunctionString);

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

app.listen(PORT, () => {
  // console.log(`Listening to server on PORT ${PORT}`)
})

async function compileContract(file) {
  try { 
    var input = {
      language: 'Solidity',
      sources: {
        [file]: {
          content: fs.readFileSync(path.resolve(__dirname, file), 'utf8'),
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
  
    var output = JSON.parse(
      solc.compile(JSON.stringify(input), { import: findImports })
    );
  
    let abis = {}
    let byteCodes = {}
  
    // `output` here contains the JSON output as specified in the documentation
    for (var contractName in output.contracts[file]) {
      abis[contractName] = output.contracts[file][contractName].abi
      byteCodes[contractName] = output.contracts[file][contractName].evm.bytecode.object
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

  for (var currentIndex = 0; currentIndex < constructor.length; currentIndex++) {
    let param = constructor[currentIndex][0];
    let type = constructor[currentIndex][1]; 

    if (type === 'string')
      deploymentString += "'" + param + "'"
    else deploymentString += param

    // Add commas if there are multiple params
    if (currentIndex < constructor.length) {
      deploymentString += ','
    }
  }

  deploymentString += ')'

  console.log('b4 eval: ', deploymentString);

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

async function checkUSDCBalance(provider, address) {
  const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

  try {
    const contract = new ethers.Contract(tokenAddress, usdc_abi, provider)
    const usdcBalance = await contract.balanceOf(address)
    const decimal = 10 ** 6
    const formatBalance = (usdcBalance / decimal).toString()

    return formatBalance
  } catch (e) {
    throw new Error(e.message)
  }
}

async function fundUSDC(provider, wallet) {
  const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const abi = usdc_abi
  try {
    let contract = new ethers.Contract(tokenAddress, abi, provider)

    const masterMinter = await contract.masterMinter()
    const masterMinter_signer = await provider.getSigner(masterMinter)

    await provider.send('hardhat_setBalance', [
      masterMinter,
      ethers.utils.parseEther('1.0').toHexString().replace('0x0', '0x'),
    ])

    await provider.send('anvil_impersonateAccount', [masterMinter])

    let c_tx = await contract
      .connect(masterMinter_signer)
      .configureMinter(wallet.address, 1000000000, {
        from: masterMinter,
        gasLimit: 300000,
      })
    let receipt = await c_tx.wait()

    const amount = ethers.utils.parseUnits('100', 6)
    const mint = await contract.connect(wallet).mint(wallet.address, amount, {
      from: wallet.address,
    })
    let mint_receipt = await mint.wait()
    return mint_receipt
  } catch (e) {
    throw new Error(e.message)
  }
}

function findImports(path) { 
  // Find the contract import in node_modules
  let importInNodeModules = __dirname.split('/packages')[0] + '/node_modules/' + path;

  let filesInCurrentDir = fs.readdirSync(process.cwd()); 

  let file;

  // Import is another contract in the current directory
  let fileIndex = filesInCurrentDir.findIndex(item => item === path); 
  if (fileIndex !== -1) { 
    file = fs.readFileSync(filesInCurrentDir[fileIndex]);
  }
  // Import is a file in the node_modules folder
  else { 
    file = fs.readFileSync(importInNodeModules); 
  }

  return { 
    contents: file.toString()
  }
}

const dirPath = path.join(__dirname, '..', 'backend')
chokidar
  .watch(`${dirPath}/**/*.sol`, {
    persistent: true,
    cwd: dirPath,
  })
  .on('all', async (event, path) => {
    if (event === 'change') {
      try { 
        console.log('WATCHING SOL FILE: ', event, path)

        // If changes are made to sol file, redeploy that file
        let [abis, bytecode] = await compileContract(path)
        let [factory, contract] = await deployContracts(abis, bytecode)
  
        console.log(`Changes found in ${path}, redeployed contract`)
  
        globalContract = contract
        globalAbis = abis
      }
      catch (e) { 
        console.log("ERROR: ", e.toString()); 
      }
    }
  })