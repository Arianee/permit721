import { task } from 'hardhat/config';
import { getNetworkOverrides } from '../utils';

task('deploy-mock-erc721', 'Deploy a MockERC721 contract')
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

    console.info(`Deploying MockERC721...\n`);
    console.time('Deployment');

    const MockERC721Factory = await ethers.getContractFactory('MockERC721');
    const mockERC721 = await MockERC721Factory.deploy(getNetworkOverrides(network.name));
    await mockERC721.waitForDeployment();

    const mockERC721Address = await mockERC721.getAddress();

    const contractDeploymentsResults: Array<ContractDeploymentResult> = [
      {
        name: 'MockERC721',
        address: mockERC721Address,
        tx: mockERC721.deploymentTransaction()!.hash,
      },
    ];
    console.table(contractDeploymentsResults);

    console.timeEnd('Deployment');
    console.info(`\nMockERC721 deployed successfully`);
  });
