export interface Contract {
  signer: string;
  contract: string;
}

export interface DeployArgument<T> {
  name: string;
  params: T;
}

// Params lists
export interface Params {
  token?: string;
}

export interface Recipient {
  address: string;
}

export interface Ballot {
  ballot: number;
}

export interface MintArgument extends Contract, Recipient {
  amount: string;
}

export interface DelegateArgument extends Contract, Recipient {}

export interface NewBallotArguments extends Contract {
  name: string;
  proposals: string;
}

export interface VoteArguments extends Contract, Ballot {
  amount: string;
  proposal: string;
}

export interface VotingPowerArgument extends Contract, Recipient, Ballot {}

export interface WinningProposalArgument extends Contract, Ballot {}

export enum Status {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export interface Receipt {
  name: string;
  from: string;
  to: string | null;
  params: any;
  status: Status;
  hash?: string;
  blockNumber?: number;
  explorerURL?: string;
  reason?: string;
}
