// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RFQRegistry {
    struct RFQ {
        uint256 id;
        address owner;
        string title;
        string metaHash;
        uint256 deadline;
        string category;
        uint256 budget;
        string location;
        bool active;
    }

    struct Bid {
        uint256 id;
        uint256 rfqId;
        address bidder;
        uint256 price;
        string docHash;
    }

    uint256 public nextId;
    uint256 public nextBidId;

    mapping(uint256 => RFQ) public rfqs;
    mapping(uint256 => Bid[]) public rfqBids; // RFQ ID → array of bids

    // ----------------- Events -----------------
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
    event BidSubmitted(uint256 indexed id, uint256 indexed rfqId, address indexed bidder, uint256 price, string docHash);

    // ----------------- RFQ Functions -----------------
    function createRFQ(
        string calldata title,
        string calldata metaHash,
        uint256 deadline,
        string calldata category,
        uint256 budget,
        string calldata location
    ) external returns (uint256 id) {
        id = ++nextId;
        rfqs[id] = RFQ(id, msg.sender, title, metaHash, deadline, category, budget, location, true);
        emit RFQCreated(id, msg.sender, title, metaHash, deadline, category, budget, location);
    }

    function closeRFQ(uint256 id) external {
        RFQ storage r = rfqs[id];
        require(r.owner == msg.sender, "not owner");
        require(r.active, "already closed");
        r.active = false;
        emit RFQClosed(id);
    }

    // ----------------- Bid Function -----------------
    function submitBid(
        uint256 rfqId,
        uint256 price,
        string calldata docHash
    ) external returns (uint256 bidId) {
        require(rfqs[rfqId].active, "RFQ not active");
        bidId = ++nextBidId;
        rfqBids[rfqId].push(Bid(bidId, rfqId, msg.sender, price, docHash));
        emit BidSubmitted(bidId, rfqId, msg.sender, price, docHash);
    }
}
