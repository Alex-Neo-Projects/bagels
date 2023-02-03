import { ReadWriteButton } from "./ReadWriteButtons";
import { ethers } from "ethers";

export function PayableButton({val, amount, setAmount, buttonClicked, executingTransaction}) {
  console.log('here is amount: ', amount); 

  const unitsButton = () => {
    return (
      <button
        onClick={() => {
          // TODO: format to different amount types
          console.log(
            ethers.utils.formatEther(amount)
          )
        }}
      >
        <div className='text-sm ${buttonTextColor} hover:cursor-grab flex justify-center items-center h-10 p-6 rounded-lg bg-gray-700'>
          GWEI
        </div>
      </button>
    )
  }
  return (
    <>
      {unitsButton()}
      <ReadWriteButton inputs={val.inputs} buttonClicked={buttonClicked} executingTransaction={executingTransaction} stateMutability={val.stateMutability} />
    </>
  )
}