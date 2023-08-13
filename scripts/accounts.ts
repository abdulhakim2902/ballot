import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function accounts(args: object, hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;

  const accounts = await ethers.getSigners();

  console.log("Available accounts:");

  for (let i = 0; i < accounts.length; i++) {
    console.log("-", accounts[i].address);
  }
}
