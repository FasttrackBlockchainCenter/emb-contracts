//
//
// async function deployV2() {
//   console.log("------------------------------ Initial Setup Started ------------------------------");
//
//   let fs = require("fs");
//   let deployedContractsv2 = require("../deployment/v2.json");
//   let deployedContractsv1 = require("../deployment/v1.json");
//
//   const network = await hre.getChainId();
//   deployedContractsv2[network] = {};
//   let embNFTv1 = deployedContractsv1[network].embNFTv1;
//
//   console.log("------------------------------ Initial Setup Ended ------------------------------");
//   console.log("--------------- Contract Deployment Started ---------------");
//
//   const NFT2 = await hre.ethers.getContractFactory("embNFTv2");
//   const nftV2 = await hre.upgrades.upgradeProxy(embNFTv1, NFT2);
//
//   console.log("Contract NFT Contract Upgraded to V2 and Contract cna be accessed from :- ", nftV2.address);
//
//   console.log("------------------------------ Contract Deployment Ended ------------------------------");
//   console.log("------------------------------ Deployment Storage Started ------------------------------");
//
//   deployedContractsv2[network] = {
//     embNFTv2: nftV2.address
//   };
//
//   fs.writeFileSync("./deployment/v2.json", JSON.stringify(deployedContractsv2));
//
//   console.log("------------------------------ Deployment Storage Ended ------------------------------");
//
// }
//
// deployV2()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });
