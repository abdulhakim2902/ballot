// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
/// @title Voting with delegation.

interface IMyToken {
  function getPastVotes(address, uint256) external view returns (uint256);
}

contract Ballot {
  struct Proposal {
    bytes32 name;
    uint voteCount;
  }

  IMyToken public tokenContract;

  mapping(bytes32 => Proposal[]) public proposals;

  mapping(bytes32 => uint256) public targetBlockNumber;

  mapping(address => uint256) public votingPowerSpent;

  mapping(bytes32 => address) public owners;

  constructor(address _tokenContract) {
    tokenContract = IMyToken(_tokenContract);
  }

  function vote(bytes32 name, uint proposal, uint amount) external {
    require(targetBlockNumber[name] > 0, "Ballot: target block number is not setted");
    require(
        votingPower(name, msg.sender) >= amount,
        "Ballot: trying to vote more than allowed"
    );

    votingPowerSpent[msg.sender] += amount;
    proposals[name][proposal].voteCount += amount;
  }

  function votingPower(bytes32 name, address account) public view returns(uint256) {
    return (
      tokenContract.getPastVotes(account, targetBlockNumber[name]) - votingPowerSpent[account]
    );
  }

  function winningProposal(bytes32 name) public view returns (int winningProposal_) {
    uint winningVoteCount = 0;
    for (uint p = 0; p < proposals[name].length; p++) {
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

  function totalProposal(bytes32 name) external view returns (uint count){
    count = proposals[name].length;
  }

  function setTargetBlockNumber(bytes32 name, uint256 _targetBlockNumber) external {
    require(owners[name] == msg.sender, "Ballot: not the ballot owner");
    targetBlockNumber[name] = _targetBlockNumber;
  }

  function newBallot(bytes32 name, bytes32[] calldata proposalNames) external {
    require(proposals[name].length == 0, "Ballot: already existed");
    require(proposalNames.length > 1, "Ballot: at least 2 names is provided");  

    owners[name] = msg.sender;

    for (uint i = 0; i < proposalNames.length; i++) {
      proposals[name].push(Proposal({name: proposalNames[i], voteCount: 0}));
    }
  }
}
