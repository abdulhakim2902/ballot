import { ethers } from "hardhat";
import { Ballot, Token } from "../typechain-types";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

const PROPOSALS = ["CAT", "FISH", "DOG"];
const NAME = "ANIMAL";
const MINT_VALUE = ethers.parseEther("1");

async function deploy(): Promise<[Token, Ballot]> {
  const [deployer] = await ethers.getSigners();

  // Contract factory
  const tokenFactory = await ethers.getContractFactory("Token", deployer);
  const ballotFactory = await ethers.getContractFactory("Ballot", deployer);

  // Contract
  const tokenContract = await tokenFactory.deploy();
  await tokenContract.waitForDeployment();
  const tokenAddress = await tokenContract.getAddress();

  const ballotContract = await ballotFactory.deploy(tokenAddress);
  await ballotContract.waitForDeployment();

  return [tokenContract, ballotContract];
}

describe("Ballot", async () => {
  let account0: HardhatEthersSigner;
  let account1: HardhatEthersSigner;
  let account2: HardhatEthersSigner;

  let tokenContract: Token;
  let ballotContract: Ballot;

  beforeEach(async () => {
    [account0, account1, account2] = await ethers.getSigners();
    [tokenContract, ballotContract] = await loadFixture(deploy);
  });

  describe("when the Ballot contract is deployed", async () => {
    it("uses a valid ERC20 as token vote", async () => {
      const contractAddr = await ballotContract.tokenContract();
      const tokenContract = await ethers.getContractAt("Token", contractAddr);
      const balanceOf = tokenContract.balanceOf(ethers.ZeroAddress);
      const totalSupply = tokenContract.totalSupply();
      await expect(balanceOf).not.to.be.reverted;
      await expect(totalSupply).not.to.be.reverted;
    });
  });

  describe("when the new Ballot is created", async () => {
    let name: string;
    let proposals: string[];
    let connectedContract: Ballot;

    beforeEach(async () => {
      name = ethers.encodeBytes32String(NAME);
      proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e));
      connectedContract = ballotContract.connect(account0);

      await connectedContract.newBallot(name, proposals);
    });

    it("has the provided proposals", async () => {
      for (let i = 0; i < proposals.length; i++) {
        const proposal = await ballotContract.proposals(name, i);
        const decodedName = ethers.decodeBytes32String(proposal.name);
        expect(decodedName).to.eq(PROPOSALS[i]);
      }
    });

    it("has zero votes for all proposals", async () => {
      for (let i = 0; i < proposals.length; i++) {
        const proposal = await ballotContract.proposals(name, i);
        expect(proposal.voteCount).to.eq(0);
      }
    });

    it("has 3 proposal names", async () => {
      const metadatas = await ballotContract.ballotMetadas(name);
      expect(metadatas.totalProposal.toString()).to.eq(PROPOSALS.length.toString());
    });

    it("sets the account0 address as the ballot owner", async () => {
      const metadatas = await ballotContract.ballotMetadas(name);
      expect(metadatas.owner).to.eq(account0.address);
    });

    it("can not create a new ballot with the same name", async () => {
      const newBallot = connectedContract.newBallot(name, proposals);
      await expect(newBallot).to.be.revertedWith("Ballot: already existed");
    });

    it("can not create a new Ballot when the proposal name less than 2 names", async () => {
      const name = ethers.encodeBytes32String("FRUIT");
      const proposals = [ethers.encodeBytes32String("APPLE")];
      const action = connectedContract.newBallot(name, proposals);
      const error = "Ballot: at least 2 names is provided";
      await expect(action).to.be.revertedWith(error);
    });
  });

  describe("when the target block number is setted", async () => {
    let name: string;

    beforeEach(async () => {
      name = ethers.encodeBytes32String(NAME);

      const proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e));
      await ballotContract.connect(account0).newBallot(name, proposals);
      await ballotContract.connect(account0).setTargetBlockNumber(name, 10);
    });

    it("has the provided target block number", async () => {
      const metadatas = await ballotContract.ballotMetadas(name);
      expect(metadatas.targetBlockNumber).to.eq(10n);
    });

    it("sets the target block number for the existing ballot", async () => {
      const blockNumber = 50;
      const connectedContract = ballotContract.connect(account0);
      await connectedContract.setTargetBlockNumber(name, blockNumber);

      const metadatas = await ballotContract.ballotMetadas(name);
      expect(metadatas.targetBlockNumber).to.eq(50n);
    });

    it("can not change the target block number for the ballot that is not owned", async () => {
      const blockNumber = 50;
      const connectedContract = ballotContract.connect(account1);
      const action = connectedContract.setTargetBlockNumber(name, blockNumber);

      await expect(action).to.be.revertedWith("Ballot: not the ballot owner");
    });
  });

  describe("when the voter interact with the vote function in the contract", async () => {
    let name: string;
    let blockNumber: bigint;
    let proposals: string[];
    let connectedContract: Ballot;

    beforeEach(async () => {
      name = ethers.encodeBytes32String(NAME);
      blockNumber = ethers.toBigInt(10);
      proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e));
      connectedContract = ballotContract.connect(account0);

      await connectedContract.newBallot(name, proposals);
      await connectedContract.setTargetBlockNumber(name, blockNumber);
      await tokenContract.connect(account0).mint(account0, MINT_VALUE);
      await tokenContract.connect(account0).delegate(account0);
    });

    it("should register the vote", async () => {
      const index = Math.floor(Math.random() * PROPOSALS.length);
      const amount = MINT_VALUE / BigInt(Math.floor(Math.random() * 10) + 1);

      await mine(10);

      const bVotingPower = await ballotContract.votingPower(name, account0);
      await connectedContract.vote(name, index, amount);
      const aVotingPower = await ballotContract.votingPower(name, account0);
      expect(bVotingPower - aVotingPower).to.eq(amount);

      const votingPowerSpent = await ballotContract.votingPowerSpent(account0);
      expect(votingPowerSpent).to.eq(amount);

      const proposal = await ballotContract.proposals(name, index);
      const decodedName = ethers.decodeBytes32String(proposal.name);
      expect(decodedName).to.eq(PROPOSALS[index]);
      expect(proposal.voteCount).to.eq(amount);
    });

    it("can not cast vote when the voter voting power is insufficient", async () => {
      const index = Math.floor(Math.random() * PROPOSALS.length);
      const amount = 2n * MINT_VALUE;

      await mine(10);

      const action = connectedContract.vote(name, index, amount);
      await expect(action).to.be.revertedWith(
        "Ballot: trying to vote more than allowed",
      );
    });
  });

  describe("when the voter delegate to the other voter", async () => {
    let name: string;
    let blockNumber: bigint;
    let proposals: string[];
    let connectedContract: Ballot;

    beforeEach(async () => {
      name = ethers.encodeBytes32String(NAME);
      blockNumber = ethers.toBigInt(10);
      proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e));
      connectedContract = ballotContract.connect(account2);

      await connectedContract.newBallot(name, proposals);
      await connectedContract.setTargetBlockNumber(name, blockNumber);
      await tokenContract.connect(account0).mint(account0, MINT_VALUE);
      await tokenContract.connect(account0).delegate(account0);
      await tokenContract.connect(account0).delegate(account2);
    });

    it("should register the vote by the delegator", async () => {
      const index = Math.floor(Math.random() * PROPOSALS.length);
      const amount = MINT_VALUE / BigInt(Math.floor(Math.random() * 10) + 1);

      await mine(10);

      const votingPower = await ballotContract.votingPower(name, account0);
      expect(votingPower).to.eq(0n);

      const bVotingPower = await ballotContract.votingPower(name, account2);
      await connectedContract.vote(name, index, amount);
      const aVotingPower = await ballotContract.votingPower(name, account2);
      expect(bVotingPower - aVotingPower).to.eq(amount);

      const votingPowerSpent = await ballotContract.votingPowerSpent(account2);
      expect(votingPowerSpent).to.eq(amount);

      const proposal = await ballotContract.proposals(name, index);
      const decodedName = ethers.decodeBytes32String(proposal.name);
      expect(decodedName).to.eq(PROPOSALS[index]);
      expect(proposal.voteCount).to.eq(amount);
    });
  });

  describe("when someone interact with the winningProposal function", async () => {
    let name: string;
    let blockNumber: bigint;
    let proposals: string[];
    let connectedContract: Ballot;

    beforeEach(async () => {
      name = ethers.encodeBytes32String(NAME);
      blockNumber = ethers.toBigInt(10);
      proposals = PROPOSALS.map((e) => ethers.encodeBytes32String(e));
      connectedContract = ballotContract.connect(account0);

      await connectedContract.newBallot(name, proposals);
      await connectedContract.setTargetBlockNumber(name, blockNumber);
      await tokenContract.connect(account0).mint(account0, MINT_VALUE);
      await tokenContract.connect(account0).delegate(account0);
    });

    it("should return -1 when no winner", async () => {
      const winningProposal = await ballotContract.winningProposal(name);
      expect(winningProposal).to.eq(-1n);
    });

    it("should return none when no winner", async () => {
      const winnerName = await ballotContract.winnerName(name);
      const decodedName = ethers.decodeBytes32String(winnerName);
      expect(decodedName).to.eq("none");
    });

    it("should return proposal index when there is a winner", async () => {
      const index = Math.floor(Math.random() * PROPOSALS.length);

      await mine(10);
      await connectedContract.vote(name, index, MINT_VALUE);

      const winningProposal = await ballotContract.winningProposal(name);
      expect(winningProposal).to.eq(index);
    });

    it("should return winner name when there is a winner", async () => {
      const index = Math.floor(Math.random() * PROPOSALS.length);

      await mine(10);
      await connectedContract.vote(name, index, MINT_VALUE);

      const winnerName = await ballotContract.winnerName(name);
      const decodedName = ethers.decodeBytes32String(winnerName);
      expect(decodedName).to.eq(PROPOSALS[index]);
    });
  });
});
