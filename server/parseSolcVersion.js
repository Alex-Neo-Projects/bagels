export function getPragmaSolidity(contractString) {
  const lines = contractString.split('\n');
  return lines?.find(line => line.startsWith('pragma solidity'))?.split('pragma solidity')[1].replace(';', '').trim();
}
