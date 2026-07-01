import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();

  const contractAddress = "0xd0b715bdd713c846abff63f7b896322fcd2bba7e";

  const contract = await viem.getContractAt("IoTVerifyChain", contractAddress);

  const sysAdmin = await contract.read.sysAdmin();
  const totalDevices = await contract.read.getTotalDevices();

  console.log("Contract address:", contractAddress);
  console.log("SysAdmin:", sysAdmin);
  console.log("Total devices:", totalDevices);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});