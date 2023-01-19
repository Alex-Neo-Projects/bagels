import { useEffect, useState } from 'react'

export function TextInputs({ val, idxOne, getBalance, deployContract }) {
  const [inputs, setInputs] = useState([])
  const [amount, setAmount] = useState(0)
  const [executingTransaction, setExecutingTransaction] = useState(false)
  const [executionError, setExecutionError] = useState()
  const [output, setOutput] = useState()
  const [error, setError] = useState()

  // Update fees when a trasaction gets executed
  useEffect(() => {
    getBalance();
    console.log('executing tx'); 
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
    <div
      className="flex flex-col justify-between items-start space-y-1 h-full p-4 pl-4 pr-4 bg-[#F2F1F2] border border-[#E5DEDE40] rounded-lg"
      key={idxOne.toString()}
    >
      <div className="flex flex-row justify-end w-full items-center space-x-4">
        {val.inputs.map((param, idx) => {
          return (
            <input
              key={idx.toString()}
              className="appearance-none h-4 w-full m-0 p-4 pt-6 pb-6 rounded-lg bg-white outline-none text-md"
              type={'text'}
              placeholder={`${param.name} (${param.type})`}
              onInput={(e) => {}}
              onChange={handleInputListChange.bind(this, [idx, param.type])}
            />
          )
        })}

        {val.stateMutability === 'payable' && (
          <input
            className="appearance-none h-4 w-full m-0 p-4 pt-6 pb-6 rounded-lg bg-white outline-none text-md"
            type={'text'}
            placeholder={'Enter an amount (ETH)'}
            onInput={(e) => setAmount(parseFloat(e.target.value))}
          />
        )}

        <button
          className={
            val.inputs.length > 0
              ? 'text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#3670F9]'
              : 'text-sm text-white hover:cursor-grab flex justify-center items-center w-full h-10 pl-6 pr-6 p-6 rounded-lg bg-[#3670F9]'
          }
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

            let name = val.name; 

            if (val.type === 'constructor') {
              name = 'constructor';
              console.log("WHAT IS BEING PASSED IN? ", inputs)
              await deployContract(inputs);
              return;
            }

            const res = await fetch(
              'http://localhost:3001/executeTransaction',
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

      <div className="flex flex-row justify-start w-full items-center">
        {executingTransaction ? (
          <div className="flex flex-row justify-center items-center mt-2">
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

            <p className="text-sm font-bold">Loading</p>
          </div>
        ) : null}
      </div>

      {output && (
        <div>
          <p className="text-lg">{output}</p>
        </div>
      )}

      {error && (
        <div>
          <p className="text-red-600">Input Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {executionError && (
        <div className="overflow-hidden break-all">
          <p className="text-red-600">Error:</p>
          <p className="text-red-600">{executionError}</p>
        </div>
      )}
    </div>
  )
}
