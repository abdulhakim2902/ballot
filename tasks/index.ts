import { task, types } from "hardhat/config";
import { accounts } from "../scripts/accounts";
import { deploy, deployAndVerify } from "../scripts/deploy";
import { ethers } from "ethers";
import { delegate, mint } from "../scripts/token";
import { records } from "../scripts/records";
import {
  newBallot,
  vote,
  votingPower,
  winningProposal,
} from "../scripts/ballot";

const ZeroAddress = ethers.ZeroAddress;

task("records", "Running a complete tokenize ballot system").setAction(records);

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

task("delegate", "Delegating to account address")
  .addOptionalParam("signer", "signer address", ZeroAddress, types.string)
  .addOptionalParam("contract", "contract address", ZeroAddress, types.string)
  .addOptionalParam("address", "delegatee address", ZeroAddress, types.string)
  .setAction(delegate);

task("new-ballot", "Create new ballot")
  .addOptionalParam("signer", "signer address", ZeroAddress, types.string)
  .addOptionalParam("contract", "contract address", ZeroAddress, types.string)
  .addOptionalParam("name", "ballot group name", "animal", types.string)
  .addOptionalParam("proposals", "proposals list", "cat,dog,fish", types.string)
  .setAction(newBallot);

task("vote", "Voting proposal")
  .addOptionalParam("signer", "Signer address", ZeroAddress, types.string)
  .addOptionalParam("contract", "contract address", ZeroAddress, types.string)
  .addOptionalParam("name", "ballot group name", "animal", types.string)
  .addOptionalParam("proposal", "proposal index", "0", types.string)
  .addOptionalParam("amount", "vote amount", "0", types.string)
  .setAction(vote);

task("voting-power", "Account voting power")
  .addOptionalParam("contract", "contract address", ZeroAddress, types.string)
  .addOptionalParam("name", "ballot group name", "animal", types.string)
  .addOptionalParam("address", "account address", ZeroAddress, types.string)
  .setAction(votingPower);

task("winning-proposal", "Winning proposal")
  .addOptionalParam("contract", "contract address", ZeroAddress, types.string)
  .addOptionalParam("name", "ballot group name", "animal", types.string)
  .setAction(winningProposal);
