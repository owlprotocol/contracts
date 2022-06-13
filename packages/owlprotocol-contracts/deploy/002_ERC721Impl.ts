import { ethers, web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployerAddr = '0x6fd935c3BbbDf664b67e28B14236a66a7588D683';
const address = '0x4ee2D9cc8395f297183341acE35214E21666C71B';
const nonceToDeploy = 3;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);
    if (process.env.PRIV_KEY === undefined) return;
    const wallet = new ethers.Wallet(process.env.PRIV_KEY, ethers.provider);

    if ((await web3.eth.getCode(address)) != '0x') return console.log(`already deployed on ${network.name}`);

    //burn nonces 0 - 2
    // if (nonce < nonceToDeploy) {
    //     for (let i = 0; i < nonceToDeploy - nonce; i++) {
    //         const sendTx = await wallet.sendTransaction({
    //             to: wallet.address,
    //             value: 1,
    //         });
    //         await sendTx.wait();
    //     }
    // }
    if ((await web3.eth.getTransactionCount(deployer)) != nonceToDeploy) return console.log('wrong nonce');

    await deploy('ERC721Owl', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['ERC721', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];