import fs from "fs";

import { ethers } from "ethers";
import { Ballot } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { delegate, mint } from "./token";
import { Receipt } from "./types";
import { deploy } from "./deploy";
import { newBallot, vote, winningProposal } from "./ballot";
const GROUPID = "ANIMAL";
const PROPOSALS = ["CAT", "FISH", "DOG"];
const MINT_VALUE = ethers.parseUnits("1");
const RECEIPTS: Receipt[] = [];
const RECORD = {
  network: "localhost",
  receipts: RECEIPTS,
  winner: { name: "none", index: "-1", totalVote: "0" },
};

export async function records(args: any, hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;

  const allAccounts = await ethers.getSigners();
  const accounts = allAccounts.slice(0, 3);
  const [deployer, account1, account2] = accounts;
  const network = await ethers.provider.getNetwork();

  console.log(`Running on network ${network.name}...\n`);
  console.log(`Total accounts: ${accounts.length}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Account1: ${account1?.address}`);
  console.log(`Account2: ${account2?.address}\n`);

  // Explorer URL
  const baseURL = `https://${network.name}.etherscan.io/tx`;
  const isLocal = network.name === "localhost" || network.name === "hardhat";

  RECORD.network = network.name;

  // Deploy token contract
  const tokenInfo = await deploy({ name: "Token", params: {} }, hre);
  const tokenAddress = tokenInfo.contract.address;

  // Minting
  for (const account of accounts) {
    const receipt = await mint(
      {
        signer: deployer.address,
        contract: tokenAddress,
        address: account.address,
        amount: MINT_VALUE.toString(),
      },
      hre,
    );

    RECEIPTS.push(receipt);
  }

  // Delegating
  for (const account of accounts) {
    const receipt = await delegate(
      {
        signer: account.address,
        address: account.address,
        contract: tokenAddress,
      },
      hre,
    );

    RECEIPTS.push(receipt);
  }

  if (accounts.length == 3) {
    // Account 1 delegate to account 2
    const receipt = await delegate(
      {
        signer: account1.address,
        address: account2.address,
        contract: tokenAddress,
      },
      hre,
    );

    RECEIPTS.push(receipt);
  }

  // Deploy ballot contract
  const ballotInfo = await deploy(
    { name: "Ballot", params: { token: tokenAddress } },
    hre,
  );

  const ballotContract = ballotInfo.contract.contract as Ballot;
  const ballotContractAddress = ballotInfo.contract.address;

  const newBallotReceipt = await newBallot(
    {
      signer: deployer.address,
      contract: ballotContractAddress,
      name: GROUPID,
      proposals: PROPOSALS.join(","),
    },
    hre,
  );

  RECEIPTS.push(newBallotReceipt);

  // Parameter
  const name = ethers.encodeBytes32String(GROUPID);
  const vp = await ballotContract.votingPower(name, deployer.address);

  // Vote more than 1 proposal by deployer (FIXED AMOUNT)
  let remaining = 1000n;
  for (let i = 0; i < PROPOSALS.length; i++) {
    let random = BigInt(Math.floor((Math.random() / 2) * 1000));
    while (random > remaining) {
      random = BigInt(Math.floor((Math.random() / 2) * 1000));
    }

    const amount = (random * vp) / 1000n;
    const receipt = await vote(
      {
        signer: deployer.address,
        name: GROUPID,
        contract: ballotContractAddress,
        amount: amount.toString(),
        proposal: i.toString(),
      },
      hre,
    );

    RECEIPTS.push(receipt);
  }

  // Vote more than 1 proposal by account 2 (FIXED AMOUNT)
  if (accounts.length == 3) {
    const vp = await ballotContract.votingPower(name, account2.address);
    const total = BigInt(PROPOSALS.length);
    const amount = vp / total;

    for (let i = 0; i < PROPOSALS.length; i++) {
      const receipt = await vote(
        {
          signer: account2.address,
          name: GROUPID,
          contract: ballotContractAddress,
          amount: amount.toString(),
          proposal: i.toString(),
        },
        hre,
      );

      RECEIPTS.push(receipt);
    }
  }

  // Rejected vote by account 1
  if (account1) {
    const idx = Math.floor(Math.random() * PROPOSALS.length);
    const receipt = await vote(
      {
        signer: account1.address,
        name: GROUPID,
        contract: ballotContractAddress,
        amount: MINT_VALUE.toString(),
        proposal: idx.toString(),
      },
      hre,
    );

    RECEIPTS.push(receipt);
  }

  RECORD.receipts = RECEIPTS;
  RECORD.winner = await winningProposal(
    { name: GROUPID, contract: ballotContractAddress, signer: "" },
    hre,
  );

  const records = JSON.stringify(RECORD, null, 2);
  fs.writeFileSync("records.json", records);
}
