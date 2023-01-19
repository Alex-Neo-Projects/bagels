import { useEffect, useState } from 'react'
import { TextInputs } from '../components/TextInputs'
import Header from '../components/Header';

export default function Contracts({}) { 
  return (
    <p>asdf</p>
  )
}
// export default function Contracts({contractName}) {
//   const [balances, setBalances] = useState()
//   const [abiState, setAbiState] = useState()
//   const [constructorIndex, setConstructorIndex] = useState();
//   const [constructorDeployed, setConstructorDeployed] = useState(false); 

//   const [funding, setFunding] = useState(false)
//   const [contractNameState, setContractNameState] = useState();
//   const [bytecodeState, setBytecodeState] = useState();

//   useEffect(() => {
//     console.log('funding updated'); 
//   }, [funding])

//   useEffect(() => {
//     if (isReady) {
//       async function runStart() { 
//         await getBalance();
//         const { returnedAbi, bytecode }  = await getABI();

//         let constructorIndex = getConstructorAbiIndex(returnedAbi); 

//         if (constructorIndex !== -1) {
//           setConstructorIndex(constructorIndex)
//           return;
//         }

//         await deployContract(returnedAbi, bytecode, '');
//       } 

//       runStart();
//     }
//   }, [funding, isReady])

//   async function getBalance() { 
//     const balance = await fetch('http://localhost:3001/balances', {
//       method: 'GET',
//     })

//     const jsonifiedBalance = await balance.json()
//     setBalances({balances: jsonifiedBalance})
//   }

//   function getConstructorAbiIndex(abi) {
//     let abiValues = Object.values(abi)[0];

//     for (var index = 0; index < abiValues.length; index++) {
//       let currentItem = abiValues[index]
      
//       if (currentItem['type'] === 'constructor') {
//         return index;
//       }
//     }
//     return -1;
//   }

//   async function TextInputDeployContract(constructor) { 
//     await deployContract(abiState, bytecodeState, constructor);
//     setConstructorDeployed(true);

//     console.log('after text input')
//   }

//   async function deployContract(abi, bytecode, constructor) {
//     const deployment = await fetch(`http://localhost:3001/deployContract`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         abi: abi, 
//         bytecode: bytecode, 
//         constructor: constructor
//       })
//     })

//     if (deployment.status !== 200) {
//       console.log('ERROR DEPLOYING THE CONTRACT!!!!');
//     }

//     console.log('after deplyo contract')
//   }

//   async function getABI() {
//     const abiAndBytecode = await fetch(`http://localhost:3001/abi?contractName=${contractName}`, {
//       method: 'GET',
//     })

//     const jsonifiedAbiAndBytecode = await abiAndBytecode.json()

//     const contractName = Object.keys(jsonifiedAbiAndBytecode['abi'])[0]
//     setContractNameState(contractName); 

//     setAbiState(jsonifiedAbiAndBytecode['abi'])
//     setBytecodeState(jsonifiedAbiAndBytecode['bytecode']);

//     return {'returnedAbi': jsonifiedAbiAndBytecode['abi'], 'bytecode': jsonifiedAbiAndBytecode['bytecode'] }; 
//   }

//   function renderFunctionHeader(val) {
//     let header = ''
//     switch (val.type) {
//       case 'function':
//         header += `function ${val.name}(${inputsToString(val.inputs)}) ${
//           val.stateMutability
//         }`
//         break
//       case 'receive':
//         header += `function ${val.name}(${inputsToString(val.inputs)}) ${
//           val.stateMutability
//         }`
//         break
//       case 'constructor':
//         header += `constructor(${inputsToString(val.inputs)}) ${
//           val.stateMutability
//         }`
//         break
//       case 'fallback':
//         header += `fallback() ${val.stateMutability}`
//         break
//       default:
//         ''
//     }

//     return header
//   }

//   function inputsToString(valInputs) {
//     const param = valInputs.map((input, idx) => {
//       if (input) {
//         return `${input.type} ${input.name}${
//           valInputs.length - 1 === idx ? '' : ','
//         }`
//       } else {
//         return ''
//       }
//     })

//     return param
//   }
  
//   return (
//     <Header>
//       {!abiState || !balances || !isReady ? (
//         <div className="mt-2 mb-2 max-w-lg space-y-6">
//           <p>loading</p>
//         </div>
//       ) : (
//         // Show constructor inputs if a valid constructor is found
//         constructorIndex > -1 && !constructorDeployed ? (
//           <div>
//             <p>Enter constructors</p>
//             <TextInputs 
//               val={abiState[contractNameState][constructorIndex]} 
//               idxOne={0}
//               getBalance={getBalance}
//               deployContract={TextInputDeployContract}
//             />
//           </div>
//         ) : (
//           <div className="mt-2 mb-2 max-w-lg space-y-6">
//             <div className="flex">
//               <a href='/'>
//                 <img className="mr-2 pt-1" src="https://cdn-icons-png.flaticon.com/512/93/93634.png" height={10} width={35} />
//               </a>
//               <p className="text-4xl font-bold">
//                 Contract {contractNameState || ''}
//               </p>

//             </div>
//             <div>
//               <p className="text-xl font-medium">
//                 Connected to wallet with address:{' '}
//               </p>
//               <p className="text-sm">
//                 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
//               </p>
//               <p className="text-xl font-medium pt-4">Private key: </p>
//               <p className="text-sm">
//                 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
//               </p>
//             </div>

//             <div>
//               <p className="text-xl font-bold">Address Balance</p>
//               <div className="mt-1">
//                 {Object.entries(balances.balances).map(([name, value], idx) => {
//                   return (
//                     <div key={idx.toString()}>
//                       <p className="text-md">
//                         {name}: {value}
//                       </p>
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>

//             <div>
//               <p className="text-xl font-bold">ERC20 Token Faucet</p>

//               <div className="flex mt-2">
//                 {funding ? (
//                   <svg
//                     aria-hidden="true"
//                     role="status"
//                     className="inline w-4 h-4 mr-3 text-black animate-spin"
//                     viewBox="0 0 100 101"
//                     fill="none"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
//                       fill="#E5E7EB"
//                     />
//                     <path
//                       d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
//                       fill="currentColor"
//                     />
//                   </svg>
//                 ) : (
//                   <button
//                     className="text-sm text-white hover:cursor-grab flex justify-center items-center w-30 h-10 pl-4 pr-4 p-4 rounded-xl bg-[#3670F9]"
//                     onClick={async () => {
//                       setFunding(true)
//                       const r = await fetch('http://localhost:3001/fundUSDC', { method: 'POST' })
//                       const receipt = await r.json()
//                       // setFundingReceipt((prev) => [receipt, ...prev])
//                       setFunding(false)
//                     }}
//                     disabled={funding}
//                   >
//                     Drip 100 USDC
//                   </button>
//                 )}
//               </div>
//             </div>

//             <div>
//               <p className="text-xl font-bold">ABI</p>

//               <div className="flex flex-col space-y-2">
//                 {abiState[contractNameState]
//                   .sort((a, b) => {
//                     if (a.stateMutability === 'view') {
//                       return -1
//                     }
//                     if (b.stateMutability === 'view') {
//                       return 1
//                     }
//                     return 0
//                   })
//                   .map((val, idx) => {
//                     return (
//                       <div key={idx.toString()}>
//                         <p className="text-md font-bold mt-2">
//                           {renderFunctionHeader(val)}
//                         </p>

//                         <TextInputs
//                           val={val}
//                           idxOne={idx}
//                           getBalance={getBalance}
//                           deployContract={TextInputDeployContract}
//                         />
//                       </div>
//                     )
//                   })}
//               </div>
//             </div>
//           </div>
//         )
//       )}
//     </Header>
//   )
// }
