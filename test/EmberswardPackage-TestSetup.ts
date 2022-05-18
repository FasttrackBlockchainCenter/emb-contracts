import hre from "hardhat";
import { embSalev1testCases } from "./embPackage-TestCases";

describe("Testing embSale Contract", function () {
  beforeEach(async function () {
    this.accounts = await hre.ethers.getSigners();
    this.trustedForwarder = "0x2fdeeca4925abcde4912e2f87604577432b6bac4";

    this.Package = await hre.ethers.getContractFactory("embPackagev1");
    this.packageInstance = await hre.upgrades.deployProxy(this.Package, [this.trustedForwarder], { kind: "uups" });
    // console.log("Contract NFTProxy deployed to: ", this.nftInstance.address);
  });

  describe("Started Testing", function () {
    embSalev1testCases();
  });
});
