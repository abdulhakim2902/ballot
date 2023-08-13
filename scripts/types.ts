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
  token: string;
}

export interface Recipient {
  address: string;
}

export interface MintArgument extends Contract, Recipient {
  amount: string;
}

export interface DelegateArgument extends Contract, Recipient {}
