import hre from "hardhat";
import { embSalev1testCases } from "./embSale-TestCases";

describe("Testing embSale Contract", function () {
  beforeEach(async function () {
    this.accounts = await hre.ethers.getSigners();
    this.trustedForwarder = "0xBc0B18e4673D1a9ee819f2293DB1B7697b3a69F4";
    this.NFT = await hre.ethers.getContractFactory("embNFTv1");
    this.nftInstance = await hre.upgrades.deployProxy(this.NFT, [this.trustedForwarder], { kind: "uups" });

    this.TokenFactory = await hre.ethers.getContractFactory('TestToken');
    this.tokenInstance = await this.TokenFactory.deploy();
    this.tokenInstance.deployed();

    this.Sale = await hre.ethers.getContractFactory("embSalev1");
    this.saleInstance = await hre.upgrades.deployProxy(this.Sale, [this.nftInstance.address, this.tokenInstance.address, this.trustedForwarder], { kind: "uups" });
    // console.log("Contract NFTProxy deployed to: ", this.nftInstance.address);
  });

  describe("Started Testing", function () {
    embSalev1testCases();
  });
});
