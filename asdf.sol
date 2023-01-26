// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract NEWCONTRACTZ { 
  string private theGreeting = 'ho h ho'; 
  string public newVar = 'asdasdff';

  constructor(string memory test) {}

  function setGreeting(string memory newGreeting) public { 
    newVar = ''; 
  }
}