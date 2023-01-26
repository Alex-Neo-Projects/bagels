// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./MyParentContract.sol";

contract BasicContract is MyParentContract { 
  string private theGreeting = 'hello world'; 
  string public newVar = 'asdfasdfa';

  function greeting2() public view returns (string memory) { 
    return theGreeting;
  }

  function greeting() public view returns (string memory) { 
    return theGreeting; 
  }

  function setGreeting(string memory newGreeting) public { 
    theGreeting = newGreeting; 
  }
}