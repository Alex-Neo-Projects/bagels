import React from 'react'
import { useEffect, useState } from 'react'

const PORT = 9090

export function TextInputs({ val, idxOne, getBalance, deployContract }) {
  const [inputs, setInputs] = useState([])
  const [amount, setAmount] = useState(0)
  const [executingTransaction, setExecutingTransaction] = useState(false)
  const [executionError, setExecutionError] = useState()
  const [output, setOutput] = useState()
  const [error, setError] = useState()

  // Update fees when a trasaction gets executed
  useEffect(() => {
    getBalance()
    console.log('executing tx')
  }, [])

  // index[0] === the param value
  // index[1] === the param type
  function handleInputListChange(index, event) {
    var inputsCopy = inputs.slice()
    inputsCopy[index[0]] = [event.target.value, index[1]]

    setInputs(inputsCopy)
  }

  // TODO: Make this work for a variety of types like addresses,
  function validateInputs() {
    let newError

    const uintTypes = [
      'uint8',
      'uint16',
      'uint24',
      'uint32',
      'uint40',
      'uint48',
      'uint56',
      'uint64',
      'uint72',
      'uint80',
      'uint88',
      'uint96',
      'uint104',
      'uint112',
      'uint120',
      'uint128',
      'uint136',
      'uint144',
      'uint152',
      'uint160',
      'uint168',
      'uint176',
      'uint184',
      'uint192',
      'uint200',
      'uint208',
      'uint216',
      'uint224',
      'uint232',
      'uint240',
      'uint248',
      'uint256',
    ]
    const intTypes = [
      'int8',
      'int16',
      'int24',
      'int32',
      'int40',
      'int48',
      'int56',
      'int64',
      'int72',
      'int80',
      'int88',
      'int96',
      'int104',
      'int112',
      'int120',
      'int128',
      'int136',
      'int144',
      'int152',
      'int160',
      'int168',
      'int176',
      'int184',
      'int192',
      'int200',
      'int208',
      'int216',
      'int224',
      'int232',
      'int240',
      'int248',
      'int256',
    ]

    if (val.inputs.length !== inputs.length)
      newError = 'Please fill out all inputs'

    inputs.map((item) => {
      if (item[1] === 'string' && typeof item[0] !== 'string') {
        newError = `Invalid input: ${item[0]}. It should be of type: ${item[1]}`
      } else if (
        (uintTypes.includes(item[1]) || intTypes.includes(item[1])) &&
        !isFinite(item[0])
      ) {
        newError = `Invalid input: ${item[0]}. It should be of type: ${item[1]}`
      } else if (item[0].length === 0 || !item[0]) {
        newError = 'Please enter an input'
      }
    })

    setError(newError)
    if (newError) {
      return false
    } else {
      return true
    }
  }

  function clear() {
    setOutput()
    setError()
    setExecutionError()
  }

  return (
    <div key={idxOne.toString()}>
      <div>
        {val.inputs.map((param, idx) => {
          return (
            <input
              key={idx.toString()}
              type={'text'}
              placeholder={`${param.name} (${param.type})`}
              onInput={(e) => {}}
              onChange={handleInputListChange.bind(this, [idx, param.type])}
            />
          )
        })}

        {val.stateMutability === 'payable' && (
          <input
            type={'text'}
            placeholder={'Enter an amount (ETH)'}
            onInput={(e) => setAmount(parseFloat(e.target.value))}
          />
        )}

        <button
          onClick={async () => {
            // Clear outputs and errors
            clear()

            // Validation goes here
            const inputIsValid = validateInputs()

            if (val.inputs.length > 0 && !inputIsValid) {
              return
            }

            // Execute transaction
            setExecutingTransaction(true)

            let name = val.name

            if (val.type === 'constructor') {
              name = 'constructor'
              console.log('WHAT IS BEING PASSED IN? ', inputs)
              await deployContract(inputs)
              return
            }

            const res = await fetch(
              `http://localhost:${PORT}/executeTransaction`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  functionName: val.name,
                  params: inputs,
                  stateMutability: val.stateMutability,
                  type: val.type,
                  amount: amount,
                }),
              },
            )

            const jsonParsed = await res.json()

            if (res.status === 200) {
              let showOutput = jsonParsed['result']
                ? `${jsonParsed['result']}`
                : 'Transaction successful.'
              setOutput(showOutput)
            } else if (res.status === 500) {
              setExecutionError(JSON.stringify(jsonParsed['error']))
            }

            setTimeout(() => {
              setExecutingTransaction(false)
            }, 200)
          }}
          disabled={executingTransaction}
        >
          {val.stateMutability === 'view' || val.stateMutability === 'pure'
            ? 'Read'
            : 'Write'}
        </button>
      </div>

      <div>
        {executingTransaction ? (
          <div>
            <h2 className="text-sm font-bold">Loading</h2>
          </div>
        ) : null}
      </div>

      {output && (
        <div>
          <p>{output}</p>
        </div>
      )}

      {error && (
        <div>
          <p>Input Error:</p>
          <p>{error}</p>
        </div>
      )}

      {executionError && (
        <div>
          <p>Error:</p>
          <p>{executionError}</p>
        </div>
      )}
    </div>
  )
}
