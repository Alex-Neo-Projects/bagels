import { useEffect, useState } from 'react'
import { TextInputs } from '../components/TextInputs'
import Header from '../components/Header'
import { SERVER_URL } from '../constants'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Link } from 'wouter'
import {
  titleColor,
  keywordStyleColoredTitle,
  coloredTitleStyle,
  plainTitleStyle,
  subheading,
  functionModiferStyle,
  keywordStyleColored,
  functionStyleColored,
  plainSubtitleStyle,
} from '../githubTheme'

export default function Contracts({ contractFilename }) {
  const [contract, setContract] = useState(null)
  const [balances, setBalances] = useState()
  const [abiState, setAbiState] = useState()
  const [hasConstructor, setHasConstructor] = useState(false)
  const [constructorDeployed, setConstructorDeployed] = useState(false)
  const [contractAddress, setContractAddress] = useState()

  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const [transactions, setTransactions] = useState([])

  const [contractNameState, setContractNameState] = useState()

  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!listening) {
      const events = new EventSource(`${SERVER_URL}/subscribeToChanges`)

      events.onmessage = async (event) => {
        try {
          if (event) {
            const message = JSON.parse(event.data)

            switch (message.msg) {
              case 'redeployed': {
                await init()
                break
              }
              case error: {
                throw new Error(message.error)
              }
            }
          } else {
            throw new Error('Unable to get event message')
          }
        } catch (e) {
          setError(e)
        }
      }

      setListening(true)
    }
  }, [listening])

  async function init() {
    try {
      await getBalance()

      const { returnedAbi } = await getABI()

      let hasConstructor =
        Object.values(returnedAbi)
          .flat(2)
          .filter((curr) => curr.type === 'constructor').length > 0

      if (hasConstructor) {
        setHasConstructor(true)
        return
      }

      await deployContract(contractFilename, [])
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async function getBalance() {
    const balance = await fetch(`${SERVER_URL}/balances`, {
      method: 'GET',
    })

    const jsonifiedBalance = await balance.json()

    setBalances({ balances: jsonifiedBalance })
  }

  async function TextInputDeployContract(constructor) {
    await deployContract(contractFilename, constructor)
    setConstructorDeployed(true)
  }

  async function deployContract(contractFilename, constructor) {
    const deployment = await fetch(`${SERVER_URL}/deployContract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractFilename: contractFilename,
        constructor: constructor,
      }),
    })

    const deploymentParsed = await deployment.json()

    if (deployment.status !== 200) {
      throw new Error(deploymentParsed.error)
    } else {
      setContract(deploymentParsed['contract'])
    }
  }

  async function getABI() {
    try {
      const abiAndBytecode = await fetch(
        `${SERVER_URL}/abi?contractName=${contractFilename}`,
        {
          method: 'GET',
        },
      )

      const jsonifiedAbiAndBytecode = await abiAndBytecode.json()

      if (abiAndBytecode.status === 200) {
        const contractNameFromAbi = Object.keys(
          jsonifiedAbiAndBytecode['abi'],
        )[0]

        setContractNameState(contractNameFromAbi)
        setAbiState(jsonifiedAbiAndBytecode['abi'])

        return {
          returnedAbi: jsonifiedAbiAndBytecode['abi'],
          bytecode: jsonifiedAbiAndBytecode['bytecode'],
        }
      } else {
        throw new Error(jsonifiedAbiAndBytecode.error)
      }
    } catch (e) {
      throw new Error(e.message)
    }
  }

  function renderFunctionHeader(val) {
    let header = ''
    switch (val.type) {
      case 'function':
        return (
          <div>
            <p className={keywordStyleColored}>function</p>
            <p className={functionStyleColored}>
              {val.name}({inputsToString(val.inputs)})
            </p>
            <p className={functionModiferStyle}>{val.stateMutability}</p>
          </div>
        )
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
                <p>Back</p>
              </div>
            </button>
          </Link>
        </div>

        <div className="flex w-screen max-w-[40em] px-2 sm:px-0">
          <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            {error && (
              <div className="justify-start items-start pt-1 w-full">
                <p className="text-md text-bold text-center pl-3 pr-3 p-3 border border-1 border-[#FF0057] text-[#FF0057] rounded-lg">
                  Error: {error.message}
                </p>
              </div>
            )}

            {(!abiState || !balances || !contract) && !error && (
              <div className="max-w-lg">
                <p className="text-md tracking-tighter text-left font-bold">
                  Loading {contractFilename}
                </p>
              </div>
            )}

            {hasConstructor && !constructorDeployed ? (
              <div className="flex flex-col justify-start space-y-4">
                <p className="text-xl font-medium">Enter constructors:</p>
                <TextInputs
                  val={abiState[contractNameState][constructorIndex]}
                  idxOne={0}
                  getBalance={getBalance}
                  deployContract={TextInputDeployContract}
                  contractFilename={contractFilename}
                />
              </div>
            ) : (
              contract && (
                <div className="flex flex-col justify-start space-y-6">
                  {!error && (
                    <div className="space-y-6">
                      <div className="flex justify-start items-center">
                        <h1 className={`${keywordStyleColoredTitle}`}>
                          contract
                        </h1>
                        <h1 className={plainTitleStyle}>
                          {contractNameState || ''}
                        </h1>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="space-y-1">
                          <p className={plainSubtitleStyle}>Contract Address</p>
                          <p className={subheading}>
                            {(contract &&
                              contract['currentVersion']['contract'][
                                'address'
                              ]) ||
                              ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="space-y-1">
                          <p className={plainSubtitleStyle}>Wallet address</p>
                          <p className={subheading}>
                            0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <p className={plainSubtitleStyle}>Token Balance</p>
                        <p className={subheading}>
                          ETH: {balances?.balances?.eth}
                        </p>
                      </div>

                      <div className="flex flex-col pt-2">
                        <div className="flex flex-col space-y-3">
                          {abiState &&
                            contractNameState &&
                            abiState[contractNameState].map((val, idx) => {
                              return (
                                <div key={idx.toString()} className="space-y-2">
                                  <div>{renderFunctionHeader(val)}</div>

                                  <TextInputs
                                    val={val}
                                    idxOne={idx}
                                    getBalance={getBalance}
                                    deployContract={TextInputDeployContract}
                                    contractFilename={contractFilename}
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
            )}
          </div>
        </div>

        {/* <div className="flex flex-col space-y-4">
          <div className="flex w-screen max-w-[40em] px-2 sm:px-0">
            <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
              <div className="flex flex-col justify-start space-y-4">
                <div className="flex flex-col justify-start items-start space-y-4">
                  <div className="flex flex-col">
                    <h1 className={plainTitleStyle}>Transactions</h1>
                    <p className="text-sm font-medium pt-2">
                      The transactions below are specific to <i>this</i>{' '}
                      contract deployment
                    </p>
                  </div>
                  <div className="flex flex-col w-full">
                    <div className="flex flex-col space-y-2">
                      {transactions.length > 0 ? (
                        transactions
                          .filter((transaction, _) => {
                            return transaction.res.to === contractAddress
                          })
                          .map((val, idx) => {
                            return (
                              <div
                                key={idx.toString()}
                                className="space-y-6 p-4 pl-4 pr-4 border border-[#93939328] rounded-2xl break-all overflow-hidden"
                              >
                                <div>
                                  <p className="text-lg font-extrabold">
                                    Transaction #
                                    {(transactions.length - idx).toString()}
                                  </p>
                                </div>

                                <div className="flex flex-col space-y-4">
                                  <div className="flex flex-col space-y-4">
                                    <div className="flex flex-col space-y-1">
                                      <p className="text-md font-bold">
                                        Function:
                                      </p>
                                      <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                        <p className="text-sm">
                                          {val.functionName}(
                                          {val.params.length > 0 ? '' : ' '}){' '}
                                          {val.stateMutability}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                      <p className="text-md font-bold">
                                        Params:
                                      </p>

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

                                {!showMoreInfo && (
                                  <div className="flex flex-col space-y-1">
                                    <div
                                      onClick={() => setShowMoreInfo(true)}
                                      className="text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#93939328]  hover:bg-[#0E76FD]"
                                    >
                                      <p className="text-sm">More info</p>
                                    </div>
                                  </div>
                                )}

                                {showMoreInfo && (
                                  <>
                                    <div className="flex flex-col space-y-1">
                                      <p className="text-md font-bold">Hash</p>
                                      <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                        <p className="text-sm">
                                          {val.res.hash}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                      <p className="text-md font-bold">To</p>
                                      <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                        <p className="text-sm">{val.res.to}</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                      <p className="text-md font-bold">From</p>
                                      <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                        <p className="text-sm">
                                          {val.res.from}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                      <p className="text-md font-bold">
                                        Raw data
                                      </p>
                                      <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                        <p className="test-sm">
                                          {val.res.data}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                      <div
                                        onClick={() => setShowMoreInfo(false)}
                                        className="text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#93939328]  hover:bg-[#0E76FD]"
                                      >
                                        <p className="text-sm">
                                          Hide more info
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                )}
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
        </div> */}
      </div>
    </Header>
  )
}
