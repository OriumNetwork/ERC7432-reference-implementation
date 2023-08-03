// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.9;

import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import { Base64 } from '@openzeppelin/contracts/utils/Base64.sol';

contract Nft is ERC721 {
  string rolesMetadata;

  constructor() ERC721('Nft', 'NFT') {}

  function mint(address to, uint256 tokenId) external {
    _mint(to, tokenId);
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    bytes memory dataURI = abi.encodePacked(
      '{',
      '"name": "Nft name",',
      '"description": "Nft description",',
      '"image": "Nft image",',
      '"roles": [',
      rolesMetadata,
      ']',
      '}'
    );
    return string(abi.encodePacked('data:application/json;base64,', Base64.encode(dataURI)));
  }

  function setRolesMetadata(string memory _rolesMetadata) external {
    rolesMetadata = _rolesMetadata;
  }
}
