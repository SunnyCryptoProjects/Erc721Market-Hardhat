const {
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const { randomInt, randomBigInt, randomAddress } =  require("./random.js");

async function mutateErc721InfoContractAddress(o) {
	o.erc721Info.contractAddress = randomAddress();
}

async function mutateErc721InfoTokenId(o) {
  o.erc721Info.tokenId += ethers.getBigInt(Number.MAX_SAFE_INTEGER);
}

async function mutateErc20InfoContractAddress(o) {
	o.erc20Info.contractAddress = randomAddress();
}

async function mutateErc20InfoAmount(o) {
  o.erc20Info.amount = randomInt(Number.MAX_SAFE_INTEGER);
}

async function mutateErc20InfoFee(o) {
  o.erc20Info.fee = randomInt(Number.MAX_SAFE_INTEGER);
}

async function mutateErc721SellerAddress(o) {
  o.erc721SellerAddress = randomAddress();
}

async function mutateErc721BuyerAddress(o) {
  o.erc721BuyerAddress = randomAddress();
}

async function mutateTokenNonce(o) {
  o.tokenNonce = o.tokenNonce + ethers.getBigInt(1) + randomBigInt(Number.MAX_SAFE_INTEGER);
}

async function mutateOfferNonce(o) {
  o.offerNonce = o.offerNonce + ethers.getBigInt(1) + randomBigInt(Number.MAX_SAFE_INTEGER);
}

async function mutateEndAt(o) {
  o.endAt = await time.latest() + randomInt(Number.MAX_SAFE_INTEGER);
}

module.exports = {
  mutateErc721InfoContractAddress,
  mutateErc721InfoTokenId,
  mutateErc20InfoContractAddress,
  mutateErc20InfoAmount,
  mutateErc20InfoFee,
  mutateErc721SellerAddress,
  mutateErc721BuyerAddress,
  mutateTokenNonce,
  mutateOfferNonce,
  mutateEndAt
}
