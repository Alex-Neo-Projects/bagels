import { useEffect, useState } from "react";
import { TextInputs } from "../components/TextInputs";
import Header from "../components/Header";
import { SERVER_URL } from "../constants";
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
} from "../theme";
import { Transaction } from "../components/Transaction";
import { ethers } from "ethers";

export default function Contracts({ contractFilename }) {
  const [contract, setContract] = useState(null);
  const [balances, setBalances] = useState(null);
  const [abiState, setAbiState] = useState(null);
  const [hasConstructor, setHasConstructor] = useState(false);
  const [constructorDeployed, setConstructorDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null)

  const [transactions, setTransactions] = useState([]);
  const [contractNameState, setContractNameState] = useState(null);

  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listening) {
      const events = new EventSource(`${SERVER_URL}/subscribeToChanges`);

      events.onmessage = async (event) => {
        if (event) {
          const message = JSON.parse(event.data);

          try {
            if (message.msg === "redeployed") {
              clear();
              await init();
            } else if (message.error) {
              throw new Error(message.error);
            }
          } catch (e) {
            setError(e);
          }
        } else {
          throw new Error("Unable to get event message");
        }
      };

      setListening(true);
    }
  }, [listening]);

  function clear() {
    setConstructorDeployed(false);
    setError(null);
    setContract(null);
    setBalances(null);
    setAbiState(null);
    setTransactions([]);
    setContractNameState(null);
  }

  async function init() {
    try {
      await getWalletAddress();
      await getBalance();
      await getContract();

      const { returnedAbi } = await getABI();

      let hasConstructor =
        Object.values(returnedAbi)
          .flat(2)
          .filter((curr) => curr.type === "constructor")?.length > 0;

      if (hasConstructor) {
        setHasConstructor(true);
        return;
      }

      await deployContract(contractFilename, []);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async function getBalance() {
    const balance = await fetch(`${SERVER_URL}/balances`, {
      method: "GET",
    });

    const jsonifiedBalance = await balance.json();

    setBalances({ balances: jsonifiedBalance });
  }

  async function TextInputDeployContract(constructor) {
    try {
      await deployContract(contractFilename, constructor);
      setConstructorDeployed(true);
    } catch (e) {
      setError(e);
    }
  }

  async function deployContract(contractFilename, constructor) {
    const deployment = await fetch(`${SERVER_URL}/deployContract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contractFilename: contractFilename,
        constructor: constructor,
      }),
    });

    const deploymentParsed = await deployment.json();

    if (deployment.status !== 200) {
      throw new Error(deploymentParsed.error);
    } else {
      setContractAddress(deploymentParsed["contract"]["contract"]["address"]);
      setContract(deploymentParsed["contract"]);
    }
  }

  async function getABI() {
    try {
      const abiAndBytecode = await fetch(
        `${SERVER_URL}/abi?contractName=${contractFilename}`,
        {
          method: "GET",
        }
      );

      const jsonifiedAbiAndBytecode = await abiAndBytecode.json();

      if (abiAndBytecode.status === 200) {
        const contractNameFromAbi = Object.keys(
          jsonifiedAbiAndBytecode["abi"]
        )[0];

        setContractNameState(contractNameFromAbi);
        setAbiState(jsonifiedAbiAndBytecode["abi"]);

        return {
          returnedAbi: jsonifiedAbiAndBytecode["abi"],
          bytecode: jsonifiedAbiAndBytecode["bytecode"],
        };
      } else {
        throw new Error(jsonifiedAbiAndBytecode.error);
      }
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async function getContract() {
    try {
      const contractRes = await fetch(
        `${SERVER_URL}/getCurrentContract?contractFilename=${contractFilename}`,
        {
          method: "GET",
        }
      );

      const contractResParsed = await contractRes.json();

      if (contractRes.status === 200) {
        if (Object.keys(contractResParsed).length === 0) {
          setTransactions([]);
        } else {
          setTransactions(
            contractResParsed["contract"]["currentVersion"]["transactions"]
          );
        }

        return contractResParsed["contract"];
      } else {
        throw new Error("Unable to fetch contract");
      }
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async function getWalletAddress() {
    try {
      const walletRes = await fetch(
        `${SERVER_URL}/getWalletAddress`,
        {
          method: "GET",
        }
      );

      const walletResParsed = await walletRes.json();

      if (walletRes.status === 200) {
        setWalletAddress(walletResParsed["address"])
        return walletResParsed["address"];
      } else {
        throw new Error("Unable to fetch wallet address");
      }
    } catch (e) {
      throw new Error(e.message);
    }
  }

  function renderFunctionHeader(val) {
    let header = "";
    switch (val.type) {
      case "function":
        return (
          <div>
            <p className={keywordStyleColored}>function</p>
            <p className={`${functionStyleColored} ml-1`}>{val.name}</p>
            <p className={`${paranthesisStyle}`}>(</p>
            {/* Style comes from inputsToString */}
            <p className="inline">{inputsToString(val.inputs)}</p>
            <p className={`${paranthesisStyle}`}>)</p>
            <p className={`${stateMutabilityStyle} ml-1`}>
              {val.stateMutability}
            </p>

            {/* Show payable tooltip to say that all inputs are in wei */}
            {val.stateMutability === 'payable' && (
              <div className={`inline text-lg font-bold ml-1`}>
                <img src={require('../assets/tooltip.png')} className="inline hover:cursor-grab" style={{height: 19}} onClick={() => alert('All payable inputs are in wei')}/>
              </div>
            )}
          </div>
        );
      case "receive":
        // Note: receive (fallback) functions can't have a parameter
        return (
          <div>
            <p className={`${keywordStyleColored}`}>receive</p>
            <p className={`${functionStyleColored}`}>{val.name}</p>
            <p className={`${paranthesisStyle}`}>()</p>
            <p className={`${stateMutabilityStyle} ml-1`}>
              {val.stateMutability}
            </p>
          </div>
        );
      case "constructor":
        // Don't need to show the constructor on the next page
        break;
      case "fallback":
        return (
          <div>
            <p className={`${keywordStyleColored}`}>fallback</p>
            <p className={`${functionStyleColored}`}>{val.name}</p>
            <p className={`${paranthesisStyle}`}>()</p>
            <p className={`${stateMutabilityStyle} ml-1`}>
              {val.stateMutability}
            </p>
          </div>
        );
      default:
        "";
    }

    return header;
  }

  function inputsToString(valInputs) {
    if (!valInputs) return "";

    const param = valInputs.map((input, idx) => {
      if (input) {
        return (
          <div className="inline">
            <p className={`${parameterTypeStyle} inline mr-1`}>
              {/* ABIs usually show structs as being type tuple which is confusing */}
              {`${input.type === 'tuple' ? 'struct' : input.type}`}
            </p>
            <p className={`${parameterNameStyle}`}>{`${input.name}`}</p>
            <p className={`${commaStyle} inline`}>{`${
              valInputs.length - 1 === idx ? "" : ", "
            }`}</p>
          </div>
        );
      } else {
        return "";
      }
    });

    return param;
  }

  return (
    <Header>
      <div className="md:space-x-2 space-y-4 md:space-y-0 flex md:flex-row flex-col">
        <div className="flex lg:w-1/2 w-full">
          <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            {error && (
              <div className="justify-start items-start pt-1 w-full">
                <p className="text-md text-bold text-center pl-3 pr-3 p-3 border border-1 border-[#FF0057] text-[#FF0057] rounded-lg">
                  {error?.message || ""}
                </p>
              </div>
            )}

            {(!abiState || !balances) && !error && (
              <div className="max-w-lg">
                <p className="text-md tracking-tighter text-left font-bold">
                  Loading {contractFilename}
                </p>
              </div>
            )}

            {hasConstructor && !constructorDeployed && !contract ? (
              <div className="flex flex-col justify-start space-y-4">
                {abiState &&
                contractNameState &&
                abiState[contractNameState].filter(
                  (constructor) =>
                    constructor.type === "constructor" &&
                    constructor.inputs.length > 0
                ).length > 0 ? (
                  <p className="text-xl font-medium">Enter constructors:</p>
                ) : (
                  <p className="text-xl font-medium">
                    Write with default constructors:
                  </p>
                )}

                {abiState &&
                  contractNameState &&
                  abiState[contractNameState]
                    .filter((constructor) => constructor.type === "constructor")
                    .map((val, idx) => {
                      return (
                        <TextInputs
                          val={val}
                          idxOne={idx}
                          contract={contract}
                          hasConstructor={hasConstructor}
                          contractFilename={contractFilename}
                          getBalance={getBalance}
                          deployContract={TextInputDeployContract}
                          getContract={getContract}
                        />
                      );
                    })}
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
                          {contractNameState || ""}
                        </h1>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="space-y-1">
                          <p className={plainSubtitleStyle}>Contract Address</p>
                          <p className={subheading}>{contractAddress || ""}</p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="space-y-1">
                          <p className={plainSubtitleStyle}>Wallet address</p>
                          <p className={subheading}>
                            {walletAddress || ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <p className={plainSubtitleStyle}>Token Balance</p>
                        <p className={subheading}>
                          ETH: {balances.balances.eth || "0"}
                        </p>
                      </div>

                      <div className="flex flex-col pt-2">
                        <div className="flex flex-col space-y-3">
                          {abiState &&
                            contractNameState &&
                            abiState[contractNameState]
                              .filter((input) => input.type !== "constructor")
                              .reverse()
                              .map((val, idx) => {
                                return (
                                  <div
                                    key={idx.toString()}
                                    className="space-y-2"
                                  >
                                    <div>{renderFunctionHeader(val)}</div>
                                    <TextInputs
                                      val={val}
                                      hasConstructor={hasConstructor}
                                      contract={contract}
                                      contractFilename={contractFilename}
                                      idxOne={idx}
                                      getBalance={getBalance}
                                      deployContract={TextInputDeployContract}
                                      getContract={getContract}
                                    />
                                  </div>
                                );
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

        <div className="flex lg:w-1/2 w-full">
          <div className=" text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            <div className="flex flex-col justify-start space-y-4">
              <div className="flex flex-col justify-start items-start space-y-4">
                <div className="flex flex-col">
                  <h1 className={plainTitleStyle}>
                    Transactions in this contract
                  </h1>
                </div>
                <div className="flex flex-col w-full">
                  <div className="flex flex-col space-y-2">
                    {transactions?.length > 0 ? (
                      transactions
                        .slice()
                        .reverse()
                        .filter((transaction) => {
                          return (
                            ethers.utils.getAddress(transaction.receipt.to) ===
                            contractAddress
                          );
                        })
                        .map((val, idx) => {
                          return (
                            <Transaction
                              val={val}
                              idx={idx}
                              filteredTransactionsLength={
                                transactions.filter(
                                  (transaction) =>
                                    ethers.utils.getAddress(
                                      transaction.receipt.to
                                    ) === contractAddress
                                ).length
                              }
                            />
                          );
                        })
                    ) : (
                      <div className="pt-4">
                        <p className="text-md font-extrabold">
                          No Transactions to show yet
                        </p>
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
  );
}
