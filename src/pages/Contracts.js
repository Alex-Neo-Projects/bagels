import { useEffect, useState } from 'react'
import { TextInputs } from '../components/TextInputs'
import Header from '../components/Header'
import { SERVER_URL } from '../constants'
import { Link } from 'wouter'

export default function Contracts({ contractFilename }) {
  const [contract, setContract] = useState(null)
  const [contractName, setContractName] = useState('')
  const [abi, setAbi] = useState(null)
  const [bytecode, setBytecode] = useState(null)
  const [constructor, setConstructor] = useState(null)

  const [balances, setBalances] = useState()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()
  const [listening, setListening] = useState(false)
  

  useEffect(() => {
    if (!listening) {
      const events = new EventSource(`${SERVER_URL}/subscribeToChanges`)
      console.log('\n\n\nOPENING LISTENING\n\n\n')

      events.onmessage = (event) => {
        try {
          clear()
          init()
        } catch (e) {
          console.log(e.message)
        }
      }

      setListening(true)
    }
  }, [listening])

  console.log("HELLOOOOOOOOOOOOOOOOOOOOOOOOOOO")

  async function init() {
    try {
      setLoading(true)

      console.log("1")

      await getBalance()

      console.log("2")

      const latestContract = await getContract()
      let contractData = latestContract['contract']['contractData']
      let contractDataLen = contractData.length 
      
        console.log("3")

      const info = await getABI()
      setContractName(Object.keys(info.abi))
      setAbi(info.abi)
      setBytecode(info.bytecode)

      console.log("4")

      let constructor = Object.values(info.abi)
        .flat(2)
        .filter((curr, _) => curr.type === 'constructor')
      let hasConstructor = constructor.length > 0

      console.log("5")

      if(hasConstructor) {
        console.log("6")
        // check if the constructor field has any constructors 
        // check whether the latest constructor has elements in it
        console.log(contractData[contractDataLen])
        console.log("lengthhhhh: ",contractDataLen)

        if(contractDataLen === 0) {
          console.log("7")
          setConstructor(constructor)
        } else {
          console.log("8")
          setContract(latestContract['contract'])
        }

        console.log("9")
        setLoading(false)
        return
      }

      console.log("10")

      setContract(latestContract['contract'])

      console.log("11")

      await deployContract(
        contractFilename,
        info.abi,
        info.bytecode,
        false,
        null,
        false,
      )


      setLoading(false)
    } catch (e) {
      setError(e)
    }
  }

  function clear() {
    setContract(null)
    setContractName('')
    setAbi(null)
    setBytecode(null)
    setConstructor(null)
    setBalances()
  }

  async function deployContract(
    contractFilename,
    abi,
    bytecode,
    hasConstructor,
    constructor,
    redeploy,
  ) {
    const deployment = await fetch(`${SERVER_URL}/deployContract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractFilename: contractFilename,
        abi: abi,
        bytecode: bytecode,
        hasConstructor: hasConstructor,
        constructor: constructor,
        redeploy: redeploy,
      }),
    })

    const deploymentParsed = await deployment.json()

    if (deployment.status === 200) {
      setContract(deploymentParsed['contract'])
    } else if (deployment.status !== 200) {
      console.log(deploymentParsed.error.message)
    }
  }

  async function getABI() {
    try {
      const res = await fetch(`${SERVER_URL}/abi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractFilename: contractFilename,
        }),
      })

      const resJson = await res.json()

      if (res.status === 200) {
        return resJson
      } else {
        throw new Error('Unable to fetch ABI')
      }
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async function getBalance() {
    try {
      const balance = await fetch(`${SERVER_URL}/balances`, {
        method: 'GET',
      })
      const jsonifiedBalance = await balance.json()
      setBalances({ balances: jsonifiedBalance })
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async function reloadData() {
    Promise.all([getBalance(), getTransactions()])
  }

  async function getTransactions(contractName) {
    try {
      const transactions = await fetch(`${SERVER_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractName: contractFilename,
        }),
      })

      const jsonifiedTransactions = await transactions.json()

      if (jsonifiedTransactions['transactions'].length > 0) {
        setContract((prev) => ({
          ...prev,
          transactions: jsonifiedTransactions['transactions'],
        }))
      }
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async function textInputDeployContract(constructor, redeploy) {
    try {
      await deployContract(
        contractFilename,
        abi,
        bytecode,
        true,
        constructor,
        redeploy,
      )
    } catch (e) {
      setError(e)
    }
  }

  async function getContract() {
    try {
      const contracts = await fetch(`${SERVER_URL}/getContract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractFilename: contractFilename,
        }),
      })

      const contractsParsed = await contracts.json()
      return contractsParsed
    } catch (e) {
      throw new Error(e.message)
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
        // header += `constructor(${inputsToString(val.inputs)}) ${
        //   val.stateMutability
        // }`
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

  console.log("constructor",constructor)

  return (
    <Header>
      <div className="px-2">
        <div className="pb-6">
          <Link href="/">
            <button className="text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#93939328] hover:bg-[#0E76FD]">
              <div className="flex flex-row justify-center w-full items-center text-sm font-bold">
                <p>Contracts</p>
              </div>
            </button>
          </Link>
        </div>
      </div>

      <div className="flex sm:flex-row flex-col w-full justify-center items-start sm:space-x-10 space-y-4 sm:space-y-0 overflow-auto">
        <div className="flex w-screen max-w-[40em] px-2 sm:px-0">
          <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            {loading && !contract && (
              <div className="max-w-lg">
                <p className="text-md tracking-tighter text-left font-bold">
                  Loading
                </p>
              </div>
            )}

            {!loading && constructor && !contract && (
              <div className="flex flex-col justify-start space-y-4">
                <div className="flex flex-row justify-between">
                  <h1 className="text-xl tracking-tighter text-left font-bold">
                    Contract {contractName || ''}
                  </h1>
                </div>
                <p className="text-sm font-medium">Enter constructors:</p>
                <TextInputs
                  idxOne={0}
                  contractFilename={contractFilename}
                  val={constructor[0]}
                  reloadData={reloadData}
                  deployContract={textInputDeployContract}
                />
              </div>
            )}

            {!loading && contract && (
              <div className="flex flex-col justify-start space-y-6">
                <div className="flex justify-start items-center">
                  <div className="flex flex-col w-full">
                    <div className="flex flex-row justify-between">
                      <h1 className="text-xl tracking-tighter text-left font-bold">
                        Contract {contractName || ''}
                      </h1>
                    </div>

                    <p className="text-sm left">
                      {
                        contract['deploymentAddresses'][
                          contract['deploymentAddresses'].length - 1
                        ]
                      }
                    </p>
                  </div>
                  <button
                    className="text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#93939328] hover:bg-[#0E76FD]"
                    onClick={async () => {
                      // await init()
                      await deployContract(
                        contractFilename,
                        abi,
                        bytecode,
                        true, // maybe true or false check this out
                        null,
                        true,
                      )
                    }}
                  >
                    <div className="flex flex-row justify-center w-full items-center text-sm font-bold">
                      <p>Redeploy</p>
                    </div>
                  </button>
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
                    {abi &&
                      abi[contractName].map((val, idx) => {
                        if (val.type === 'constructor') {
                          return
                        }
                        return (
                          <div key={idx.toString()} className="space-y-2">
                            <div>
                              <p className="text-md font-bold mt-2">
                                {renderFunctionHeader(val)}
                              </p>
                            </div>

                            <TextInputs
                              idxOne={idx}
                              contractFilename={contractFilename}
                              val={val}
                              reloadData={reloadData}
                              deployContract={textInputDeployContract}
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

        {/* <div className="flex flex-col space-y-4">
          <div className="flex w-screen max-w-[40em] px-2 sm:px-0">
            <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
              <div className="flex flex-col justify-start space-y-4">
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
                      {contract &&
                      contract['transactions'] &&
                      contract['transactions'].length > 0 ? (
                        contract['transactions']
                          .slice(0)
                          .reverse()
                          .map((val, idx) => {
                            return (
                              <div
                                key={idx.toString()}
                                className="space-y-6 p-4 pl-4 pr-4 border border-[#93939328] rounded-2xl break-all overflow-hidden"
                              >
                                <div>
                                  <p className="text-lg font-extrabold">
                                    Transaction{' '}
                                    {(
                                      contract['transactions'].length - idx
                                    ).toString()}
                                  </p>
                                </div>

                                <div className="flex flex-col space-y-1">
                                  <p className="text-md font-bold">Hash</p>
                                  <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                    <p className="text-sm">{val.hash}</p>
                                  </div>
                                </div>

                                <div className="flex flex-col space-y-1">
                                  <p className="text-md font-bold">From</p>
                                  <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                    <p className="text-sm">{val.from}</p>
                                  </div>
                                </div>

                                <div className="flex flex-col space-y-4">
                                  <div className="flex flex-col space-y-1">
                                    <p className="text-md font-bold">Data</p>
                                    <div className="rounded-lg bg-[#93939328] border border-[#93939328] pl-3 pr-3 p-4">
                                      <p className="test-sm">{val.data}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col space-y-4">
                                    <div className="flex flex-col space-y-1">
                                      <p className="text-md font-bold">
                                        Function
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
                                        Params
                                      </p>

                                      <div className="space-y-6">
                                        {val.params.map((param, _) => {
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
        </div> */}
      </div>
    </Header>
  )
}
