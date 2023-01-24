import { useEffect, useState } from 'react'
import { TextInputs } from '../components/TextInputs'
import Header from '../components/Header'
import { SERVER_URL } from '../constants'

export default function Contracts({ contractName }) {
  const [balances, setBalances] = useState()
  const [abiState, setAbiState] = useState()
  const [constructorIndex, setConstructorIndex] = useState()
  const [constructorDeployed, setConstructorDeployed] = useState(false)

  const [transactions, setTransactions] = useState([])
  const [contracts, setContracts] = useState([])

  const [contractNameState, setContractNameState] = useState()
  const [bytecodeState, setBytecodeState] = useState()

  const [listening, setListening] = useState(false)

  useEffect(() => {
    if (!listening) {
      const events = new EventSource(`${SERVER_URL}/subscribeToChanges`)

      events.onmessage = (event) => {
        try {
          init()
        } catch (e) {
          console.log(e.message)
        }
      }

      setListening(true)
    }
  }, [listening])

  async function init() {
    Promise.all([
      getBalance(),
      getHistoricalTransactions(),
      getHistoricalContracts(),
    ])

    const { returnedAbi, bytecode } = await getABI()

    let constructorIndex = getConstructorAbiIndex(returnedAbi)

    if (constructorIndex !== -1) {
      setConstructorIndex(constructorIndex)
      return
    }

    await deployContract(returnedAbi, bytecode, [])
  }

  async function getBalance() {
    const balance = await fetch(`${SERVER_URL}/balances`, {
      method: 'GET',
    })

    const jsonifiedBalance = await balance.json()

    setBalances({ balances: jsonifiedBalance })
  }

  async function getHistoricalTransactions() {
    try {
      const transactions = await fetch(
        `${SERVER_URL}/getHistoricalTransactions`,
        {
          method: 'GET',
        },
      )
      const jsonifiedTransactions = await transactions.json()
      setTransactions(jsonifiedTransactions.historicalTransactions)
    } catch (e) {
      console.error(e.message)
    }
  }

  async function getHistoricalContracts() {
    try {
      const contracts = await fetch(`${SERVER_URL}/getHistoricalContracts`, {
        method: 'GET',
      })
      const jsonifiedContracts = await contracts.json()
      setContracts(jsonifiedContracts.historicalContracts)
    } catch (e) {
      console.error(e.message)
    }
  }

  function getConstructorAbiIndex(abi) {
    let abiValues = Object.values(abi)[0]

    for (var index = 0; index < abiValues.length; index++) {
      let currentItem = abiValues[index]

      if (currentItem['type'] === 'constructor') {
        return index
      }
    }
    return -1
  }

  async function TextInputDeployContract(constructor) {
    await deployContract(abiState, bytecodeState, constructor)
    setConstructorDeployed(true)
  }

  async function deployContract(abi, bytecode, constructor) {
    const deployment = await fetch(`${SERVER_URL}/deployContract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        abi: abi,
        bytecode: bytecode,
        constructor: constructor,
      }),
    })

    const deploymentParsed = await deployment.json()

    if (deployment.status !== 200) {
      console.log(deploymentParsed.error)
    }
  }

  async function getABI() {
    try {
      console.log(`${SERVER_URL}/abi?contractName=${contractName} `)

      const abiAndBytecode = await fetch(
        `${SERVER_URL}/abi?contractName=${contractName}`,
        {
          method: 'GET',
        },
      )

      const jsonifiedAbiAndBytecode = await abiAndBytecode.json()

      const contractNameFromAbi = Object.keys(jsonifiedAbiAndBytecode['abi'])[0]

      setContractNameState(contractNameFromAbi)

      setAbiState(jsonifiedAbiAndBytecode['abi'])
      setBytecodeState(jsonifiedAbiAndBytecode['bytecode'])

      return {
        returnedAbi: jsonifiedAbiAndBytecode['abi'],
        bytecode: jsonifiedAbiAndBytecode['bytecode'],
      }
    } catch (e) {
      console.error(e.message)
    }
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

  return (
    <Header>
      <div className="flex sm:flex-row flex-col w-full justify-center items-start sm:space-x-10 space-y-4 sm:space-y-0 overflow-auto">
        <div className="flex w-screen max-w-[40em] px-2 sm:px-0">
          <div className=" text-white block border border-[#333333] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            {!abiState ||
              (!balances && (
                <div className="mt-2 mb-2 max-w-lg space-y-6">
                  <p className="text-xl tracking-tighter text-left font-bold">
                    Loading {contractName}
                  </p>
                </div>
              ))}

            {constructorIndex > -1 && !constructorDeployed ? (
              <div className="flex flex-col justify-start space-y-4">
                <p className="text-xl font-medium">Enter constructors:</p>
                <TextInputs
                  val={abiState[contractNameState][constructorIndex]}
                  idxOne={0}
                  getBalance={getBalance}
                  deployContract={TextInputDeployContract}
                />
              </div>
            ) : (
              <div className="flex flex-col justify-start space-y-4">
                <div className="flex justify-start items-center">
                  <div>
                    <a href="/">
                      <img
                        className="justify-center items-center"
                        src="https://cdn-icons-png.flaticon.com/512/93/93634.png"
                        height={25}
                        width={25}
                      />
                    </a>
                  </div>

                  <div className="pl-4">
                    <h1 className="text-xl tracking-tighter text-left font-bold">
                      Contract {contractNameState || ''}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="space-y-1">
                    <p className="text-xl font-medium">
                      Connected to wallet with address:
                    </p>
                    <p className="text-sm">
                      0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <p className="text-xl font-medium">Address Balance:</p>
                  <p className="text-md">eth: {balances?.balances?.eth}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-xl font-medium">ABI:</p>

                  <div className="flex flex-col space-y-2">
                    {abiState &&
                      contractNameState &&
                      abiState[contractNameState]
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
                              <p className="text-md font-bold mt-2">
                                {renderFunctionHeader(val)}
                              </p>

                              <TextInputs
                                val={val}
                                idxOne={idx}
                                getBalance={getBalance}
                                deployContract={TextInputDeployContract}
                                getHistoricalTransactions={
                                  getHistoricalTransactions
                                }
                              />
                            </div>
                          )
                        })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex w-screen max-w-[40em] px-2 sm:px-0">
            <div className="bg-white text-black block rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
              <div className="flex flex-col justify-start space-y-4">
                {/* Transaction TEMPLATE */}
                <div className="flex flex-col justify-start items-start space-y-2">
                  <div className="flex flex-col">
                    <h1 className="text-xl tracking-tighter text-left font-bold">
                      Transactions
                    </h1>
                    <p className="text-sm font-medium">
                      Your transactions throughout the development of your
                      contract.
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-col space-y-2">
                      {transactions.length > 0 ? (
                        transactions.map((val, idx) => {
                          console.log(val.params)
                          return (
                            <div
                              key={idx.toString()}
                              className="space-y-3 p-4 pl-4 pr-4 border border-[#E4E4E474] rounded-2xl break-all overflow-hidden"
                            >
                              <div>
                                <p className="text-lg font-extrabold">
                                  Nonce #{''}
                                  {val.res.nonce}
                                </p>
                              </div>

                              <div className="flex flex-col">
                                <p className="text-md font-bold">Hash:</p>
                                <p>{val.res.hash}</p>
                              </div>

                              <div className="flex flex-col">
                                <p className="text-md font-bold">From:</p>
                                <p>{val.res.from}</p>
                              </div>

                              <div className="flex flex-col space-y-2">
                                <div className="flex flex-col">
                                  <p className="text-md font-bold">Data:</p>
                                  <p>{val.res.data}</p>
                                </div>

                                <div className="flex flex-col space-y-2 pl-2">
                                  <div className="flex flex-col">
                                    <p className="text-md font-bold">
                                      Function:
                                    </p>
                                    <p>
                                      {val.functionName}(
                                      {val.params.length > 0 ? '...' : ' '}){' '}
                                      {val.stateMutability}
                                    </p>
                                  </div>

                                  <div className="flex flex-col">
                                    <p className="text-md font-bold">Params:</p>

                                    <div className='space-y-4'>
                                      {val.params.map((param, paramsVal) => {
                                        return (
                                          <div className="pl-2">
                                            <p className="text-sm font-bold">
                                              value: {param[0]}
                                            </p>
                                            <p className="text-sm font-bold">
                                              type: {param[1]}
                                            </p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="pt-4">
                          <p>No Transactions Found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Header>
  )
}
