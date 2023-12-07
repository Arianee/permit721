import { task } from 'hardhat/config';
import { getNetworkOverrides } from '../utils';

task('deploy-permit721', 'Deploy a Permit721 contract')
  .setAction(async (taskArgs, hre) => {
    const { ethers, network } = hre;

    const [deployer] = await ethers.getSigners();

    const taskParams: TaskParamLog[] = [
      {
        name: 'Network',
        type: 'Network',
        value: network.name,
      },
      {
        name: 'Deployer',
        type: 'EOA',
        value: deployer.address,
      }
    ];
    console.table(taskParams);

    console.info(`Deploying Permit721...\n`);
    console.time('Deployment');

    const Permit721Factory = await ethers.getContractFactory('Permit721');
    const permit721 = await Permit721Factory.deploy(getNetworkOverrides(network.name));
    await permit721.waitForDeployment();

    const permit721Address = await permit721.getAddress();

    const contractDeploymentsResults: Array<ContractDeploymentResult> = [
      {
        name: 'Permit721',
        address: permit721Address,
        tx: permit721.deploymentTransaction()!.hash,
      },
    ];
    console.table(contractDeploymentsResults);

    console.timeEnd('Deployment');
    console.info(`\nPermit721 deployed successfully`);
  });
