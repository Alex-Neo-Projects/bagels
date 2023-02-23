import React from "react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { SERVER_URL, uintTypes, intTypes } from "../constants";
import { buttonBackgroundColor, buttonTextColor } from "../theme";
import { InputBox } from "./InputBox";

export function TextInputs({
  val,
  idxOne,
  contract,
  hasConstructor,
  getBalance,
  deployContract,
  contractFilename,
  getContract,
}) {
  const [inputs, setInputs] = useState([]);
  const [amount, setAmount] = useState(null);
  // const [isWei, setIsWei] = useState(true);
  const [executingTransaction, setExecutingTransaction] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  // Update fees when a trasaction gets executed
  useEffect(() => {
    getBalance();
  }, [output]);

  // index[0] === the param value
  // index[1] === the param type
  function handleInputListChange(index, event) {
    var inputsCopy = inputs.slice();
    inputsCopy[index[0]] = [event.target.value, index[1]];

    setInputs(inputsCopy);
  }

  function validateInputs() {
    let newError;

    if (val.inputs.length !== inputs.length)
      newError = "Please fill out all inputs";

    inputs.map((item) => {
      if (item[1] === "string" && typeof item[0] !== "string") {
        newError = `Invalid input: ${item[0]}. It should be of type: ${item[1]}`;
      } else if (
        (uintTypes.includes(item[1]) || intTypes.includes(item[1])) &&
        !isFinite(item[0])
      ) {
        newError = `Invalid input: ${item[0]}. It should be of type: ${item[1]}`;
      } else if (item[0].length === 0 || !item[0]) {
        newError = "Please enter an input";
      }
    });

    setError(newError);
    if (newError) {
      return false;
    } else {
      return true;
    }
  }

  function clear() {
    setOutput();
    setError();
    setExecutionError();
  }

  // function convertWeiToEth(weiValue) {
  //   try {
  //     const converted = ethers.utils.formatEther(weiValue);
  //     return converted.toString();
  //   } catch (e) {}
  // }

  // function convertEthToWei(ethValue) {
  //   try {
  //     const converted = ethers.utils.parseEther(ethValue);
  //     return converted.toString();
  //   } catch (e) {}
  // }

  return (
    <div
      className="flex flex-col justify-between items-start space-y-1 h-full "
      key={idxOne.toString()}
    >
      <div className="flex justify-end w-full items-center space-x-4">
        {/* Check for val.inputs since certain types don't have an inputs field: i.e., fallback(), receive()  */}
        {val.inputs &&
          val.type !== "event" &&
          val.inputs.map((param, idx) => {
            return (
              <InputBox
                inputType={"text"}
                inputPlaceholder={`${param.name} (${param.type === 'tuple' ? 'struct' : param.type})`}
                onInputFunction={handleInputListChange.bind(this, [
                  idx,
                  param.type,
                ])}
              />
            );
          })}

        {val.stateMutability === "payable" && (
          <>
            <InputBox
              inputType={"text"}
              inputPlaceholder={"Enter amount (wei)"}
              onInputFunction={(e) =>
                setAmount(parseFloat(e.target.value) || null)
              }
              value={amount}
            />
            {/* <button
              onClick={() => {
                setIsWei(!isWei);

                if (amount > 0) {
                  if (isWei) {
                    const convertedEth = convertWeiToEth(amount);
                    setAmount(convertedEth);
                  } else {
                    const convertedWei = convertEthToWei(amount);
                    setAmount(parseFloat(convertedWei));
                  }
                }
              }}
              className={`text-sm ${buttonTextColor} hover:cursor-grab flex justify-center items-center w-1/4 h-10 pl-6 pr-6 p-6 rounded-lg ${buttonBackgroundColor}`}
            >
              <p className="text-sm">Convert to {isWei ? "Wei" : "ETH"}</p>
            </button> */}
          </>
        )}

        {val.type !== "event" && (
          <button
            className={
              // If there's an input, show the input and the button on the same line.
              // If there's no input, make the button fill up the full line
              (val.inputs && val.inputs.length > 0) ||
              val.stateMutability === "payable"
                ? `text-sm ${buttonTextColor} hover:cursor-grab flex justify-center items-center w-1/4 h-10 pl-6 pr-6 p-6 rounded-lg ${buttonBackgroundColor}`
                : `text-sm ${buttonTextColor} hover:cursor-grab flex justify-center items-center w-full h-10 pl-6 pr-6 p-6 rounded-lg ${buttonBackgroundColor}`
            }
            onClick={async () => {
              // Clear outputs and errors
              clear();

              // Validation goes here
              const inputIsValid = validateInputs();

              if (val.inputs.length > 0 && !inputIsValid) {
                return;
              }

              // Execute transaction
              setExecutingTransaction(true);

              if (val.type === "constructor") {
                await deployContract(inputs);
                return;
              }

              const res = await fetch(`${SERVER_URL}/executeTransaction`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contractFilename: contractFilename,
                  functionName: val.name,
                  params: inputs,
                  stateMutability: val.stateMutability,
                  type: val.type,
                  // amount: isWei ? amount : convertEthToWei(amount),
                  amount: amount,
                }),
              });

              const jsonParsed = await res.json();
              if (res.status === 200) {
                setOutput(jsonParsed["output"] || "");
                getContract();
              } else if (res.status === 500) {
                setExecutionError(jsonParsed["error"] || "");
              }

              setTimeout(() => {
                setExecutingTransaction(false);
              }, 200);
            }}
            disabled={executingTransaction}
          >
            <div className="flex flex-row justify-center w-full items-center text-md font-bold">
              {executingTransaction ? (
                <div className="flex flex-row justify-center items-center">
                  <p>Loading...</p>
                </div>
              ) : val.stateMutability === "view" ||
                val.stateMutability === "pure" ? (
                <p>Read</p>
              ) : (
                <p>Write</p>
              )}
            </div>
          </button>
        )}
      </div>

      {output && (
        <div className="flex flex-col pt-4 space-y-4 w-full">
          <p className="text-md font-bold">Transaction Successful</p>
          <div className="flex flex-row justify-start items-center space-x-4 w-full">
            <div className="flex flex-col w-full bg-[#93939328] border border-[#93939328] rounded-lg p-2 text-sm">
              <pre style={{ whiteSpace: "pre-line" }} className="text-sm">
                {output}
              </pre>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex flex-row justify-center items-center space-x-4 pt-4 w-full">
          <p className="text-md font-bold w-10">Error</p>
          <div className="flex w-full border border-[#FF0057] text-[#FF0057] rounded-lg p-2 text-sm">
            <p className="text-sm">{error.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      )}

      {executionError && (
        <div className="flex flex-row justify-center items-center space-x-4 pt-4 w-full overflow-hidden break-all">
          <p className="text-md font-bold w-10">Error</p>
          <div className="flex w-full border border-[#FF0057] text-[#FF0057] rounded-lg p-2 text-sm">
            <pre className="text-sm">{executionError}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
