import { buttonTextColor, buttonBackgroundColor } from "../theme"

export function ReadWriteButton({executingTransaction, stateMutability, inputs, buttonClicked}) { 
  const returnView = () => {
    if (executingTransaction) {
      return (
        <div className="flex flex-row justify-center items-center">
          <p>Loading...</p>
        </div>
      )
    } 
    else if (stateMutability === 'view' || stateMutability === 'pure') {
      return (
        <p>Read</p>
      )
    } else {
       if (stateMutability === 'payable') {
        return <p>Pay</p>
       } else {
        return <p>Write</p>
       }
    }
  }

  return (
    <button
      className={
        // If there's an input, show the input and the button on the same line.
        // If there's no input, make the button fill up the full line
        (inputs && inputs.length > 0) || stateMutability === 'payable'
          ? `text-sm ${buttonTextColor} hover:cursor-grab flex justify-center items-center w-1/4 h-10 pl-6 pr-6 p-6 rounded-lg ${buttonBackgroundColor}`
          : `text-sm ${buttonTextColor} hover:cursor-grab flex justify-center items-center w-full h-10 pl-6 pr-6 p-6 rounded-lg ${buttonBackgroundColor}`
      }
      onClick={buttonClicked}
      disabled={executingTransaction}
    >
      <div className="flex flex-row justify-center w-full items-center text-md font-bold">
        {returnView()}
      </div>
    </button>
  )
}