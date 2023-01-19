import React from 'react'
import { useState, useEffect } from 'react'
import { TextInputs } from './components/TextInputs'

const PORT = 9090

export default function Root() {
  const [solidityFiles, setSolidityFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState()

  const [selectedFile, setSelectedFile] = useState('')
  const [selectedFileLoading, setSelectedFileLoading] = useState(false)
  const [selectedFileError, setSelectedFileError] = useState('')

  const [balances, setBalances] = useState()
  const [abiState, setAbiState] = useState()
  const [constructorInputs, setConstructorInputs] = useState()
  const [funding, setFunding] = useState(false)
  const [fundingReceipt, setFundingReceipt] = useState([])
  const [bytecode, setBytecode] = useState()

  // Fetches initial solidity files
  useEffect(() => {
    async function loadBasics() {
      try {
        setLoadingFiles(true)
        await getSolidityFiles()
        setLoadingFiles(false)
      } catch (e) {
        setLoadingFiles(false)
        setError(e)
      }
    }
    loadBasics()
  }, [])

  async function getSolidityFiles() {
    const result = await fetch(`http://localhost:${PORT}/solidityFiles`, {
      method: 'GET',
    })
    const jsonifiedResult = await result.json()
    if (result.status === 200) {
      setSolidityFiles(jsonifiedResult['files'])
    } else {
      throw new Error(JSON.stringify(jsonifiedResult['error']))
    }
  }
  //

  // Compiles the contract
  useEffect(() => {
    async function runStart() {
      try {
        await getBalance()

        const { returnedAbi, bytecode } = await getABI(selectedFile)

        let constructors = getConstructorInputs(returnedAbi)

        if (constructors.length > 0) {
          setConstructorInputs(constructors)
          return
        }

        await deployContract(returnedAbi, bytecode, '')
      } catch (e) {
        setSelectedFileError(e.message)
      }
    }

    if (selectedFile) {
      runStart()
    }
  }, [funding, selectedFile])

  async function getBalance() {
    const balance = await fetch(`http://localhost:${PORT}/balances`, {
      method: 'GET',
    })
    const jsonifiedBalance = await balance.json()

    if (balance.status === 200) {
      setBalances({ balances: jsonifiedBalance })
    } else {
      throw new Error(JSON.stringify(jsonifiedResult['error']))
    }
  }

  async function deployContract(abi, bytecode, constructors) {
    const deployment = await fetch(`http://localhost:${PORT}/deployContract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        abi: abi,
        bytecode: bytecode,
        constructor: constructors,
      }),
    })

    if (deployment.status === 200) {
    } else {
      // TODO: Make this a page instead
      console.log('ERROR DEPLOYING THE CONTRACT!!!!')
      throw new Error(JSON.stringify(jsonifiedResult['error']))
    }
  }

  async function getABI(selectedFile) {
    const abiAndBytecode = await fetch(
      `http://localhost:${PORT}/abi?contractName=${selectedFile}`,
      {
        method: 'GET',
      },
    )

    const jsonifiedAbiAndBytecode = await abiAndBytecode.json()

    if (abiAndBytecode.status === 200) {
      setAbiState(jsonifiedAbiAndBytecode['abi'])
      setBytecode(jsonifiedAbiAndBytecode['bytecode'])

      return {
        returnedAbi: jsonifiedAbiAndBytecode['abi'],
        bytecode: jsonifiedAbiAndBytecode['bytecode'],
      }
    } else {
      throw new Error(JSON.stringify(jsonifiedResult['error']))
    }
  }

  function getConstructorInputs(abi) {
    let abiValues = Object.values(abi)[0]

    for (var x = 0; x < abiValues.length; x++) {
      let currentItem = abiValues[x]

      if (currentItem['type'] === 'constructor') {
        let inputs = []

        currentItem['inputs'].forEach((element) => {
          inputs.push(element['type'])
        })

        return inputs
      }
    }
    return []
  }

  function renderFunctionHeader(val) {
    let header = ''
    switch (val.type) {
      case 'function':
        header += `function ${val.name}(${inputsToString(val.inputs)}) ${
          val.stateMutability
        }`
        break
      case 'receive':
        header += `function ${val.name}(${inputsToString(val.inputs)}) ${
          val.stateMutability
        }`
        break
      case 'constructor':
        header += `constructor(${inputsToString(val.inputs)}) ${
          val.stateMutability
        }`
        break
      case 'fallback':
        header += `fallback() ${val.stateMutability}`
        break
      default:
        ''
    }

    return header
  }

  function inputsToString(valInputs) {
    const param = valInputs.map((input, idx) => {
      if (input) {
        return `${input.type} ${input.name}${
          valInputs.length - 1 === idx ? '' : ','
        }`
      } else {
        return ''
      }
    })

    return param
  }

  if (!selectedFile) {
    return (
      <div>
        <h1>Select a contract:</h1>
        {loadingFiles && <h2>Loading Contracts</h2>}
        {error && !loadingFiles && (
          <h2>Error loading contracts: {error.message}</h2>
        )}
        {!error && !loadingFiles && (
          <div>
            {solidityFiles.map((file, idx) => (
              <button
                key={idx.toString()}
                onClick={() => {
                  setSelectedFile(file)
                }}
              >
                {file}
              </button>
            ))}
          </div>
        )}
        {!error && !loadingFiles && solidityFiles.length === 0 && (
          <h2>No solidity files found.</h2>
        )}
      </div>
    )
  }

  if (constructorInputs) {
    return (
      <div>
        <p>Enter constructors</p>
        <button onClick={() => deployContract(abiState, bytecode, 'asdfasdf')}>
          asdfasdf
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => {
          setSelectedFile('')
        }}
      >
        Back
      </button>
      <h1>Selected File: {selectedFile}</h1>

      {!abiState || !balances ? (
        <div>
          <h2>Loading</h2>
        </div>
      ) : (
        <div>
          <div>
            <h2>Contract {Object.keys(abiState)[0] || ''}</h2>
          </div>

          <div>
            <h2>Connected to wallet with address: </h2>
            <h3>0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</h3>
            <h2>Private key: </h2>
            <h3>
              0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            </h3>
          </div>

          <div>
            <h2>Address Balance</h2>
            <div>
              {Object.entries(balances.balances).map(([name, value], idx) => {
                return (
                  <div key={idx.toString()}>
                    <h3>
                      {name}: {value}
                    </h3>
                  </div>
                )
              })}
            </div>
          </div>

          {/* <div>
            <p className="text-xl font-bold">ERC20 Token Faucet</p>

            <div className="flex mt-2">
              {funding ? (
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-4 h-4 mr-3 text-black animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <button
                  className="text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-4 pr-4 p-4 rounded-xl bg-[#3670F9]"
                  onClick={async () => {
                    setFunding(true)
                    const r = await fetch('http://localhost:3001/fundUSDC', {
                      method: 'POST',
                    })
                    const receipt = await r.json()
                    setFundingReceipt((prev) => [receipt, ...prev])
                    setFunding(false)
                  }}
                  disabled={funding}
                >
                  Drip 100 USDC
                </button>
              )}
            </div>
          </div> */}

          <div>
            <h2>ABI</h2>

            <div>
              {abiState[Object.keys(abiState)[0]]
                .sort((a, b) => {
                  if (a.stateMutability === 'view') {
                    return -1
                  }
                  if (b.stateMutability === 'view') {
                    return 1
                  }
                  return 0
                })
                .map((val, idx) => {
                  return (
                    <div key={idx.toString()}>
                      <h3 className="text-md font-bold mt-2">
                        {renderFunctionHeader(val)}
                      </h3>

                      <TextInputs
                        val={val}
                        idxOne={idx}
                        getBalance={getBalance}
                      />
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
