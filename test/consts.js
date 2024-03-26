let NAME = "Erc721Market";
let VERSION = "v1.0.0";

let Erc721Info = [
    { name: "contractAddress", type: "address" },
    { name: "tokenId", type: "uint256" },
];

let Erc20Info = [
    { name: "contractAddress", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "fee", type: "uint256" },
];

let Sale = [
    { name: "erc721Info", type: "Erc721Info" },
    { name: "erc20Info", type: "Erc20Info" },
    { name: "erc721SellerAddress", type: "address" },
    { name: "tokenNonce", type: "uint256" },
    { name: "endAt", type: "uint256" },
];

let SaleTypes = {
	Erc721Info: Erc721Info,
	Erc20Info: Erc20Info,
	Sale: Sale,
};

let Offer = [
    { name: "erc721Info", type: "Erc721Info" },
    { name: "erc20Info", type: "Erc20Info" },
    { name: "erc721SellerAddress", type: "address" },
    { name: "tokenNonce", type: "uint256" },
    { name: "erc721BuyerAddress", type: "address" },
    { name: "offerNonce", type: "uint256" },
    { name: "endAt", type: "uint256" },
];

let OfferTypes = {
	Erc721Info: Erc721Info,
	Erc20Info: Erc20Info,
	Offer: Offer,
};

module.exports = { NAME, VERSION, SaleTypes, OfferTypes };
