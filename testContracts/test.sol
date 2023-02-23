// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

contract TestContract { 
  function loadTicks(address pool, int24 notRoundedTicksAroundCenter) public pure returns (string memory) { 
    return "hello!";
  }

  function loadTicks(address pool, int24 notRoundedTicksAroundCenter, int24 tickUpper) public pure returns (string memory) { 
    return "hello!";
  }
}
