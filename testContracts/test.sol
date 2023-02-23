// SPDX-License-Identifier: MIT
pragma solidity >0.5.0;

contract TestContract {
  uint payment; 

  function arrayInputs(address[] memory _stringArr) public view returns (string memory) { 
    return "hello world";
  }

  function getPayment() public view returns (uint) { 
    return payment;
  }

  // function testWei() public payable returns (string memory) { 
  //   payment = msg.value;

  //   return "paid!";
  // }
}
