// SPDX-License-Identifier: MIT
pragma solidity >0.5.0;

contract TestContract { 
  // address[] pools; 

  // event NewMessage(string message, address sender); 

  function testPayable() public payable returns (uint) {
    return msg.value;
  }

  // function addAddress(address newAddress) public { 
  //   pools.push(newAddress);
  // }

  // function emitMessage(string memory _message) public returns (string memory, uint, address) { 
  //   emit NewMessage(_message, msg.sender);

  //   return ('asdf', 124, msg.sender);
  // }
   
  // function testView() public view returns (string memory) { 
  //   return "asdf";
  // }
}
