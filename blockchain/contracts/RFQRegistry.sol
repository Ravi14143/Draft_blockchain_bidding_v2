// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RFQRegistry {
    struct RFQ {
        uint256 id;
        address owner;
        string title;        // short title
        string metaHash;     // keccak/IPFS CID of off-chain JSON
        uint256 deadline;    // unix seconds
        string category;     // short
        uint256 budget;      // integer units
        string location;     // optional short
        bool active;
    }

    uint256 public nextId;
    mapping(uint256 => RFQ) public rfqs;

    event RFQCreated(
        uint256 indexed id,
        address indexed owner,
        string title,
        string metaHash,
        uint256 deadline,
        string category,
        uint256 budget,
        string location
    );

    event RFQClosed(uint256 indexed id);

    function createRFQ(
        string calldata title,
        string calldata metaHash,
        uint256 deadline,
        string calldata category,
        uint256 budget,
        string calldata location
    ) external returns (uint256 id) {
        id = ++nextId;
        rfqs[id] = RFQ({
            id: id,
            owner: msg.sender,
            title: title,
            metaHash: metaHash,
            deadline: deadline,
            category: category,
            budget: budget,
            location: location,
            active: true
        });
        emit RFQCreated(id, msg.sender, title, metaHash, deadline, category, budget, location);
    }

    function closeRFQ(uint256 id) external {
        RFQ storage r = rfqs[id];
        require(r.owner == msg.sender, "not owner");
        require(r.active, "already closed");
        r.active = false;
        emit RFQClosed(id);
    }
}
