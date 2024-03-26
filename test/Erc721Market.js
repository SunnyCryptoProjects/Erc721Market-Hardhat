const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { SaleTypes, OfferTypes } = require("./consts.js");
const { sign, hashNonceArgs, doSale, doOffer } = require("./utils.js");
const { deployErc721Market, deployErc721, deployErc20, deployStandard, deployErc20TransferFromer, deployErc721TransferFromer, mintErc721 } = require("./deploy.js");
const mut = require("./mutate.js");

describe("Erc721Market", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  describe("Deployment", function () {
    it("Sets pauser to msg.sender", async function () {
      const { erc721Market, owner } = await loadFixture(deployErc721Market);

      expect(await erc721Market.pauser()).to.equal(owner.address);
    });

    it("Sets feeCollector to msg.sender", async function () {
      const { erc721Market, owner } = await loadFixture(deployErc721Market);

      expect(await erc721Market.feeCollector()).to.equal(owner.address);
    });
  });

  describe("FeeCollector", function () {
    it("setFeeCollector ok", async function () {
      const { erc721Market, owner, other } = await loadFixture(deployErc721Market);

      await erc721Market.connect(owner).setFeeCollector(other);

      expect(await erc721Market.feeCollector()).to.be.equal(other.address);
    });

    it("setFeeCollector not feeCollector", async function () {
      const { erc721Market, other } = await loadFixture(deployErc721Market);

      await expect(erc721Market.connect(other).setFeeCollector(other)).to.be.revertedWithoutReason();
    });
  });

  describe("Pause", function () {
    it("Pause not pauser", async function () {
      const { erc721Market, other } = await loadFixture(deployErc721Market);

      await expect(erc721Market.connect(other).pause()).to.be.revertedWithoutReason();
    });

    it("setPauser ok", async function () {
      const { erc721Market, owner, other } = await loadFixture(deployErc721Market);

      await erc721Market.connect(owner).setPauser(other);

      expect(await erc721Market.pauser()).to.be.equal(other.address);
      await erc721Market.connect(other).pause();
    });

    it("setPauser not pauser", async function () {
      const { erc721Market, other } = await loadFixture(deployErc721Market);

      await expect(erc721Market.connect(other).setPauser(other)).to.be.revertedWithoutReason();
    });

    it("unpause not pauser", async function () {
      const { erc721Market, owner, other } = await loadFixture(deployErc721Market);

      await erc721Market.connect(owner).pause();

      await expect(erc721Market.connect(other).unpause()).to.be.revertedWithoutReason();
    });

    it("Pause pauser", async function () {
      const { erc721Market, owner, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await loadFixture(deployErc20);
    
      await erc721Market.connect(owner).pause();
      await expect(
        doSale({
          erc721Market: erc721Market,
          seller: erc721Seller,
          buyer: erc721Buyer,
          erc20: erc20,
          amount: 0,
          fee: 0,
          erc721: erc721,
          tokenId: 0,
          endAt: 0,
        })
      ).to.be.revertedWithCustomError(erc721Market, "EnforcedPause");
      await expect(
        doOffer({
          erc721Market: erc721Market,
          seller: erc721Seller,
          buyer: erc721Buyer,
          erc20: erc20,
          amount: 0,
          fee: 0,
          erc721: erc721,
          tokenId: 0,
          endAt: 0,
        })
      ).to.be.revertedWithCustomError(erc721Market, "EnforcedPause");
    });

    it("Unpaused", async function () {
      const { erc721Market, erc20, erc721, owner, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);
    
      await erc721Market.connect(owner).pause();
      await erc721Market.connect(owner).unpause();

      await doSale({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 100,
        fee: 0,
        erc721: erc721,
        tokenId: tokenId,
        endAt: 0,
      });

      let erc721Buyer2 = erc721Seller;
      let erc721Seller2 = erc721Buyer;

      await doOffer({
        erc721Market: erc721Market,
        seller: erc721Seller2,
        buyer: erc721Buyer2,
        erc20: erc20,
        amount: 100,
        fee: 0,
        erc721: erc721,
        tokenId: tokenId,
        endAt: 0,
      });
    });
  });

  describe("Valid", function () {
    it("Sale", async function () {
      const { erc721Market, erc20, erc721, owner, erc721Seller, erc721Buyer, tokenId } = await loadFixture(deployStandard);

      expect(await erc20.balanceOf(owner.address)).to.equal(0);
      expect(await erc20.balanceOf(erc721Seller.address)).to.equal(0);
      expect(await erc20.balanceOf(erc721Buyer.address)).to.equal(1000);
      expect(await erc721.ownerOf(tokenId)).to.equal(erc721Seller.address);

      expect(await doSale({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 99,
        fee: 1,
        erc721: erc721,
        tokenId: tokenId,
        endAt: await time.latest() + 10,
      }))
        .to.emit(erc721Market, "SaleAccepted")
        .withArgs(anyValue);

      expect(await erc20.balanceOf(owner.address)).to.equal(1);
      expect(await erc20.balanceOf(erc721Seller.address)).to.equal(99);
      expect(await erc20.balanceOf(erc721Buyer.address)).to.equal(900);
      expect(await erc721.ownerOf(tokenId)).to.equal(erc721Buyer.address);
    });

    it("Offer", async function () {
      const { erc721Market, erc20, erc721, owner, erc721Seller, erc721Buyer, tokenId } = await loadFixture(deployStandard);

      expect(await erc20.balanceOf(owner.address)).to.equal(0);
      expect(await erc20.balanceOf(erc721Seller.address)).to.equal(0);
      expect(await erc20.balanceOf(erc721Buyer.address)).to.equal(1000);
      expect(await erc721.ownerOf(tokenId)).to.equal(erc721Seller.address);

      expect(await doOffer({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 99,
        fee: 1,
        erc721: erc721,
        tokenId: tokenId,
        endAt: await time.latest() + 10,
      }))
        .to.emit(erc721Market, "OfferAccepted")
        .withArgs(anyValue);

      expect(await erc20.balanceOf(owner.address)).to.equal(1);
      expect(await erc20.balanceOf(erc721Seller.address)).to.equal(99);
      expect(await erc20.balanceOf(erc721Buyer.address)).to.equal(900);
      expect(await erc721.ownerOf(tokenId)).to.equal(erc721Buyer.address);
    });

    it("IncrementTokenNonce", async function () {
      const { erc721Market, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await loadFixture(deployErc20);

      let tokenId = 99;
      let hash = hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId);

      let beforeTokenNonce = await erc721Market.tokenNonces(hash);

      await expect(erc721Market.connect(erc721Seller).incrementTokenNonce(
        erc20.target,
        erc721.target,
        tokenId
      )).to.emit(erc721Market, "IncrementTokenNonce")
        .withArgs(hash);

      let afterTokenNonce = await erc721Market.tokenNonces(hash);

      expect(afterTokenNonce).to.be.equal(beforeTokenNonce + ethers.getBigInt(1));
    });

    it("IncrementOfferNonce", async function () {
      const { erc721Market, erc721Buyer } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await loadFixture(deployErc20);

      let tokenId = 99;
      let hash = hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId);

      let beforeOfferNonce = await erc721Market.offerNonces(hash);

      await expect(erc721Market.connect(erc721Buyer).incrementOfferNonce(
        erc20.target,
        erc721.target,
        tokenId
      )).to.emit(erc721Market, "IncrementOfferNonce")
        .withArgs(hash);

      let afterOfferNonce = await erc721Market.offerNonces(hash);

      expect(afterOfferNonce).to.be.equal(beforeOfferNonce + ethers.getBigInt(1));
    });
  });

  describe("Invalid", function () {
    it("Sale bad token nonce", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let sale = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce + ethers.getBigInt(1),
        "endAt": 0,
      };
      let erc721SellerSignature = await sign(erc721Market, erc721Seller, SaleTypes, sale);
      let signedSale = {
        "sale": sale,
        "erc721SellerSignature": erc721SellerSignature,
      };
      await expect(erc721Market.connect(erc721Buyer).processSale(signedSale)).to.be.revertedWith("Bad token nonce");
    });

    it("Offer msg.sender not seller", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, other, tokenId } = await loadFixture(deployStandard);

      let offerNonce = await erc721Market.offerNonces(
        hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId)
      );
      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let offer = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "erc721BuyerAddress": erc721Buyer.address,
        "offerNonce": offerNonce,
        "endAt": 0,
      };
      let erc721BuyerSignature = await sign(erc721Market, erc721Buyer, OfferTypes, offer);
      let signedOffer = {
        "offer": offer,
        "erc721BuyerSignature": erc721BuyerSignature,
      };
      await expect(erc721Market.connect(other).processOffer(signedOffer)).to.be.revertedWith("msg.sender != erc721SellerAddress");
    });

    it("Offer Bad token nonce", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

      let offerNonce = await erc721Market.offerNonces(
        hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId)
      );
      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let offer = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce + ethers.getBigInt(1),
        "erc721BuyerAddress": erc721Buyer.address,
        "offerNonce": offerNonce,
        "endAt": 0,
      };
      let erc721BuyerSignature = await sign(erc721Market, erc721Buyer, OfferTypes, offer);
      let signedOffer = {
        "offer": offer,
        "erc721BuyerSignature": erc721BuyerSignature,
      };
      await expect(erc721Market.connect(erc721Seller).processOffer(signedOffer)).to.be.revertedWith("Bad token nonce");
    });

    it("Offer Bad offer nonce", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

      let offerNonce = await erc721Market.offerNonces(
        hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId)
      );
      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let offer = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "erc721BuyerAddress": erc721Buyer.address,
        "offerNonce": offerNonce + ethers.getBigInt(1),
        "endAt": 0,
      };
      let erc721BuyerSignature = await sign(erc721Market, erc721Buyer, OfferTypes, offer);
      let signedOffer = {
        "offer": offer,
        "erc721BuyerSignature": erc721BuyerSignature,
      };
      await expect(erc721Market.connect(erc721Seller).processOffer(signedOffer)).to.be.revertedWith("Bad offer nonce");
    });

    it("Sale end at too late", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

      let endAt = await time.latest() + 10;
      await time.increaseTo(endAt + 5);

      await expect(doSale({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 99,
        fee: 1,
        erc721: erc721,
        tokenId: tokenId,
        endAt: endAt,
      })).to.be.revertedWith("block.timestamp >= endAt");
    });

    it("Offer end at too late", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

      let endAt = await time.latest() + 10;
      await time.increaseTo(endAt + 5);

      await expect(doOffer({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 99,
        fee: 1,
        erc721: erc721,
        tokenId: tokenId,
        endAt: endAt
      })).to.be.revertedWith("block.timestamp >= endAt");
    });

    it("swap balance too low for first", async function () {
      const { erc721Market, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await loadFixture(deployErc20);
    
      let tokenId = await mintErc721(erc721, erc721Seller);
      await erc721.connect(erc721Seller).setApprovalForAll(erc721Market.target, true);

      await erc20.connect(erc721Buyer).mint(98);
      await erc20.connect(erc721Buyer).approve(erc721Market.target, 1000);

      await expect(doSale({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 99,
        fee: 1,
        erc721: erc721,
        tokenId: tokenId,
        endAt: 0,
      })).to.be.revertedWithCustomError(erc20, "ERC20InsufficientBalance");
    });

    it("swap balance too low for second", async function () {
      const { erc721Market, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await loadFixture(deployErc20);
    
      let tokenId = await mintErc721(erc721, erc721Seller);
      await erc721.connect(erc721Seller).setApprovalForAll(erc721Market.target, true);

      await erc20.connect(erc721Buyer).mint(99);
      await erc20.connect(erc721Buyer).approve(erc721Market.target, 1000);

      await expect(doSale({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 99,
        fee: 1,
        erc721: erc721,
        tokenId: tokenId,
        endAt: 0,
      })).to.be.revertedWithCustomError(erc20, "ERC20InsufficientBalance");
    });

    it("swap erc721 not approved", async function () {
      const { erc721Market, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await loadFixture(deployErc20);
    
      let tokenId = await mintErc721(erc721, erc721Seller);

      await erc20.connect(erc721Buyer).mint(1000);
      await erc20.connect(erc721Buyer).approve(erc721Market.target, 1000);

      await expect(doSale({
        erc721Market: erc721Market,
        seller: erc721Seller,
        buyer: erc721Buyer,
        erc20: erc20,
        amount: 99,
        fee: 1,
        erc721: erc721,
        tokenId: tokenId,
        endAt: 0,
      }))
		.to.be.revertedWithCustomError(erc721, "ERC721InsufficientApproval");
    });

    it("Sale endAt expired", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let sale = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "endAt": await time.latest() + 60,
      };
      let erc721SellerSignature = await sign(erc721Market, erc721Seller, SaleTypes, sale);
      let signedSale = {
        "sale": sale,
        "erc721SellerSignature": erc721SellerSignature,
      };

      await time.increase(60 * 60);

      await expect(erc721Market.connect(erc721Buyer).processSale(signedSale))
        .to.be.revertedWith("block.timestamp >= endAt");
    });

    it("Offer endAt expired", async function () {
      const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

      let offerNonce = await erc721Market.offerNonces(
        hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId)
      );
      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let offer = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "erc721BuyerAddress": erc721Buyer.address,
        "offerNonce": offerNonce,
        "endAt": await time.latest() + 60,
      };
      let erc721BuyerSignature = await sign(erc721Market, erc721Buyer, OfferTypes, offer);
      let signedOffer = {
        "offer": offer,
        "erc721BuyerSignature": erc721BuyerSignature,
      };

      await time.increase(60 * 60);

      await expect(erc721Market.connect(erc721Seller).processOffer(signedOffer))
        .to.be.revertedWith("block.timestamp >= endAt");
    });
  });

  async function mutateSaleTest(f) {
    const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

    let tokenNonce = await erc721Market.tokenNonces(
      hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
    );
    let sale = {
      "erc721Info": {
        "contractAddress": erc721.target,
        "tokenId": tokenId,
      },
      "erc20Info": {
        "contractAddress": erc20.target,
        "amount": 99,
        "fee": 1,
      },
      "erc721SellerAddress": erc721Seller.address,
      "tokenNonce": tokenNonce + ethers.getBigInt(1),
      "endAt": 0,
    };
    let erc721SellerSignature = await sign(erc721Market, erc721Seller, SaleTypes, sale);
    await f(sale);
    let signedSale = {
      "sale": sale,
      "erc721SellerSignature": erc721SellerSignature,
    };
    await expect(erc721Market.connect(erc721Buyer).processSale(signedSale))
    .to.be.revertedWith("Bad sale signature");
  }

  async function mutateOfferTest(f) {
    const { erc721Market, erc20, erc721, erc721Buyer, erc721Seller, tokenId } = await loadFixture(deployStandard);

    let offerNonce = await erc721Market.offerNonces(
      hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId)
    );
    let tokenNonce = await erc721Market.tokenNonces(
      hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
    );
    let offer = {
      "erc721Info": {
        "contractAddress": erc721.target,
        "tokenId": tokenId,
      },
      "erc20Info": {
        "contractAddress": erc20.target,
        "amount": 99,
        "fee": 1,
      },
      "erc721SellerAddress": erc721Seller.address,
      "tokenNonce": tokenNonce,
      "erc721BuyerAddress": erc721Buyer.address,
      "offerNonce": offerNonce,
      "endAt": 0,
    };
    let erc721BuyerSignature = await sign(erc721Market, erc721Buyer, OfferTypes, offer);
    await f(offer);
    let signedOffer = {
      "offer": offer,
      "erc721BuyerSignature": erc721BuyerSignature,
    };
    await expect(erc721Market.connect(erc721Seller).processOffer(signedOffer))
    .to.be.revertedWith("Bad offer signature");
  }

  const N_MUTATE_ITERS = 1000;

  async function manyMutateSaleTest(f) {
    for (let i = 0; i < N_MUTATE_ITERS; i++) {
      await mutateSaleTest(f);
    }
  }

  async function manyMutateOfferTest(f) {
    for (let i = 0; i < N_MUTATE_ITERS; i++) {
      await mutateOfferTest(f);
    }
  }

  describe("Mutation after signing", function() {
    it("Sale mutate erc721Info.contractAddress", async function () {
      await manyMutateSaleTest(mut.mutateErc721InfoContractAddress);
    });
    it("Sale mutate erc721Info.tokenId", async function () {
      await manyMutateSaleTest(mut.mutateErc721InfoTokenId);
    });
    it("Sale mutate erc20Info.contractAddress", async function () {
      await manyMutateSaleTest(mut.mutateErc20InfoContractAddress);
    });
    it("Sale mutate erc20Info.amount", async function () {
      await manyMutateSaleTest(mut.mutateErc20InfoAmount);
    });
    it("Sale mutate erc20Info.fee", async function () {
      await manyMutateSaleTest(mut.mutateErc20InfoFee);
    });
    it("Sale mutate erc721SellerAddress", async function () {
      await manyMutateSaleTest(mut.mutateErc721SellerAddress);
    });
    it("Sale mutate tokenNonce", async function () {
      await manyMutateSaleTest(mut.mutateTokenNonce);
    });
    it("Sale mutate endAt", async function () {
      await manyMutateSaleTest(mut.mutateEndAt);
    });

    it("Offer mutate erc721Info.contractAddress", async function () {
      await manyMutateOfferTest(mut.mutateErc721InfoContractAddress);
    });
    it("Offer mutate erc721Info.tokenId", async function () {
      await manyMutateOfferTest(mut.mutateErc721InfoTokenId);
    });
    it("Offer mutate erc20Info.contractAddress", async function () {
      await manyMutateOfferTest(mut.mutateErc20InfoContractAddress);
    });
    it("Offer mutate erc20Info.amount", async function () {
      await manyMutateOfferTest(mut.mutateErc20InfoAmount);
    });
    it("Offer mutate erc20Info.fee", async function () {
      await manyMutateOfferTest(mut.mutateErc20InfoFee);
    });
    it("Offer mutate erc721SellerAddress", async function () {
      await manyMutateOfferTest(mut.mutateErc721SellerAddress);
    });
    it("Offer mutate tokenNonce", async function () {
      await manyMutateOfferTest(mut.mutateTokenNonce);
    });
    it("Offer mutate erc721BuyerAddress", async function () {
      await manyMutateOfferTest(mut.mutateErc721BuyerAddress);
    });
    it("Offer mutate offerNonce", async function () {
      await manyMutateOfferTest(mut.mutateOfferNonce);
    });
    it("Offer mutate endAt", async function () {
      await manyMutateOfferTest(mut.mutateEndAt);
    });
  });

  describe("ReentrancyGuard", function() {
    async function testSaleErc20(contractName) {
      const { erc721Market, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await deployErc20TransferFromer(contractName, erc721Market);
    
      let tokenId = await mintErc721(erc721, erc721Seller);

      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let sale = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "endAt": 0,
      };
      let erc721SellerSignature = await sign(erc721Market, erc721Seller, SaleTypes, sale);
      let signedSale = {
        "sale": sale,
        "erc721SellerSignature": erc721SellerSignature,
      };
      await expect(erc721Market.connect(erc721Buyer).processSale(signedSale))
        .to.be.revertedWithCustomError(erc721Market, "ReentrancyGuardReentrantCall");
    }

    async function testSaleErc721(contractName) {
      const { erc721Market, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await deployErc721TransferFromer(contractName, erc721Market);
      const { erc20 } = await loadFixture(deployErc20);
    
      await erc20.connect(erc721Buyer).mint(1000);
      await erc20.connect(erc721Buyer).approve(erc721Market.target, 1000);

      let tokenId = 1;

      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let sale = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "endAt": 0,
      };
      let erc721SellerSignature = await sign(erc721Market, erc721Seller, SaleTypes, sale);
      let signedSale = {
        "sale": sale,
        "erc721SellerSignature": erc721SellerSignature,
      };
      await expect(erc721Market.connect(erc721Buyer).processSale(signedSale))
        .to.be.revertedWithCustomError(erc721Market, "ReentrancyGuardReentrantCall");
    }

    async function testOfferErc20(contractName) {
      const { erc721Market, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await loadFixture(deployErc721);
      const { erc20 } = await deployErc20TransferFromer(contractName, erc721Market);
    
      let tokenId = await mintErc721(erc721, erc721Seller);

      let offerNonce = await erc721Market.offerNonces(
        hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId)
      );
      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let offer = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "erc721BuyerAddress": erc721Buyer.address,
        "offerNonce": offerNonce,
        "endAt": 0,
      };
      let erc721BuyerSignature = await sign(erc721Market, erc721Buyer, OfferTypes, offer);
      let signedOffer = {
        "offer": offer,
        "erc721BuyerSignature": erc721BuyerSignature,
      };
      await expect(erc721Market.connect(erc721Seller).processOffer(signedOffer))
        .to.be.revertedWithCustomError(erc721Market, "ReentrancyGuardReentrantCall");
    }

    async function testOfferErc721(contractName) {
      const { erc721Market, erc721Buyer, erc721Seller } = await loadFixture(deployErc721Market);
      const { erc721 } = await deployErc721TransferFromer(contractName, erc721Market);
      const { erc20 } = await loadFixture(deployErc20);
    
      await erc20.connect(erc721Buyer).mint(1000);
      await erc20.connect(erc721Buyer).approve(erc721Market.target, 1000);

      let tokenId = 1;

      let offerNonce = await erc721Market.offerNonces(
        hashNonceArgs(erc721Buyer.address, erc20.target, erc721.target, tokenId)
      );
      let tokenNonce = await erc721Market.tokenNonces(
        hashNonceArgs(erc721Seller.address, erc20.target, erc721.target, tokenId)
      );
      let offer = {
        "erc721Info": {
          "contractAddress": erc721.target,
          "tokenId": tokenId,
        },
        "erc20Info": {
          "contractAddress": erc20.target,
          "amount": 99,
          "fee": 1,
        },
        "erc721SellerAddress": erc721Seller.address,
        "tokenNonce": tokenNonce,
        "erc721BuyerAddress": erc721Buyer.address,
        "offerNonce": offerNonce,
        "endAt": 0,
      };
      let erc721BuyerSignature = await sign(erc721Market, erc721Buyer, OfferTypes, offer);
      let signedOffer = {
        "offer": offer,
        "erc721BuyerSignature": erc721BuyerSignature,
      };
      await expect(erc721Market.connect(erc721Seller).processOffer(signedOffer))
        .to.be.revertedWithCustomError(erc721Market, "ReentrancyGuardReentrantCall");
    }

    async function testBothErc20(contractName) { 
      await testSaleErc20(contractName);
      await testOfferErc20(contractName);
    }

    async function testBothErc721(contractName) { 
      await testSaleErc721(contractName);
      await testOfferErc721(contractName);
    }

    it("erc20.transferFrom pause", async function() {
      await testBothErc20("Erc20TransferFromCallPause");
    });
    it("erc20.transferFrom setFeeCollector", async function() {
      await testBothErc20("Erc20TransferFromCallSetFeeCollector");
    });
    it("erc20.transferFrom setPauser", async function() {
      await testBothErc20("Erc20TransferFromCallSetPauser");
    });
    it("erc20.transferFrom unpause", async function() {
      await testBothErc20("Erc20TransferFromCallUnpause");
    });
    it("erc20.transferFrom processSale", async function() {
      await testBothErc20("Erc20TransferFromCallProcessSale");
    });
    it("erc20.transferFrom processOffer", async function() {
      await testBothErc20("Erc20TransferFromCallProcessOffer");
    });
    it("erc20.transferFrom incrementTokenNonce", async function() {
      await testBothErc20("Erc20TransferFromCallIncrementTokenNonce");
    });
    it("erc20.transferFrom incrementOfferNonce", async function() {
      await testBothErc20("Erc20TransferFromCallIncrementOfferNonce");
    });

    it("erc721.transferFrom pause", async function() {
      await testBothErc721("Erc721TransferFromCallPause");
    });
    it("erc721.transferFrom setFeeCollector", async function() {
      await testBothErc721("Erc721TransferFromCallSetFeeCollector");
    });
    it("erc721.transferFrom setPauser", async function() {
      await testBothErc721("Erc721TransferFromCallSetPauser");
    });
    it("erc721.transferFrom unpause", async function() {
      await testBothErc721("Erc721TransferFromCallUnpause");
    });
    it("erc721.transferFrom processSale", async function() {
      await testBothErc721("Erc721TransferFromCallProcessSale");
    });
    it("erc721.transferFrom processOffer", async function() {
      await testBothErc721("Erc721TransferFromCallProcessOffer");
    });
    it("erc721.transferFrom incrementTokenNonce", async function() {
      await testBothErc721("Erc721TransferFromCallIncrementTokenNonce");
    });
    it("erc721.transferFrom incrementOfferNonce", async function() {
      await testBothErc721("Erc721TransferFromCallIncrementOfferNonce");
    });
  });
});
