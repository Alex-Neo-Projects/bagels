// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract NewContract { 
  string private theGreeting = 'hello world'; 
  string public newVar = 'asdfasdfa';

  function greeting() public view returns (string memory) { 
    return theGreeting; 
  }

  function setGreeting(string memory newGreeting) public { 
    theGreeting = newGreeting; 
  }
}