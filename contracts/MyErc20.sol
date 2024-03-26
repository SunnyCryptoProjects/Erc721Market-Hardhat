// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {
    string private _name = "";
    string private _symbol = "";

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
