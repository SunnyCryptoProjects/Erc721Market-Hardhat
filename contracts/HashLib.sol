// SPDX-License-Identifier: GPL-3.0

import "./Types.sol";

pragma solidity >=0.8.20 <0.9.0;

library HashLib {
    bytes32 constant ERC721INFO_TYPEHASH = keccak256(
        "Erc721Info(address contractAddress,uint256 tokenId)"
    );
    bytes32 constant ERC20INFO_TYPEHASH = keccak256(
        "Erc20Info(address contractAddress,uint256 amount,uint256 fee)"
    );
    bytes32 constant SALE_TYPEHASH = keccak256(
        "Sale(Erc721Info erc721Info,Erc20Info erc20Info,address erc721SellerAddress,uint256 tokenNonce,uint256 endAt)Erc20Info(address contractAddress,uint256 amount,uint256 fee)Erc721Info(address contractAddress,uint256 tokenId)"
    );
    bytes32 constant OFFER_TYPEHASH = keccak256(
        "Offer(Erc721Info erc721Info,Erc20Info erc20Info,address erc721SellerAddress,uint256 tokenNonce,address erc721BuyerAddress,uint256 offerNonce,uint256 endAt)Erc20Info(address contractAddress,uint256 amount,uint256 fee)Erc721Info(address contractAddress,uint256 tokenId)"
    );

    function hashErc721Info(Types.Erc721Info memory erc721Info) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            ERC721INFO_TYPEHASH,
            erc721Info.contractAddress,
            erc721Info.tokenId
        ));
    }

    function hashErc20Info(Types.Erc20Info memory erc20Info) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            ERC20INFO_TYPEHASH,
            erc20Info.contractAddress,
            erc20Info.amount,
            erc20Info.fee
        ));
    }

    function hashSale(
        Types.Sale memory sale
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            SALE_TYPEHASH,
            hashErc721Info({
                erc721Info: sale.erc721Info
            }),
            hashErc20Info({
                erc20Info: sale.erc20Info
            }),
            sale.erc721SellerAddress,
            sale.tokenNonce,
            sale.endAt
        ));
    }

    function hashOffer(
        Types.Offer memory offer
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            OFFER_TYPEHASH,
            hashErc721Info({
                erc721Info: offer.erc721Info
            }),
            hashErc20Info({
                erc20Info: offer.erc20Info
            }),
            offer.erc721SellerAddress,
            offer.tokenNonce,
            offer.erc721BuyerAddress,
            offer.offerNonce,
            offer.endAt
        ));
    }

    function hashIncrementNonceArgs(
        address accountAddress,
        address erc20ContractAddress,
        address erc721ContractAddress,
        uint256 erc721TokenId 
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            accountAddress,
            erc20ContractAddress,
            erc721ContractAddress,
            erc721TokenId
        ));
    }
}
