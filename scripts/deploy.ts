import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployArgument, Params } from "./types";

export async function deploy(
  args: DeployArgument<Params>,
  hre: HardhatRuntimeEnvironment,
) {
  const { run, ethers, network } = hre;
  const { name } = args;

  await run("compile");

  const params = await getParams(hre, args);

  const [deployer] = await ethers.getSigners();

  const factory = await ethers.getContractFactory(name, deployer);

  console.log("\nDeploying", name.toLowerCase(), "contract...");

  const contract = await factory.deploy(...params);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log(`Contract is deployed at ${contractAddress}.\n`);

  const contractInfo = {
    name: name,
    address: contractAddress,
    contract: contract,
  };

  return { contract: contractInfo, params };
}

export async function deployAndVerify(
  args: DeployArgument<Params>,
  hre: HardhatRuntimeEnvironment,
) {
  const { run } = hre;
  const { contract, params } = await run("deploy", args);

  console.log("Waiting for block confirmations...");

  await contract.contract?.deploymentTransaction()?.wait(5);

  console.log("Confirmed!\n");

  console.log("Verifying", contract.name.toLowerCase(), "contract...");

  await hre.run("verify:verify", {
    address: contract.address,
    contract: `contracts/${contract.name}.sol:${contract.name}`,
    constructorArguments: params,
  });
}

export async function getParams(
  hre: HardhatRuntimeEnvironment,
  args: DeployArgument<Params>,
) {
  const values = Object.values(args.params);

  // Custom function if you want to process parameters
  // Before deploying contract

  return values;
}
