async function deployErc721Market() {
	const [owner, erc721Buyer, erc721Seller, other] = await ethers.getSigners();
	const Erc721Market = await ethers.getContractFactory("Erc721Market");
	const erc721Market = await Erc721Market.deploy();
	return { erc721Market, owner, erc721Buyer, erc721Seller, other };
}

async function deployErc721() {
	const Erc721 = await ethers.getContractFactory("MyERC721");
	const erc721 = await Erc721.deploy("", "");
	return { erc721 }
}

async function deployErc20() {
	const Erc20 = await ethers.getContractFactory("MyERC20");
	const erc20 = await Erc20.deploy("", "");
	return { erc20 }
}

async function deployStandard() {
  const { erc721Market, owner, erc721Buyer, erc721Seller, other } = await deployErc721Market();
  const { erc721 } = await deployErc721();
  const { erc20 } = await deployErc20();

  let tokenId = await mintErc721(erc721, erc721Seller);

  await erc721.connect(erc721Buyer).setApprovalForAll(erc721Market.target, true);
  await erc721.connect(erc721Seller).setApprovalForAll(erc721Market.target, true);

  await erc20.connect(erc721Buyer).mint(1000);
  await erc20.connect(erc721Buyer).approve(erc721Market.target, 1000);
  await erc20.connect(erc721Seller).approve(erc721Market.target, 1000);

  return { erc721Market, erc20, erc721, owner, erc721Buyer, erc721Seller, other, tokenId }
}

async function deployErc721TransferFromer(
	name,
	erc721Market
) {
	const Erc721 = await ethers.getContractFactory(name);
	const erc721 = await Erc721.deploy(erc721Market.target);
	return { erc721 }
}

async function deployErc20TransferFromer(
	name,
	erc721Market
) {
	const Erc20 = await ethers.getContractFactory(name);
	const erc20 = await Erc20.deploy(erc721Market.target);
	return { erc20 }
}

async function mintErc721(erc721, to) {
	let tx = await erc721.connect(to).mint();
	let r = await tx.wait();
	let tokenId = r.logs[0].args[2];
	return tokenId;
}

module.exports = {deployErc721Market, deployErc721, deployErc20, deployStandard, deployErc20TransferFromer, deployErc721TransferFromer, mintErc721};
