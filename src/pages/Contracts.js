import { useEffect, useState } from 'react'
import { TextInputs } from '../components/TextInputs'
import Header from '../components/Header'
import { SERVER_URL } from '../constants'
import {
  keywordStyleColoredTitle,
  plainTitleStyle,
  subheading,
  keywordStyleColored,
  functionStyleColored,
  plainSubtitleStyle,
  paranthesisStyle,
  stateMutabilityStyle,
  parameterTypeStyle,
  parameterNameStyle,
  commaStyle,
  buttonBackgroundColor,
} from '../theme'
import { Transaction } from '../components/Transaction'

export default function Contracts({ contractName }) {
  const [balances, setBalances] = useState()
  const [abiState, setAbiState] = useState()
  const [constructorIndex, setConstructorIndex] = useState()
  const [constructorDeployed, setConstructorDeployed] = useState(false)
  const [contractAddress, setContractAddress] = useState()

  const [transactions, setTransactions] = useState([])

  const [contractNameState, setContractNameState] = useState()
  const [bytecodeState, setBytecodeState] = useState()

  const [listening, setListening] = useState(false)

  const [forceTextInputReset, setNewForceTextInputResetVal] = useState(0);

  const [error, setError] = useState(null)

  const filteredTransactions = transactions.filter((transaction, _) => {return transaction.res.to === contractAddress})

  useEffect(() => {
    if (!listening) {
      const events = new EventSource(`${SERVER_URL}/subscribeToChanges`)

      events.onmessage = async(event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.msg === 'redeployed') {
            await init()

            // Want to rerender the inputs (and hide the outputs) whenever a contract change is detected
            setNewForceTextInputResetVal(Math.random());
          } else if (message.error === 'error') {
            throw new Error(message.error)
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
      Promise.all([getBalance(), getHistoricalTransactions()])

      const { returnedAbi, bytecode } = await getABI()

      let constructorIndex = getConstructorAbiIndex(returnedAbi)

      if (constructorIndex !== -1) {
        setConstructorIndex(constructorIndex)
        return
      }

      await deployContract(returnedAbi, bytecode, [])

      await getContractAddress()
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
      throw new Error(e.message)
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
      throw new Error(deploymentParsed.error)
    }
  }

  async function getABI() {
    try {
      const abiAndBytecode = await fetch(
        `${SERVER_URL}/abi?contractName=${contractName}`,
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
        setBytecodeState(jsonifiedAbiAndBytecode['bytecode'])

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

  async function getContractAddress() {
    try {
      const address = await fetch(`${SERVER_URL}/currentContractAddress`, {
        method: 'GET',
      })
      const addressJson = await address.json()
      setContractAddress(addressJson['address'])
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
            <p className={`${functionStyleColored} ml-1`}>
              {val.name}
            </p>
            <p className={`${paranthesisStyle}`}>
              (
            </p>
            {/* Style comes from inputsToString */}
            <p className='inline'>
              {inputsToString(val.inputs)}
            </p>
            <p className={`${paranthesisStyle}`}>
              )
            </p>
            <p className={`${stateMutabilityStyle} ml-1`}>{val.stateMutability}</p>
          </div>
        )
      case 'receive':
        // Note: receive (fallback) functions can't have a parameter
        return (
          <div>
            <p className={`${keywordStyleColored}`}>receive</p>
            <p className={`${functionStyleColored}`}>
              {val.name}
            </p>
            <p className={`${paranthesisStyle}`}>
              ()
            </p>
            <p className={`${stateMutabilityStyle} ml-1`}>{val.stateMutability}</p>
          </div>
        );
      case 'constructor':
        // Don't need to show the constructor on the next page
        break
      case 'fallback':
        return (
          <div>
            <p className={`${keywordStyleColored}`}>fallback</p>
            <p className={`${functionStyleColored}`}>
              {val.name}
            </p>
            <p className={`${paranthesisStyle}`}>
              ()
            </p>
            <p className={`${stateMutabilityStyle} ml-1`}>{val.stateMutability}</p>
          </div>
        )
      default:
        ''
    }

    return header
  }

  function inputsToString(valInputs) {
    if (!valInputs) return ''; 

    const param = valInputs.map((input, idx) => {
      if (input) {
        return (
          <div className='inline'>
            <p className={`${parameterTypeStyle} inline mr-1`}>{`${input.type}`}</p> 
            <p className={`${parameterNameStyle}`}>{`${input.name}`}</p>
            <p className={`${commaStyle} inline`}>{`${valInputs.length - 1 === idx ? '' : ', '}`}</p>
          </div>
        )
      } else {
        return ''
      }
    })

    return param
  }

  return (
    <Header>
      <div className="md:space-x-2 space-y-4 md:space-y-0 flex md:flex-row flex-col">
        <div className="flex lg:w-1/2">
          <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            {error && (
              <div className="justify-start items-start pt-1 w-full">
                <p className="text-md text-bold text-center pl-3 pr-3 p-3 border border-1 border-[#FF0057] text-[#FF0057] rounded-lg">
                  Error: {error.message}
                </p>
              </div>
            )}

            {(!abiState || !balances) && !error ? (
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
                          [...abiState[contractNameState]].reverse().map((val, idx) => {
                            // ^^ Need to reverse the ABI order so it looks like the contract
                            return (
                              <div key={idx.toString()} className="space-y-2">
                                <div>{renderFunctionHeader(val)}</div>

                                <TextInputs
                                  key={forceTextInputReset}
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
            )}
          </div>
        </div>

        <div className="flex lg:w-1/2 ">
          <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            <div className="flex flex-col justify-start space-y-4">
              <div className="flex flex-col justify-start items-start space-y-4">
                <div className="flex flex-col">
                  <h1 className={plainTitleStyle}>Transactions in this contract</h1>
                </div>
                <div className="flex flex-col w-full">
                  <div className="flex flex-col space-y-2">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions
                        .map((val, idx) => {
                          return (
                            <Transaction val={val} idx={idx} filteredTransactionsLength={filteredTransactions.length}/>
                          )
                        })
                    ) : (
                      <div className="pt-4">
                        <p className='text-md font-extrabold'>No Transactions to show yet</p>
                      </div>
                    )}
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
