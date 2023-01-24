import { useEffect, useState } from 'react'
import { TextInputs } from '../components/TextInputs'
import Header from '../components/Header'
import { SERVER_URL } from '../constants'
import { Link } from 'wouter'

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
        <div className="px-2">
          <Link href="/">
            <button className="text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#93939328] hover:bg-[#0E76FD]">
              <div className="flex flex-row justify-center w-full items-center text-sm font-bold">
                <p>Contracts</p>
              </div>
            </button>
          </Link>
        </div>

        <div className="flex w-screen max-w-[40em] px-2 sm:px-0">
          <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            {!abiState || !balances ? (
              <div className="max-w-lg">
                <p className="text-md tracking-tighter text-left font-bold">
                  Loading {contractName}
                </p>
              </div>
            ) : constructorIndex > -1 && !constructorDeployed ? (
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
              <div className="flex flex-col justify-start space-y-6">
                <div className="flex justify-start items-center">
                  <h1 className="text-xl tracking-tighter text-left font-bold">
                    Contract {contractNameState || ''}
                  </h1>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="space-y-1">
                    <p className="text-xl font-medium">Wallet address</p>
                    <p className="text-sm">
                      0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <p className="text-xl font-medium">Address Balance</p>
                  <p className="text-md">ETH: {balances?.balances?.eth}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-xl font-medium">ABI</p>

                  <div className="flex flex-col space-y-3">
                    {abiState &&
                      contractNameState &&
                      abiState[contractNameState].map((val, idx) => {
                        return (
                          <div key={idx.toString()} className="space-y-2">
                            <div>
                              <p className="text-md font-bold mt-2">
                                {renderFunctionHeader(val)}
                              </p>
                            </div>

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
            <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
              <div className="flex flex-col justify-start space-y-4">
                {/* Transaction TEMPLATE */}
                <div className="flex flex-col justify-start items-start space-y-4">
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
                          return (
                            <div
                              key={idx.toString()}
                              className="space-y-6 p-4 pl-4 pr-4 border border-[#93939328] rounded-2xl break-all overflow-hidden"
                            >
                              <div>
                                <p className="text-lg font-extrabold">
                                  Nonce #{val.res.nonce}
                                </p>
                              </div>

                              <div className="flex flex-col space-y-1">
                                <p className="text-md font-bold">Hash</p>
                                <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                  <p className="text-sm">{val.res.hash}</p>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-1">
                                <p className="text-md font-bold">From</p>
                                <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                  <p className="text-sm">{val.res.from}</p>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-4">
                                <div className="flex flex-col space-y-1">
                                  <p className="text-md font-bold">Data</p>
                                  <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                    <p className="test-sm">{val.res.data}</p>
                                  </div>
                                </div>

                                <div className="flex flex-col space-y-4">
                                  <div className="flex flex-col space-y-1">
                                    <p className="text-md font-bold">
                                      Function
                                    </p>
                                    <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                      <p className='text-sm'>
                                        {val.functionName}(
                                        {val.params.length > 0 ? '' : ' '}){' '}
                                        {val.stateMutability}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col space-y-2">
                                    <p className="text-md font-bold">Params</p>

                                    <div className="space-y-6">
                                      {val.params.map((param, paramsVal) => {
                                        return (
                                          <div className="pl-2 space-y-2">
                                            <div className="flex flex-row space-x-4 justify-center items-center">
                                              <div className="w-10">
                                                <p className="text-sm font-bold">
                                                  Value
                                                </p>
                                              </div>

                                              <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4 w-full">
                                                <p className="text-sm font-bold">
                                                  {param[0]}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex flex-row space-x-4 justify-center items-center">
                                              <div className="w-10 ">
                                                <p className="text-sm font-bold">
                                                  Type
                                                </p>
                                              </div>

                                              <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4 w-full">
                                                <p className="text-sm font-bold">
                                                  {param[1]}
                                                </p>
                                              </div>
                                            </div>
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
