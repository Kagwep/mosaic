// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MosaicNFT.sol";

contract Mosaic is Ownable, ReentrancyGuard {
    uint256 private _nextArtworkId = 1;
    uint256 private _nextCompetitionId = 1;
    uint256[] private allArtworkIds;
    uint256 public constant DRAWING_TIME_LIMIT = 2 minutes;

    struct Competition {
        uint256 id;
        uint256 endTime;
        bool completed;
        uint256 winnerId;
        uint256[] artworkIds;
    }

    struct Artwork {
        string title;
        string originalArtHash;
        address originalArtist;
        uint256 createdAt;
        address nftContract;
        uint256 latestTokenId;
        uint256 competitionId;
        uint256 votes;
    }

    struct DrawingSlot {
        address artist;
        uint256 startTime;
        bool active;
    }

    mapping(uint256 => Competition) public competitions;
    mapping(uint256 => Artwork) public artworks;
    mapping(uint256 => DrawingSlot) public drawingSlots;
    mapping(uint256 => string[]) public contributionHashes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256[]) private artistArtworks;

    event CompetitionStarted(uint256 indexed competitionId, uint256 endTime);
    event CompetitionCompleted(uint256 indexed competitionId, uint256 indexed winnerId);
    event ArtworkCreated(uint256 indexed artworkId, uint256 indexed competitionId, address indexed artist, string title);
    event ContributionAdded(uint256 indexed artworkId, address indexed artist, string artHash, address nftContract, uint256 tokenId);
    event DrawingSlotRequested(uint256 indexed artworkId, address indexed artist, uint256 endTime);
    event DrawingSlotExpired(uint256 indexed artworkId, address indexed artist);
    event VoteSubmitted(uint256 indexed artworkId, address indexed voter);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function startCompetition(uint256 _duration) external onlyOwner returns (uint256) {
        uint256 competitionId = _nextCompetitionId++;
        
        competitions[competitionId] = Competition({
            id: competitionId,
            endTime: block.timestamp + _duration,
            completed: false,
            winnerId: 0,
            artworkIds: new uint256[](0)
        });
        
        emit CompetitionStarted(competitionId, block.timestamp + _duration);
        return competitionId;
    }

    function createArtwork(
        uint256 _competitionId,
        string calldata _title,
        string calldata _artHash
    ) external nonReentrant returns (uint256) {
        Competition storage competition = competitions[_competitionId];
        require(competition.endTime > block.timestamp, "Competition ended");
        require(!competition.completed, "Competition completed");
        
        uint256 newArtworkId = _nextArtworkId++;
        
        MosaicNFT nftContract = new MosaicNFT(_title, address(this));
        uint256 tokenId = nftContract.mint(msg.sender);

        artworks[newArtworkId] = Artwork({
            title: _title,
            originalArtHash: _artHash,
            originalArtist: msg.sender,
            createdAt: block.timestamp,
            nftContract: address(nftContract),
            latestTokenId: tokenId,
            competitionId: _competitionId,
            votes: 0
        });

        contributionHashes[newArtworkId].push(_artHash);
        competition.artworkIds.push(newArtworkId);
        allArtworkIds.push(newArtworkId);
        artistArtworks[msg.sender].push(newArtworkId);

        emit ArtworkCreated(newArtworkId, _competitionId, msg.sender, _title);
        emit ContributionAdded(newArtworkId, msg.sender, _artHash, address(nftContract), tokenId);

        return newArtworkId;
    }

    function requestDrawingSlot(uint256 _artworkId) external {
        Artwork storage artwork = artworks[_artworkId];
        Competition storage competition = competitions[artwork.competitionId];
        
        require(competition.endTime > block.timestamp, "Competition ended");
        require(!competition.completed, "Competition completed");
        
        DrawingSlot storage slot = drawingSlots[_artworkId];
        require(!slot.active || block.timestamp > slot.startTime + DRAWING_TIME_LIMIT, 
                "Slot is occupied");

        if (slot.active) {
            emit DrawingSlotExpired(_artworkId, slot.artist);
        }

        slot.artist = msg.sender;
        slot.startTime = block.timestamp;
        slot.active = true;

        emit DrawingSlotRequested(_artworkId, msg.sender, block.timestamp + DRAWING_TIME_LIMIT);
    }

    function addContribution(
        uint256 _artworkId,
        string calldata _artHash
    ) external {
        Artwork storage artwork = artworks[_artworkId];
        Competition storage competition = competitions[artwork.competitionId];
        
        require(competition.endTime > block.timestamp, "Competition ended");
        require(!competition.completed, "Competition completed");
        
        DrawingSlot storage slot = drawingSlots[_artworkId];
        require(slot.active && slot.artist == msg.sender, "Not your drawing slot");
        require(block.timestamp <= slot.startTime + DRAWING_TIME_LIMIT, "Drawing time expired");

        MosaicNFT nftContract = MosaicNFT(artwork.nftContract);
        uint256 tokenId = nftContract.mint(msg.sender);

        contributionHashes[_artworkId].push(_artHash);
        artwork.latestTokenId = tokenId;
        slot.active = false;

        emit ContributionAdded(_artworkId, msg.sender, _artHash, artwork.nftContract, tokenId);
    }

    function vote(uint256 _artworkId) external {
        Artwork storage artwork = artworks[_artworkId];
        Competition storage competition = competitions[artwork.competitionId];
        
        require(competition.endTime > block.timestamp, "Voting ended");
        require(!competition.completed, "Competition completed");
        require(!hasVoted[_artworkId][msg.sender], "Already voted");

        artwork.votes++;
        hasVoted[_artworkId][msg.sender] = true;

        emit VoteSubmitted(_artworkId, msg.sender);
    }

    function completeCompetition(uint256 _competitionId) external onlyOwner {
        Competition storage competition = competitions[_competitionId];
        require(block.timestamp > competition.endTime, "Competition still ongoing");
        require(!competition.completed, "Already completed");
        require(competition.artworkIds.length > 0, "No participants");

        uint256 highestVotes = 0;
        uint256 winnerId = 0;

        for(uint256 i = 0; i < competition.artworkIds.length; i++) {
            uint256 artworkId = competition.artworkIds[i];
            Artwork storage artwork = artworks[artworkId];
            
            if(artwork.votes > highestVotes) {
                highestVotes = artwork.votes;
                winnerId = artworkId;
            }
        }
        
        competition.completed = true;
        competition.winnerId = winnerId;

        emit CompetitionCompleted(_competitionId, winnerId);
    }

    function getArtwork(uint256 _artworkId) external view returns (
        Artwork memory artwork,
        bool hasActiveSlot,
        address currentArtist,
        uint256 slotEndTime,
        uint256 contributionCount,
        bool isWinner
    ) {
        artwork = artworks[_artworkId];
        Competition storage competition = competitions[artwork.competitionId];
        DrawingSlot storage slot = drawingSlots[_artworkId];
        
        hasActiveSlot = slot.active && block.timestamp <= slot.startTime + DRAWING_TIME_LIMIT;
        currentArtist = hasActiveSlot ? slot.artist : address(0);
        slotEndTime = hasActiveSlot ? slot.startTime + DRAWING_TIME_LIMIT : 0;
        contributionCount = contributionHashes[_artworkId].length;
        isWinner = competition.completed && competition.winnerId == _artworkId;
    }

    function getCurrentCompetition() external view returns (uint256) {
        return _nextCompetitionId - 1;
    }

    function getCompetitionArtworks(uint256 _competitionId) external view returns (uint256[] memory) {
        return competitions[_competitionId].artworkIds;
    }

        function getCompetition(uint256 competitionId) external view returns (
        uint256 id,
        uint256 endTime,
        bool completed,
        uint256 winnerId,
        uint256[] memory artworkIds
    ) {
        Competition storage competition = competitions[competitionId];

        id = competition.id;
        endTime = competition.endTime;
        completed = competition.completed;
        winnerId = competition.winnerId;
        artworkIds = competition.artworkIds;
    }


    function getAllCompetitionIds() external view returns (uint256[] memory) {
        uint256[] memory competitionIds = new uint256[](_nextCompetitionId - 1);
        for (uint256 i = 1; i < _nextCompetitionId; i++) {
            competitionIds[i - 1] = i;
        }
        return competitionIds;
    }

    function getAllArtworkIds() external view returns (uint256[] memory) {
        return allArtworkIds;
    }

    
}