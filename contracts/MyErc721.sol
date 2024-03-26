// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MyERC721 is ERC721 {
    uint256 public i = 0;
    string private _baseTokenURI = "";
    string private _name = "";
    string private _symbol = "";

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function mint() public returns (uint256) {
        uint256 newTokenId = i++;
        _mint(msg.sender, newTokenId);
        return newTokenId;
    }
}
