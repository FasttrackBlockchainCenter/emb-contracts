import hre from "hardhat";
import { embNFTv1testCases } from "./embNFTv1-TestCases";

describe("Testing embNFTv1 Contract", function () {
  beforeEach(async function () {
    this.accounts = await hre.ethers.getSigners();
    this.trustedForwarder = "0xBc0B18e4673D1a9ee819f2293DB1B7697b3a69F4";
    this.NFT = await hre.ethers.getContractFactory("embNFTv1");
    this.nftInstance = await hre.upgrades.deployProxy(this.NFT, [this.trustedForwarder], { kind: "uups" });
    // console.log("Contract NFTProxy deployed to: ", this.nftInstance.address);
  });

  describe("Started Testing", function () {
    embNFTv1testCases();
  });
});
