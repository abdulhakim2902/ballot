import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "./tasks";

import Config from "./config";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  paths: { tests: "tests" },
  networks: {
    sepolia: {
      url: Config.SEPOLIA,
      accounts: Config.ACCOUNTS,
    },
  },
  etherscan: {
    apiKey: Config.ETHERSCAN_KEY,
  },
};

export default config;
