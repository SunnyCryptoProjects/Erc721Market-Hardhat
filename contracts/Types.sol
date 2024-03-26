// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.20 <0.9.0;

library Types {
    struct Erc721Info {
        address contractAddress;
        uint256 tokenId;
    }

    struct Erc20Info {
        address contractAddress;
        uint256 amount;
        uint256 fee;
    }

    struct Sale {
        Erc721Info erc721Info;
        Erc20Info erc20Info;
        address erc721SellerAddress;
        uint256 tokenNonce;
        uint256 endAt;
    }

    struct SignedSale {
        Sale sale;
        bytes erc721SellerSignature;
    }

    struct Offer {
        Erc721Info erc721Info;
        Erc20Info erc20Info;
        address erc721SellerAddress;
        uint256 tokenNonce;
        address erc721BuyerAddress;
        uint256 offerNonce;
        uint256 endAt;
    }

    struct SignedOffer {
        Offer offer;
        bytes erc721BuyerSignature;
    }

    event SaleAccepted(
        bytes32 saleHash
    );

    event OfferAccepted(
        bytes32 offerHash
    );

    event IncrementTokenNonce(
        bytes32 argHash
    );

    event IncrementOfferNonce(
        bytes32 argHash
    );
}
