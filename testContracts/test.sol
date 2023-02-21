// SPDX-License-Identifier: MIT
pragma solidity >0.5.0;

contract TestContract { 
  address[] pools; 

  function addAddress(address newAddress) public { 
    pools.push(newAddress);
  }
}
