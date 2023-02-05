pragma solidity ^0.8.17;

contract TimeLockContract {
	uint public constant MIN_DELAY = 10; 
	uint public constant MAX_DELAY = 1000; 
	uint public constant GRACE_PERIOD = 1000; 
	
	address public owner;

	//NOTE: commenting here causes crash
	// constrtor(string memory test, string memory thatsAFloater) {}
}
