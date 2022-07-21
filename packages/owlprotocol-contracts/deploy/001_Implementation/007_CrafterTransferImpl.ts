import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { burnNonce } from '../../constants';

const address = '0x7F78a4ef1FcbF7CdD26380589B26b490387bEc9d';
const nonceToDeploy = 22;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (network.name === 'hardhat' || network.name == 'localhost') await burnNonce(deployer, nonceToDeploy);
    if ((await web3.eth.getTransactionCount(deployer)) != nonceToDeploy)
        return console.log(`wrong nonce ${nonce}; required ${nonceToDeploy}`);

    await deploy('CrafterTransfer', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['CrafterTransferImpl', 'CrafterTransfer', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
