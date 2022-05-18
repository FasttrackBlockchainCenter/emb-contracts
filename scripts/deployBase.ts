const hre = require("hardhat");
let fs = require("fs");
let deployedContractsv1 = require("../deployment/v1.json");
let deploymentConfig = require("../config/config.json");

async function deployBase() {
  console.log("------------------------------ Initial Setup Started ------------------------------");

  const network = await hre.getChainId();
  deployedContractsv1[network] = {};
  const wEthAddress = deploymentConfig[network].wETHAddress;
  const trustedForwarder = deploymentConfig[network].trustedForwarder;

  console.log("------------------------------ Initial Setup Ended ------------------------------");

  console.log("--------------- Contract Deployment Started ---------------");

  const NFT = await hre.ethers.getContractFactory("embNFTv1");
  const nftProxy = await hre.upgrades.deployProxy(NFT, [trustedForwarder], { kind: "uups" });
  console.log("Contract NFTProxy deployed to: ", nftProxy.address);

  const Sale = await hre.ethers.getContractFactory("embSalev1");
  const saleProxy = await hre.upgrades.deployProxy(Sale, [nftProxy.address, wEthAddress, trustedForwarder], {
    kind: "uups",
  });
  console.log("Contract SaleProxy deployed to: ", saleProxy.address);

  console.log("------------------------------ Contract Deployment Ended ------------------------------");
  console.log("------------------------------ Deployment Storage Started ------------------------------");

  deployedContractsv1[network] = {
    embNFTv1: nftProxy.address,
    embSalev1: saleProxy.address,
  };

  fs.writeFileSync("./deployment/v1.json", JSON.stringify(deployedContractsv1));

  console.log("------------------------------ Deployment Storage Ended ------------------------------");
}

deployBase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
