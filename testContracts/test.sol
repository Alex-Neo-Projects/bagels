// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

contract TestContract { 
  address[] pools; 

  struct myStruct { 
    string name;
    uint age;
  }

  // event NewMessage(string message, address sender); 

  string setString; 

  function returnStruct() public pure returns (myStruct memory) {
    myStruct memory newStruct;
    newStruct.name = 'hello'; 
    newStruct.age = 123;

    return newStruct;
  }
  function testPayable() public payable returns (uint) {
    return msg.value;
  }

  function testReturnAddr() public returns(address[] memory) { 
    pools.push(msg.sender);
    return pools;
  }

  function viewArr(uint[] memory intArr, uint testInt) public view returns (uint[] memory, uint) { 
    return (intArr, testInt);
  }

  function testMemoryGas(uint[] memory uintArr) public returns (uint[] memory) { 
    setString = "hello world"; 
    return uintArr;
  }

  function testCallDataGas(uint[] calldata uintArr) external { 
    setString = "hello world";
  }

  // function testArr(uint[] calldata _numbers) public payable returns (uint[] calldata) { 
  //   return _numbers;
  // }

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
