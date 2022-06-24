import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const address = '0xaAC1f37122143C918e533e5B516517b81A88F962';
const nonceToDeploy = 7;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (network.name !== 'hardhat' && nonce != nonceToDeploy)
        return console.log(`wrong nonce ${nonce}; required ${nonceToDeploy}`);

    await deploy('UpgradeableBeaconInitializable', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['BeaconImpl', 'Beacon', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
