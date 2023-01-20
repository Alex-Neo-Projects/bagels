import { useEffect, useState } from 'react'
import { TextInputs } from '../components/TextInputs'
import Header from '../components/Header'
import { SERVER_URL } from '../constants'

export default function Contracts({ contractName }) {
  const [balances, setBalances] = useState()
  const [abiState, setAbiState] = useState()
  const [constructorIndex, setConstructorIndex] = useState()
  const [constructorDeployed, setConstructorDeployed] = useState(false)

  const [funding, setFunding] = useState(false)
  const [contractNameState, setContractNameState] = useState()
  const [bytecodeState, setBytecodeState] = useState()

  const [listening, setListening] = useState(false)
  // const [received, setReceived] = useState('')

  useEffect(() => {
    init()
  }, [funding])

  useEffect(() => {
    if (!listening) {
      const events = new EventSource(`${SERVER_URL}/subscribeToChanges`)

      events.onmessage = (event) => {
        init()
      }

      setListening(true)
    }
  }, [listening])

  async function init() {
    await getBalance()

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

    console.log('after text input')
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

    if (deployment.status !== 200) {
      console.log('ERROR DEPLOYING THE CONTRACT!!!!')
    }

    console.log('after deploy contract')
  }

  async function getABI() {
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
      {!abiState || !balances ? (
        <div className="mt-2 mb-2 max-w-lg space-y-6">
          <p>loading</p>
        </div>
      ) : // Show constructor inputs if a valid constructor is found
      constructorIndex > -1 && !constructorDeployed ? (
        <div>
          <p>Enter constructors</p>
          <TextInputs
            val={abiState[contractNameState][constructorIndex]}
            idxOne={0}
            getBalance={getBalance}
            deployContract={TextInputDeployContract}
          />
        </div>
      ) : (
        <div className="mt-2 mb-2 max-w-lg space-y-6">
          <div className="flex">
            <a href="/">
              <img
                className="mr-2 pt-1"
                src="https://cdn-icons-png.flaticon.com/512/93/93634.png"
                height={10}
                width={35}
              />
            </a>
            <p className="text-4xl font-bold">
              Contract {contractNameState || ''}
            </p>
          </div>
          <div>
            <p className="text-xl font-medium">
              Connected to wallet with address:{' '}
            </p>
            <p className="text-sm">
              0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
            </p>
            <p className="text-xl font-medium pt-4">Private key: </p>
            <p className="text-sm">
              0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            </p>
          </div>

          <div>
            <p className="text-xl font-bold">Address Balance</p>
            <div className="mt-1">
              {Object.entries(balances.balances).map(([name, value], idx) => {
                return (
                  <div key={idx.toString()}>
                    <p className="text-md">
                      {name}: {value}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xl font-bold">ABI</p>

            <div className="flex flex-col space-y-2">
              {abiState[contractNameState]
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
                      />
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </Header>
  )
}
