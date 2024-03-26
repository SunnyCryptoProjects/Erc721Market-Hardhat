require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");

let sk = process.env.ACCOUNT_SECRET_KEY;
if (sk == undefined) {
	sk = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 4294967295,
      }
    }
  },
  etherscan: {
    apiKey: "0000000000000000000000000000000000",
  },
  sourcify: {
    enabled: true,
  },
  networks: {
    mainnet: {
      url: "", // or any other JSON-RPC provider
      accounts: [sk],
    }
  }
};
