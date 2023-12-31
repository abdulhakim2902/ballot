import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  NewBallotArguments,
  Receipt,
  Status,
  VoteArguments,
  VotingPowerArgument,
  WinningProposalArgument,
} from "./types";
import { getExplorerURL } from "../utils/explorer-url";

export async function newBallot(
  args: NewBallotArguments,
  hre: HardhatRuntimeEnvironment,
) {
  const { ethers, network } = hre;

  const argProposals = args.proposals.split(",");
  const receipt: Receipt = {
    name: "newBallot",
    from: args.signer,
    to: args.contract,
    params: {
      name: args.name,
      proposals: argProposals,
    },
    status: Status.SUCCESS,
  };

  try {
    const accounts = await ethers.getSigners();
    const account = accounts.find((e) => e.address === args.signer);
    const signer = account ?? accounts[0];

    receipt.from = signer.address;

    console.log("Creating new ballot...");
    console.log("Name:", args.name);
    console.log(`Proposals: ${argProposals}`);

    const name = ethers.encodeBytes32String(args.name);
    const proposals = argProposals.map((e) => ethers.encodeBytes32String(e));

    const contract = await ethers.getContractAt("Ballot", args.contract);
    const connectedContract = contract.connect(signer);
    const res = await connectedContract.newBallot(name, proposals);
    const txn = await res.wait();
    if (!txn) throw new Error("Error");
    console.log("Ballot is created.\n");
    const explorer = getExplorerURL(network, txn);
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

export async function vote(
  args: VoteArguments,
  hre: HardhatRuntimeEnvironment,
) {
  const { ethers, network } = hre;
  const receipt: Receipt = {
    name: "vote",
    from: args.signer ?? "",
    to: args.contract,
    params: {
      name: "",
      amount: args.amount,
    },
    status: Status.SUCCESS,
  };

  try {
    const accounts = await ethers.getSigners();
    const account = accounts.find((e) => e.address === args.signer);
    const signer = account ?? accounts[0];

    const contract = await ethers.getContractAt("Ballot", args.contract);
    const proposal = await contract.proposals(args.ballot, args.proposal);
    const proposalName = ethers.decodeBytes32String(proposal.name);

    receipt.params.proposal = {
      name: proposalName,
      index: args.proposal,
    };

    const vp = await contract.votingPower(args.ballot, signer.address);
    console.log(`Voter: ${signer.address}`);
    console.log(`Voting Power: ${vp.toString()}`);

    const res = await contract
      .connect(signer)
      .vote(args.ballot, args.proposal, args.amount);
    const txn = await res.wait(1);
    if (!txn) throw new Error("Error");
    const explorer = getExplorerURL(network, txn);
    console.log(`Voted ${proposalName} with ${args.amount}.\n`);

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

export async function votingPower(
  args: VotingPowerArgument,
  hre: HardhatRuntimeEnvironment,
) {
  const { ethers } = hre;

  const contract = await ethers.getContractAt("Ballot", args.contract);
  const amount = await contract.votingPower(args.ballot, args.address);
  console.log("Voting power:", amount.toString());
  return amount;
}

export async function winningProposal(
  args: WinningProposalArgument,
  hre: HardhatRuntimeEnvironment,
) {
  const { ethers } = hre;

  const contract = await ethers.getContractAt("Ballot", args.contract);
  const winningProposal = await contract.winningProposal(args.ballot);
  const proposal = await contract.proposals(args.ballot, winningProposal);
  if (proposal.voteCount <= 0n) {
    return {
      name: "none",
      index: "-1",
      totalVote: "0",
    };
  }

  console.log("Winner:", ethers.decodeBytes32String(proposal.name));
  console.log("Total Vote:", proposal.voteCount.toString());

  return {
    name: ethers.decodeBytes32String(proposal.name),
    index: winningProposal.toString(),
    totalVote: proposal.voteCount.toString(),
  };
}
