import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { burnNonce } from '../../constants';

//change both
const address = '0x05484C5722BD007Dd485703F9989197f4297689f';
const nonceToDeploy = 26;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (network.name === 'hardhat') await burnNonce(deployer, nonceToDeploy);
    if ((await web3.eth.getTransactionCount(deployer)) != nonceToDeploy)
        return console.log(`wrong nonce ${nonce}; required ${nonceToDeploy}`);

    await deploy('NaivePaymaster', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['NaivePaymasterImpl', 'NaivePaymaster', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
