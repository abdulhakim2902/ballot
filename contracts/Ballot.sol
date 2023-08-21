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

  uint256 public totalBallots;

  mapping(bytes32 name => bool) private status;
  mapping(uint256 index => BallotMetadata) public ballotMetadas;
  mapping(uint256 ballotIndex => mapping(uint256 proposalIndex => Proposal proposal)) public proposals;

  mapping(address account => uint256 amount) public votingPowerSpent;

  event Vote(uint256 ballot, uint256 proposal, address voter, uint256 amount);
  event NewBallot(uint256 ballot, bytes32 name, address owner);
  event UpdateTargetBlockNumber(uint256 ballot, uint256 oldTargetBlockNumber, uint256 newTargetBlockNumber);

  constructor(address _tokenContract) {
    tokenContract = IMyToken(_tokenContract);
  }

  function vote(uint256 ballot, uint256 proposal, uint256 amount) external {
    require(proposal < ballotMetadas[ballot].totalProposal, "Ballot: proposal not exists");
    require(
        votingPower(ballot, msg.sender) >= amount,
        "Ballot: trying to vote more than allowed"
    );

    votingPowerSpent[msg.sender] += amount;
    proposals[ballot][proposal].voteCount += amount;

    emit Vote(ballot, proposal, msg.sender, amount);
  }

  function votingPower(uint256 ballot, address account) public view returns(uint256) {
    return (
      tokenContract.getPastVotes(account, ballotMetadas[ballot].targetBlockNumber) - votingPowerSpent[account]
    );
  }

  function winningProposal(uint256 ballot) public view returns (int winningProposal_) {
    uint winningVoteCount = 0;
    for (uint p = 0; p < ballotMetadas[ballot].totalProposal; p++) {
      if (proposals[ballot][p].voteCount >= winningVoteCount) {
        if (proposals[ballot][p].voteCount == winningVoteCount) {
          winningProposal_ = -1;
        } else {
          winningVoteCount = proposals[ballot][p].voteCount;
          winningProposal_ = int(p);
        }
      }
    }
  }

  function winnerName(uint256 ballot) external view returns (bytes32 winnerName_) {
    int winningProposal_ = winningProposal(ballot);
    if (winningProposal_ < 0) {
      winnerName_ = "none";
    } else {
      winnerName_ = proposals[ballot][uint(winningProposal_)].name;
    }
  }

  function setTargetBlockNumber(uint256 ballot, uint256 _targetBlockNumber) external {
    require(ballotMetadas[ballot].owner == msg.sender, "Ballot: not the ballot owner");
    uint256 oldTargetBlockNumber = ballotMetadas[ballot].targetBlockNumber;
    ballotMetadas[ballot].targetBlockNumber = _targetBlockNumber;
    emit UpdateTargetBlockNumber(ballot, oldTargetBlockNumber, _targetBlockNumber);
  }

  function newBallot(bytes32 name, bytes32[] calldata proposalNames) external {
    require(!status[name], "Ballot: already existed");
    require(proposalNames.length > 1, "Ballot: at least 2 names is provided");  

    ballotMetadas[totalBallots].name = name;
    ballotMetadas[totalBallots].owner = msg.sender;
    ballotMetadas[totalBallots].targetBlockNumber = block.number - 1;
    ballotMetadas[totalBallots].totalProposal = proposalNames.length;

    for (uint i = 0; i < proposalNames.length; i++) {
      proposals[totalBallots][i] = Proposal({name: proposalNames[i], voteCount: 0});
    }

    emit NewBallot(totalBallots, name, msg.sender);

    totalBallots += 1;
    status[name] = true;
  }
}
