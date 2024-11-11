// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// NFT contract to be deployed for each artwork
contract MosaicNFT is ERC721 {
    address public mosaicContract;
    uint256 public currentTokenId;
    string public artworkTitle;
    
    constructor(string memory _title, address _mosaicContract) ERC721(
        string.concat("Mosaic - ", _title),
        "MSC"
    ) {
        mosaicContract = _mosaicContract;
        artworkTitle = _title;
    }
    
    function mint(address recipient) public returns (uint256) {
        require(msg.sender == mosaicContract, "Only Mosaic contract can mint");
        uint256 newItemId = ++currentTokenId;
        _safeMint(recipient, newItemId);
        return newItemId;
    }
}