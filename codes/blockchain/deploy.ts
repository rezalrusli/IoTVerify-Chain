import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();

  const contract = await viem.deployContract("IoTVerifyChain");

  console.log("=================================");
  console.log("IoTVerify-Chain deployed to:");
  console.log(contract.address);
  console.log("=================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});