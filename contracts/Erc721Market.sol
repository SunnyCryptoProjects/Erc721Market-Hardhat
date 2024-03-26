// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.20 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./Types.sol";
import "./SigLib.sol";
import "./HashLib.sol";

contract Erc721Market is ReentrancyGuard, Pausable {
    // argHash => nonce
    mapping(bytes32 => uint256) public tokenNonces;
    // argHash => nonce
    mapping(bytes32 => uint256) public offerNonces;

    address public feeCollector;
    address public pauser;

    bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes("Erc721Market")),
        keccak256(bytes("v1.0.0")),
        block.chainid,
        address(this)
    ));

    constructor() {
        feeCollector = msg.sender;
        pauser = msg.sender;
    }

    function setFeeCollector(address _feeCollector) external nonReentrant {
        require(msg.sender == feeCollector);
        feeCollector = _feeCollector;
    }

    function setPauser(address _pauser) external nonReentrant {
        require(msg.sender == pauser);
        pauser = _pauser;
    }

    function pause() external nonReentrant {
        require(msg.sender == pauser);
        _pause();
    }

    function unpause() external nonReentrant {
        require(msg.sender == pauser);
        _unpause();
    }

    function processSale(
        Types.SignedSale memory signedSale
    ) external nonReentrant whenNotPaused {
        checkEndAt({
            endAt: signedSale.sale.endAt
        });

        bytes32 saleHash = HashLib.hashSale({
            sale: signedSale.sale
        });
        require(
            SigLib.isValidSignature({
                domainSeparator: DOMAIN_SEPARATOR,
                structHash: saleHash,
                signer: signedSale.sale.erc721SellerAddress,
                signature: signedSale.erc721SellerSignature
            }),
            "Bad sale signature"
        );
        
        checkAndIncrementTokenNonce({
            erc721SellerAddress: signedSale.sale.erc721SellerAddress,
            erc20Info: signedSale.sale.erc20Info,
            erc721Info: signedSale.sale.erc721Info,
            tokenNonce: signedSale.sale.tokenNonce
        });

        emit Types.SaleAccepted({
            saleHash: saleHash
        });

        swap({
            erc721BuyerAddress: msg.sender,
            erc721SellerAddress: signedSale.sale.erc721SellerAddress,
            erc20Info: signedSale.sale.erc20Info,
            erc721Info: signedSale.sale.erc721Info
        });
    }

    function processOffer(
        Types.SignedOffer memory signedOffer
    ) external nonReentrant whenNotPaused {
        checkEndAt({
            endAt: signedOffer.offer.endAt
        });
        
        bytes32 offerHash = HashLib.hashOffer({
            offer: signedOffer.offer
        });
        require(
            SigLib.isValidSignature({
                domainSeparator: DOMAIN_SEPARATOR,
                structHash: offerHash,
                signer: signedOffer.offer.erc721BuyerAddress,
                signature: signedOffer.erc721BuyerSignature
            }),
            "Bad offer signature"
        );

        require(
            msg.sender == signedOffer.offer.erc721SellerAddress,
            "msg.sender != erc721SellerAddress"
        );
        
        checkAndIncrementTokenNonce({
            erc721SellerAddress: signedOffer.offer.erc721SellerAddress,
            erc20Info: signedOffer.offer.erc20Info,
            erc721Info: signedOffer.offer.erc721Info,
            tokenNonce: signedOffer.offer.tokenNonce
        });
        checkOfferNonce({
            erc721BuyerAddress: signedOffer.offer.erc721BuyerAddress,
            erc20Info: signedOffer.offer.erc20Info,
            erc721Info: signedOffer.offer.erc721Info,
            offerNonce: signedOffer.offer.offerNonce
        });

        emit Types.OfferAccepted({
            offerHash: offerHash
        });

        swap({
            erc721BuyerAddress: signedOffer.offer.erc721BuyerAddress,
            erc721SellerAddress: signedOffer.offer.erc721SellerAddress,
            erc20Info: signedOffer.offer.erc20Info,
            erc721Info: signedOffer.offer.erc721Info
        });
    } 

    function incrementTokenNonce(
        address erc20ContractAddress,
        address erc721ContractAddress,
        uint256 erc721TokenId
    ) external nonReentrant {
        bytes32 argHash = HashLib.hashIncrementNonceArgs({
            accountAddress: msg.sender,
            erc20ContractAddress: erc20ContractAddress,
            erc721ContractAddress: erc721ContractAddress,
            erc721TokenId: erc721TokenId
        });
        tokenNonces[argHash] += 1;
        emit Types.IncrementTokenNonce({argHash: argHash});
    }

    function incrementOfferNonce(
        address erc20ContractAddress,
        address erc721ContractAddress,
        uint256 erc721TokenId
    ) external nonReentrant {
        bytes32 argHash = HashLib.hashIncrementNonceArgs({
            accountAddress: msg.sender,
            erc20ContractAddress: erc20ContractAddress,
            erc721ContractAddress: erc721ContractAddress,
            erc721TokenId: erc721TokenId
        });
        offerNonces[argHash] += 1;
        emit Types.IncrementOfferNonce({argHash: argHash});
    }

    function checkEndAt(
        uint256 endAt
    ) private view {
        if (endAt != 0) {
            require(block.timestamp < endAt, "block.timestamp >= endAt");
        }
    }

    function checkAndIncrementTokenNonce(
        address erc721SellerAddress,
        Types.Erc20Info memory erc20Info,
        Types.Erc721Info memory erc721Info,
        uint256 tokenNonce
    ) private {
        bytes32 argHash = HashLib.hashIncrementNonceArgs({
            accountAddress: erc721SellerAddress,
            erc20ContractAddress: erc20Info.contractAddress,
            erc721ContractAddress: erc721Info.contractAddress,
            erc721TokenId: erc721Info.tokenId
        });
        require(tokenNonces[argHash] == tokenNonce, "Bad token nonce");
        tokenNonces[argHash] += 1;
    }

    function checkOfferNonce(
        address erc721BuyerAddress,
        Types.Erc20Info memory erc20Info,
        Types.Erc721Info memory erc721Info,
        uint256 offerNonce
    ) private view {
        bytes32 argHash = HashLib.hashIncrementNonceArgs({
            accountAddress: erc721BuyerAddress,
            erc20ContractAddress: erc20Info.contractAddress,
            erc721ContractAddress: erc721Info.contractAddress,
            erc721TokenId: erc721Info.tokenId
        });
        require(offerNonces[argHash] == offerNonce, "Bad offer nonce");
    }

    function swap(
        address erc721BuyerAddress,
        address erc721SellerAddress,
        Types.Erc20Info memory erc20Info,
        Types.Erc721Info memory erc721Info
    ) private {
        if (erc20Info.fee != 0) {
            require(IERC20(
                erc20Info.contractAddress
            ).transferFrom(
                erc721BuyerAddress, 
                feeCollector, 
                erc20Info.fee
            ), "Unable to transfer fee");
        }
        
        require(IERC20(
            erc20Info.contractAddress
        ).transferFrom(
            erc721BuyerAddress, 
            erc721SellerAddress, 
            erc20Info.amount
        ), "Unable to transfer amount");

        IERC721(
            erc721Info.contractAddress
        ).transferFrom(
			erc721SellerAddress,
			erc721BuyerAddress,
			erc721Info.tokenId
		);
    }
}
