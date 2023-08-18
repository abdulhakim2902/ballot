// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
/// @title Voting with delegation.

interface IMyToken {
  function getPastVotes(address, uint256) external view returns (uint256);
}

contract Ballot {
  struct Proposal {
    bytes32 name;
    uint256 voteCount;
  }

  struct BallotMetadata {
    bytes32 name;
    address owner;
    uint256 targetBlockNumber;
    uint256 totalProposal;
  }

  IMyToken public tokenContract;

  mapping(bytes32 name => BallotMetadata) public ballotMetadas;
  mapping(bytes32 name => mapping(uint256 index => Proposal proposal)) public proposals;

  mapping(address account => uint256 amount) public votingPowerSpent;

  event Vote(address voter, uint256 proposal, uint256 amount, bytes32 name);
  event NewBallot(bytes32 name, bytes32[] proposals, address owner);
  event UpdateTargetBlockNumber(bytes32 name, uint256 oldTargetBlockNumber, uint256 newTargetBlockNumber);

  constructor(address _tokenContract) {
    tokenContract = IMyToken(_tokenContract);
  }

  function vote(bytes32 name, uint256 proposal, uint256 amount) external {
    require(proposal < ballotMetadas[name].totalProposal, "Ballot: proposal not exists");
    require(
        votingPower(name, msg.sender) >= amount,
        "Ballot: trying to vote more than allowed"
    );

    votingPowerSpent[msg.sender] += amount;
    proposals[name][proposal].voteCount += amount;

    emit Vote(msg.sender, proposal, amount, name);
  }

  function votingPower(bytes32 name, address account) public view returns(uint256) {
    return (
      tokenContract.getPastVotes(account, ballotMetadas[name].targetBlockNumber) - votingPowerSpent[account]
    );
  }

  function winningProposal(bytes32 name) public view returns (int winningProposal_) {
    uint winningVoteCount = 0;
    for (uint p = 0; p < ballotMetadas[name].totalProposal; p++) {
      if (proposals[name][p].voteCount >= winningVoteCount) {
        if (proposals[name][p].voteCount == winningVoteCount) {
          winningProposal_ = -1;
        } else {
          winningVoteCount = proposals[name][p].voteCount;
          winningProposal_ = int(p);
        }
      }
    }
  }

  function winnerName(bytes32 name) external view returns (bytes32 winnerName_) {
    int winningProposal_ = winningProposal(name);
    if (winningProposal_ < 0) {
      winnerName_ = "none";
    } else {
      winnerName_ = proposals[name][uint(winningProposal_)].name;
    }
  }

  function setTargetBlockNumber(bytes32 name, uint256 _targetBlockNumber) external {
    require(ballotMetadas[name].owner == msg.sender, "Ballot: not the ballot owner");
    uint256 oldTargetBlockNumber = ballotMetadas[name].targetBlockNumber;
    ballotMetadas[name].targetBlockNumber = _targetBlockNumber;
    emit UpdateTargetBlockNumber(name, oldTargetBlockNumber, _targetBlockNumber);
  }

  function newBallot(bytes32 name, bytes32[] calldata proposalNames) external {
    require(ballotMetadas[name].owner == address(0), "Ballot: already existed");
    require(proposalNames.length > 1, "Ballot: at least 2 names is provided");  

    ballotMetadas[name].name = name;
    ballotMetadas[name].owner = msg.sender;
    ballotMetadas[name].targetBlockNumber = block.number - 1;
    ballotMetadas[name].totalProposal = proposalNames.length;

    for (uint i = 0; i < proposalNames.length; i++) {
      proposals[name][i] = Proposal({name: proposalNames[i], voteCount: 0});
    }

    emit NewBallot(name, proposalNames, msg.sender);
  }
}
