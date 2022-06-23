import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { burn, burnNonce } from './000_constants';

const address = '0x93CC0cA9158cC2C9Eb17785537Ac7ADE65D141CD';
const nonceToDeploy = 14;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} at ${address}`);

    if (burn) await burnNonce(deployer, nonceToDeploy);
    console.log(await web3.eth.getTransactionCount(deployer));

    if (network.name !== 'hardhat' && (await web3.eth.getTransactionCount(deployer)) != nonceToDeploy)
        return console.log('wrong nonce');

    await deploy('ERC721Owl', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['ERC721Impl', 'ERC721', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
