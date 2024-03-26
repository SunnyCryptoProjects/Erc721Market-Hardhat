// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.20 <0.9.0;

import "./Erc721Market.sol";
import "./Types.sol";

contract Erc20TransferFromCallSetFeeCollector {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.setFeeCollector(msg.sender);
		return true;
	}
}

contract Erc20TransferFromCallSetPauser {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.setPauser(msg.sender);
		return true;
	}
}

contract Erc20TransferFromCallPause {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.pause();
		return true;
	}
}

contract Erc20TransferFromCallUnpause {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.unpause();
		return true;
	}
}

contract Erc20TransferFromCallProcessSale {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.processSale(
			Types.SignedSale({
        sale: Types.Sale({
          erc721Info: Types.Erc721Info({
            contractAddress: address(0),
            tokenId: 0
          }),
          erc20Info: Types.Erc20Info({
            contractAddress: address(0),
            amount: 0,
            fee: 0
          }),
          erc721SellerAddress: address(0),
          tokenNonce: 0,
          endAt: 0
        }),
        erc721SellerSignature: bytes("")
			})
		);
		return true;
	}
}

contract Erc20TransferFromCallProcessOffer {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.processOffer(
			Types.SignedOffer({
        offer: Types.Offer({
          erc721Info: Types.Erc721Info({
            contractAddress: address(0),
            tokenId: 0
          }),
          erc20Info: Types.Erc20Info({
            contractAddress: address(0),
            amount: 0,
            fee: 0
          }),
          erc721SellerAddress: address(0),
          tokenNonce: 0,
          erc721BuyerAddress: address(0),
          offerNonce: 0,
          endAt: 0
        }),
        erc721BuyerSignature: bytes("")
			})
		);
		return true;
	}
}

contract Erc20TransferFromCallIncrementTokenNonce {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.incrementTokenNonce(address(0), address(0), 0);
		return true;
	}
}

contract Erc20TransferFromCallIncrementOfferNonce {
	Erc721Market erc721market;

	constructor(
		Erc721Market _erc721market
	) {
		erc721market = _erc721market;
	}

	function transferFrom(address, address, uint256) public returns (bool) {
		erc721market.incrementOfferNonce(address(0), address(0), 0);
		return true;
	}
}
