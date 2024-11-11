// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MosaicCommunities is Ownable, ReentrancyGuard {
    uint256 private _nextCommunityId = 1;
    
    struct Community {
        uint256 id;
        string name;
        string description;
        string bannerHash;
        string avatarHash;
        address creator;
        uint256 createdAt;
        bool isActive;
        uint256[] competitionIds;
        uint256[] artworkIds;
        uint256 memberCount;
    }

    struct CommunityMember {
        bool isMember;
        uint256 joinedAt;
        bool isModerator;
    }

    mapping(uint256 => Community) public communities;
    mapping(uint256 => mapping(address => CommunityMember)) public communityMembers;
    mapping(address => uint256[]) public userCommunities;
    mapping(uint256 => address[]) private communityModerators;

    // Events
    event CommunityCreated(
        uint256 indexed communityId, 
        address indexed creator, 
        string name
    );
    event CommunityUpdated(
        uint256 indexed communityId, 
        string name, 
        string description
    );
    event CommunityImageUpdated(
        uint256 indexed communityId, 
        string bannerHash, 
        string avatarHash
    );
    event MemberJoined(
        uint256 indexed communityId, 
        address indexed member
    );
    event MemberLeft(
        uint256 indexed communityId, 
        address indexed member
    );
    event ModeratorAdded(
        uint256 indexed communityId, 
        address indexed moderator
    );
    event ModeratorRemoved(
        uint256 indexed communityId, 
        address indexed moderator
    );
    event CommunityStatusChanged(
        uint256 indexed communityId, 
        bool isActive
    );
    event CompetitionAdded(
        uint256 indexed communityId, 
        uint256 indexed competitionId
    );
    event ArtworkAdded(
        uint256 indexed communityId, 
        uint256 indexed artworkId
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyCommunityModerator(uint256 _communityId) {
        require(
            communityMembers[_communityId][msg.sender].isModerator || 
            msg.sender == owner(),
            "Not a moderator"
        );
        _;
    }

    modifier onlyActiveCommunity(uint256 _communityId) {
        require(communities[_communityId].isActive, "Community not active");
        _;
    }

    function createCommunity(
        string memory _name,
        string memory _description,
        string memory _bannerHash,
        string memory _avatarHash
    ) external nonReentrant returns (uint256) {
        uint256 communityId = _nextCommunityId++;
        
        Community storage newCommunity = communities[communityId];
        newCommunity.id = communityId;
        newCommunity.name = _name;
        newCommunity.description = _description;
        newCommunity.bannerHash = _bannerHash;
        newCommunity.avatarHash = _avatarHash;
        newCommunity.creator = msg.sender;
        newCommunity.createdAt = block.timestamp;
        newCommunity.isActive = true;

        // Add creator as first member and moderator
        _addMember(communityId, msg.sender, true);
        
        emit CommunityCreated(communityId, msg.sender, _name);
        return communityId;
    }

    function updateCommunity(
        uint256 _communityId,
        string memory _name,
        string memory _description
    ) external onlyCommunityModerator(_communityId) {
        Community storage community = communities[_communityId];
        community.name = _name;
        community.description = _description;
        
        emit CommunityUpdated(_communityId, _name, _description);
    }

    function updateCommunityImages(
        uint256 _communityId,
        string memory _bannerHash,
        string memory _avatarHash
    ) external onlyCommunityModerator(_communityId) {
        Community storage community = communities[_communityId];
        community.bannerHash = _bannerHash;
        community.avatarHash = _avatarHash;
        
        emit CommunityImageUpdated(_communityId, _bannerHash, _avatarHash);
    }

    function joinCommunity(uint256 _communityId) 
        external 
        nonReentrant 
        onlyActiveCommunity(_communityId) 
    {
        require(
            !communityMembers[_communityId][msg.sender].isMember,
            "Already a member"
        );
        
        _addMember(_communityId, msg.sender, false);
        emit MemberJoined(_communityId, msg.sender);
    }

    function leaveCommunity(uint256 _communityId) external nonReentrant {
        require(
            communityMembers[_communityId][msg.sender].isMember,
            "Not a member"
        );
        require(
            !communityMembers[_communityId][msg.sender].isModerator,
            "Moderators cannot leave"
        );
        
        _removeMember(_communityId, msg.sender);
        emit MemberLeft(_communityId, msg.sender);
    }

    function addModerator(uint256 _communityId, address _moderator) 
        external 
        onlyCommunityModerator(_communityId) 
    {
        require(
            communityMembers[_communityId][_moderator].isMember,
            "Not a member"
        );
        require(
            !communityMembers[_communityId][_moderator].isModerator,
            "Already a moderator"
        );

        communityMembers[_communityId][_moderator].isModerator = true;
        communityModerators[_communityId].push(_moderator);
        
        emit ModeratorAdded(_communityId, _moderator);
    }

    function removeModerator(uint256 _communityId, address _moderator)
        external
        onlyCommunityModerator(_communityId)
    {
        require(
            _moderator != communities[_communityId].creator,
            "Cannot remove creator"
        );
        require(
            communityMembers[_communityId][_moderator].isModerator,
            "Not a moderator"
        );

        communityMembers[_communityId][_moderator].isModerator = false;
        emit ModeratorRemoved(_communityId, _moderator);
    }

    function setCommunityStatus(uint256 _communityId, bool _isActive) 
        external 
        onlyOwner 
    {
        communities[_communityId].isActive = _isActive;
        emit CommunityStatusChanged(_communityId, _isActive);
    }

    function addCompetition(uint256 _communityId, uint256 _competitionId)
        external
        onlyCommunityModerator(_communityId)
    {
        communities[_communityId].competitionIds.push(_competitionId);
        emit CompetitionAdded(_communityId, _competitionId);
    }

    function addArtwork(uint256 _communityId, uint256 _artworkId)
        external
        onlyCommunityModerator(_communityId)
    {
        communities[_communityId].artworkIds.push(_artworkId);
        emit ArtworkAdded(_communityId, _artworkId);
    }

    // Internal functions
    function _addMember(uint256 _communityId, address _member, bool _isModerator) internal {
        communityMembers[_communityId][_member] = CommunityMember({
            isMember: true,
            joinedAt: block.timestamp,
            isModerator: _isModerator
        });
        
        userCommunities[_member].push(_communityId);
        communities[_communityId].memberCount++;

        if (_isModerator) {
            communityModerators[_communityId].push(_member);
        }
    }

    function _removeMember(uint256 _communityId, address _member) internal {
        delete communityMembers[_communityId][_member];
        communities[_communityId].memberCount--;
        
        // Remove from userCommunities array
        uint256[] storage userComms = userCommunities[_member];
        for (uint256 i = 0; i < userComms.length; i++) {
            if (userComms[i] == _communityId) {
                userComms[i] = userComms[userComms.length - 1];
                userComms.pop();
                break;
            }
        }
    }

    // View functions
    function getCommunity(uint256 _communityId) external view returns (
        uint256 id,
        string memory name,
        string memory description,
        string memory bannerHash,
        string memory avatarHash,
        address creator,
        uint256 createdAt,
        bool isActive,
        uint256 memberCount,
        uint256[] memory competitionIds,
        uint256[] memory artworkIds
    ) {
        Community storage community = communities[_communityId];
        return (
            community.id,
            community.name,
            community.description,
            community.bannerHash,
            community.avatarHash,
            community.creator,
            community.createdAt,
            community.isActive,
            community.memberCount,
            community.competitionIds,
            community.artworkIds
        );
    }

    function getMemberStatus(uint256 _communityId, address _member) external view returns (
        bool isMember,
        uint256 joinedAt,
        bool isModerator
    ) {
        CommunityMember memory member = communityMembers[_communityId][_member];
        return (member.isMember, member.joinedAt, member.isModerator);
    }

    function getCommunityModerators(uint256 _communityId) external view returns (address[] memory) {
        return communityModerators[_communityId];
    }

    function getUserCommunities(address _user) external view returns (uint256[] memory) {
        return userCommunities[_user];
    }
}