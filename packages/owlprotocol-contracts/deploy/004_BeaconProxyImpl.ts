import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { burn, burnNonce } from './000_constants';

const address = '0x37B6fcd5a2715590dB7F77Fe58a9ba578BE31198';
const nonceToDeploy = 8;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (burn) await burnNonce(deployer, nonceToDeploy);
    if (network.name !== 'hardhat' && (await web3.eth.getTransactionCount(deployer)) != nonceToDeploy)
        return console.log('wrong nonce');

    await deploy('BeaconProxyInitializable', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['BeaconProxyImpl', 'BeaconProxy', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
