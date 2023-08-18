import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DelegateArgument, MintArgument, Receipt, Status } from "./types";
import { getExplorerURL } from "../utils/explorer-url";

export async function mint(args: MintArgument, hre: HardhatRuntimeEnvironment) {
  const { ethers, network } = hre;
  const receipt: Receipt = {
    name: "mint",
    from: args.signer,
    to: args.contract,
    params: {
      account: args.address,
      amount: args.amount,
    },
    status: Status.SUCCESS,
  };

  try {
    const accounts = await ethers.getSigners();
    const account = accounts.find((e) => e.address === args.signer);
    const signer = account ?? accounts[0];

    receipt.from = signer.address;

    let targetAddr = args.address;
    if (!ethers.isAddress(targetAddr) || targetAddr === ethers.ZeroAddress) {
      targetAddr = signer.address;
      receipt.params = { account: targetAddr };
    }

    console.log("Start minting...");
    const contract = await ethers.getContractAt("Token", args.contract);
    const connectedContract = contract.connect(signer);
    const res = await connectedContract.mint(targetAddr, args.amount);
    const txn = await res.wait(1);
    if (!txn) throw new Error("Error");
    const explorer = getExplorerURL(network, txn);
    console.log(`Minted ${args.amount} to ${targetAddr}.\n`);
    if (explorer) console.log(explorer);

    receipt.hash = txn.hash;
    receipt.blockNumber = txn.blockNumber;
    receipt.explorerURL = explorer;
  } catch (err) {
    console.log(`${(err as any).message}\n`);

    receipt.status = Status.FAILED;
    receipt.reason = (err as any).message;
  }

  return receipt;
}

export async function delegate(
  args: DelegateArgument,
  hre: HardhatRuntimeEnvironment,
) {
  const { ethers, network } = hre;
  const receipt: Receipt = {
    name: "delegate",
    from: args.signer,
    to: args.contract,
    params: {
      account: args.address,
    },
    status: Status.SUCCESS,
  };

  try {
    const accounts = await ethers.getSigners();
    const account = accounts.find((e) => e.address === args.signer);
    const signer = account ?? accounts[0];

    receipt.from = signer.address;

    let targetAddr = args.address;
    if (!ethers.isAddress(targetAddr) || targetAddr === ethers.ZeroAddress) {
      targetAddr = signer.address;
      receipt.params = { account: targetAddr };
    }

    console.log("Delegating...");
    const contract = await ethers.getContractAt("Token", args.contract);
    const connectedContract = contract.connect(signer);
    const res = await connectedContract.delegate(targetAddr);
    const txn = await res.wait();
    if (!txn) throw new Error("Error");
    const explorer = getExplorerURL(network, txn);
    if (signer.address === targetAddr) {
      console.log(`${targetAddr} is delegated.\n`);
    } else {
      console.log(`${signer.address} is delegated to ${targetAddr}.\n`);
    }

    if (explorer) console.log(explorer);

    receipt.hash = txn.hash;
    receipt.blockNumber = txn.blockNumber;
    receipt.explorerURL = explorer;
  } catch (err) {
    console.log(`${(err as any).message}\n`);

    receipt.status = Status.FAILED;
    receipt.reason = (err as any).message;
  }

  return receipt;
}
