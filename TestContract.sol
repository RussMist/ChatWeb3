pragma solidity ^0.5.0;

contract Latest {
    string public name;

    constructor(string memory _name) public {
        name = _name;
    }

    function setName(string memory _name) public {
        name = _name;
    }
}
