pragma solidity ^0.8.17;

contract TimeLockContract {
	uint public constant MIN_DELAY = 10; 
	uint public constant MAX_DELAY = 1000; 
	uint public constant GRACE_PERIOD = 1000; 
	
	address public owner;

	//NOTE: commenting here causes crash
	// constrtor(string memory test, string memory thatsAFloater) {}

	function testMultiple() public view returns (string memory s, string memory t, uint256 x, bytes32 p) {
		s = "hello";
		t = "world"; 
		x = 100000000;
		p = hex"69602a60005260206000f3600052600a6016f3";
	}
}
