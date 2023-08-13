import { task, types } from "hardhat/config";
import { accounts } from "../scripts/accounts";
import { deploy, deployAndVerify } from "../scripts/deploy";
import { ethers } from "ethers";
import { delegate, mint } from "../scripts/token";

const ZeroAddress = ethers.ZeroAddress;

task("accounts", "Get list of avalaible accounts").setAction(accounts);

task("deploy", "Deploy contract")
  .addOptionalParam("name", "contract name", "", types.string)
  .addOptionalParam("params", "contract parameters", {}, types.json)
  .setAction(deploy);

task("deploy-and-verify", "Deploy and verify contract")
  .addOptionalParam("name", "contract name", "", types.string)
  .addOptionalParam("params", "contract parameters", {}, types.json)
  .setAction(deployAndVerify);

task("mint", "Minting token")
  .addOptionalParam("contract", "contract address", ZeroAddress, types.string)
  .addOptionalParam("address", "recipient address", ZeroAddress, types.string)
  .addOptionalParam("amount", "amount to be minted", "0", types.string)
  .setAction(mint);

task("delegate", "Delegating to ERC20Votes contract")
  .addOptionalParam("signer", "signer address", ZeroAddress, types.string)
  .addOptionalParam("contract", "contract address", ZeroAddress, types.string)
  .addOptionalParam("address", "delegatee address", ZeroAddress, types.string)
  .setAction(delegate);
