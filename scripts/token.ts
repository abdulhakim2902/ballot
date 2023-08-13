import { HardhatRuntimeEnvironment, Network } from "hardhat/types";
import { DelegateArgument, MintArgument } from "./types";
import { ContractTransactionReceipt } from "ethers";

export async function mint(args: MintArgument, hre: HardhatRuntimeEnvironment) {
  const { ethers, network } = hre;

  try {
    const [deployer] = await ethers.getSigners();

    let targetAddr = args.address;
    if (!ethers.isAddress(targetAddr) || targetAddr === ethers.ZeroAddress) {
      targetAddr = deployer.address;
    }

    console.log(`Running on network ${network.name}...\n`);

    console.log("Start minting...");
    const contract = await ethers.getContractAt("Token", args.contract);
    const connectedContract = contract.connect(deployer);
    const amount = ethers.toBigInt(args.amount);
    const res = await connectedContract.mint(targetAddr, amount);
    const txn = await res.wait();
    const explorer = getExplorerURL(network, txn);
    console.log(`Minted ${amount.toString()} to ${targetAddr}.`);
    if (explorer) console.log(explorer);
  } catch (err) {
    console.log(err);
  }
}

export async function delegate(
  args: DelegateArgument,
  hre: HardhatRuntimeEnvironment,
) {
  const { ethers, network } = hre;

  try {
    const accounts = await ethers.getSigners();
    const account = accounts.find((e) => e.address === args.signer);
    const signer = account ?? accounts[0];

    let targetAddr = args.address;
    if (!ethers.isAddress(targetAddr) || targetAddr === ethers.ZeroAddress) {
      targetAddr = signer.address;
    }

    console.log(`Running on network ${network.name}...\n`);

    console.log("Delegating...");
    const contract = await ethers.getContractAt("Token", args.contract);
    const connectedContract = contract.connect(signer);
    const res = await connectedContract.delegate(targetAddr);
    const txn = await res.wait();
    const explorer = getExplorerURL(network, txn);
    if (signer.address === targetAddr) {
      console.log(`${targetAddr} is delegated with amount `);
    } else {
      console.log(`${signer.address} is delegated to ${targetAddr}.`);
    }

    if (explorer) console.log(explorer);
  } catch (err) {
    console.log(err);
  }
}

export function getExplorerURL(
  network: Network,
  txn: ContractTransactionReceipt | null,
): string {
  const baseURL = `https://${network.name}.etherscan.io/tx`;
  const isLocal = network.name === "localhost" || network.name === "hardhat";
  return !isLocal && txn ? `${baseURL}/${txn.hash}` : "";
}
