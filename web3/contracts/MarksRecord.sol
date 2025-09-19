// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MarksRecord {
    // Mapping student address → marks
    mapping(address => uint256) private marks;

    // Event for logging marks update
    event MarksUpdated(address indexed student, uint256 marks);

    // Store marks for the sender
    function setMarks(uint256 _marks) external {
        require(_marks <= 100, "Marks must be between 0 and 100");
        marks[msg.sender] = _marks;
        emit MarksUpdated(msg.sender, _marks);
    }

    // Fetch marks of a student (self or anyone)
    function getMarks(address student) external view returns (uint256) {
        return marks[student];
    }
}
