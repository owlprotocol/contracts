import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { burn, burnNonce } from './000_constants';

const address = '0x1Fd2b65F7e23abC6f69EAf5ABf8db73e5a73B73b';
const nonceToDeploy = 16;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (burn) await burnNonce(deployer, nonceToDeploy);
    if (network.name !== 'hardhat' && (await web3.eth.getTransactionCount(deployer)) != nonceToDeploy)
        await deploy('CrafterTransfer', {
            from: deployer,
            log: true,
        });
};

export default deploy;
deploy.tags = ['CrafterTransferImpl', 'CrafterTransfer', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
