// SPDX-License-Identifier: MIT
pragma solidity >0.5.0;

contract TestContract { 

  function arrayInputs(address[] memory _stringArr) public view returns (string memory) { 
    return "hello world";
  }
}
