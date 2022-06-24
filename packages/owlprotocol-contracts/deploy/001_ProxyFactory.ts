import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const address = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';
const nonceToDeploy = 2;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (network.name !== 'hardhat' && nonce != nonceToDeploy)
        return console.log(`wrong nonce ${nonce}; required ${nonceToDeploy}`);

    await deploy('ERC1167Factory', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['ProxyFactoryImpl', 'ProxyFactory', 'Implementation'];
