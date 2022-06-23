import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { burn, burnNonce } from './000_constants';

const address = '0xacDC0755137Bd4B1b148802a927CEA137e08B45b';
const nonceToDeploy = 6;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (burn) await burnNonce(deployer, nonceToDeploy);
    if (network.name !== 'hardhat' && (await web3.eth.getTransactionCount(deployer)) != nonceToDeploy)
        return console.log('wrong nonce');

    await deploy('CrafterMint', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['CrafterMintImpl', 'CrafterMint', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
