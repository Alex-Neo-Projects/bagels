// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract MyParentContract { 
  string private parentGreeting = 'hello from parent'; 

  function getParentGreeting() public view returns (string memory) { 
    return parentGreeting; 
  }

  function setParentGreeting (string memory newParentGreeting) public { 
    parentGreeting = newParentGreeting; 
  }
}