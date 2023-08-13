import { Wallet } from "ethers";

import * as dotenv from "dotenv";

dotenv.config();

class Config {
  public ACCOUNTS: string[];
  public SEPOLIA: string;
  public ETHERSCAN_KEY: string;

  constructor() {
    this.ACCOUNTS = this.getAccounts();
    this.SEPOLIA = process.env.SEPOLIA ?? "";
    this.ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY ?? "";
  }

  private getAccounts(): string[] {
    const accounts: string[] = [];
    const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (deployerKey) {
      accounts.push(deployerKey);
    }

    try {
      const privateKey = JSON.parse(process.env.ACCOUNT_PRIVATE_KEYS ?? "");
      accounts.push(...privateKey);
    } catch {
      // ignore
    }

    return accounts.filter((account) => {
      try {
        const wallet = new Wallet(account);
        return Boolean(wallet.address);
      } catch {
        // ignore
      }

      return false;
    });
  }
}

const config = new Config();
export default config;
