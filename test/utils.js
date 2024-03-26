const { NAME, VERSION, SaleTypes, OfferTypes } = require("./consts.js");

async function sign(
	erc721Market,
	signer,
  types,
	value,
) {
  let network = await ethers.provider.getNetwork();
  let domain = {
    name: NAME,
    version: VERSION,
    chainId: network.chainId,
    verifyingContract: erc721Market.target,
  };
  return await signer.signTypedData(domain, types, value);
}

function hashNonceArgs(
	accountAddress,
	erc20Address,
	erc721Address,
	erc721TokenId
) {
  return ethers.keccak256(
	ethers.AbiCoder.defaultAbiCoder().encode([
	  "address",
	  "address",
	  "address",
	  "uint256"
	], [
	  accountAddress,
	  erc20Address,
	  erc721Address,
	  erc721TokenId
	])
  )
}

async function doSale({
  erc721Market,
  seller,
  buyer,
  erc20,
  amount,
  fee,
  erc721,
  tokenId,
  endAt
}) {
  let tokenNonce = await erc721Market.tokenNonces(
    hashNonceArgs(seller.address, erc20.target, erc721.target, tokenId)
  );
  let sale = {
    "erc721Info": {
      "contractAddress": erc721.target,
      "tokenId": tokenId,
    },
    "erc20Info": {
      "contractAddress": erc20.target,
      "amount": amount,
      "fee": fee,
    },
    "erc721SellerAddress": seller.address,
    "tokenNonce": tokenNonce,
    "endAt": endAt,
  };
  let erc721SellerSignature = await sign(erc721Market, seller, SaleTypes, sale);
  let signedSale = {
    "sale": sale,
    "erc721SellerSignature": erc721SellerSignature,
  };
  return await erc721Market.connect(buyer).processSale(signedSale)
}

async function doOffer({
  erc721Market,
  seller,
  buyer,
  erc20,
  amount,
  fee,
  erc721,
  tokenId,
  endAt
}) {
  let offerNonce = await erc721Market.offerNonces(
    hashNonceArgs(buyer.address, erc20.target, erc721.target, tokenId)
  );
  let tokenNonce = await erc721Market.tokenNonces(
    hashNonceArgs(seller.address, erc20.target, erc721.target, tokenId)
  );
  let offer = {
    "erc721Info": {
      "contractAddress": erc721.target,
      "tokenId": tokenId,
    },
    "erc20Info": {
      "contractAddress": erc20.target,
      "amount": amount,
      "fee": fee,
    },
    "erc721SellerAddress": seller.address,
    "tokenNonce": tokenNonce,
    "erc721BuyerAddress": buyer.address,
    "offerNonce": offerNonce,
    "endAt": endAt,
  };
  let erc721BuyerSignature = await sign(erc721Market, buyer, OfferTypes, offer);
  let signedOffer = {
    "offer": offer,
    "erc721BuyerSignature": erc721BuyerSignature,
  };
  return await erc721Market.connect(seller).processOffer(signedOffer)
}

module.exports = { sign, hashNonceArgs, doSale, doOffer };
