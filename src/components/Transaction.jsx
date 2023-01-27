import { buttonBackgroundColor } from "../theme"
import { useState } from "react"

export function Transaction({val, idx, filteredTransactionsLength}) {
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  return (
    <div
      key={idx.toString()}
      className="space-y-6 p-4 pl-4 pr-4 border border-[#93939328] rounded-2xl break-all overflow-hidden"
    >
      <div>
        <p className="text-lg font-extrabold">
          Transaction #{filteredTransactionsLength - idx}
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
            className={`text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#93939328]  hover:${buttonBackgroundColor}`}
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
              className={`text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-6 pr-6 p-6 rounded-lg bg-[#93939328] hover:${buttonBackgroundColor}`}
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
}
