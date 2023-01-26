// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract NewContract { 
  string private theGreeting = 'hello'; 
  string public newVar = '1';

  constructor(string memory test) {}

  function greeting() public view returns (string memory) { 
    return theGreeting; 
  }

  function setGreeting(string memory newGreeting) public { 
    theGreeting = newGreeting; 
  }

  function setROBOOOOOO(string memory newGreeting) public { 
    theGreeting = newGreeting; 
  }

  function asdfasdf(string memory newGreeting) public payable { 
    theGreeting = newGreeting; 
  }

   function gobber(string memory newGreeting) public payable { 
    theGreeting = newGreeting; 
  }
}