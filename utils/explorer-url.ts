import { ContractTransactionReceipt } from "ethers";
import { Network } from "hardhat/types";

export function getExplorerURL(
  network: Network,
  txn: ContractTransactionReceipt | null,
): string {
  const baseURL = `https://${network.name}.etherscan.io/tx`;
  const isLocal = network.name === "localhost" || network.name === "hardhat";
  return !isLocal && txn ? `${baseURL}/${txn.hash}` : "";
}
