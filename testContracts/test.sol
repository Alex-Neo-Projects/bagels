// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

contract TestContract { 
  function slot0(address pool) public view returns (string memory) { 
    return 'slot01';
  }

  function slot0(address pool, uint24 _int) public view returns (string memory) { 
    return 'slot01';
  }

  function loadTicksForMultiplePools(address[] memory pools, int24 notRoundedTicksAroundCenter) public view returns (string memory) { 
    return 'slot01';
  }

  function loadTicks(address pool, int24 notRoundedTicksAroundCenter) public pure returns (string memory) { 
    return "hello!";
  }

  function loadTicks(address pool, int24 notRoundedTicksAroundCenter, int24 tickUpper) public pure returns (string memory) { 
    return "hello!";
  }
}
