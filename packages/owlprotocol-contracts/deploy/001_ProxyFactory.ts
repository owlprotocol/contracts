import { ethers, web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const address = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';
const nonceToDeploy = 2;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);
    if (process.env.PRIV_KEY === undefined) return;
    const wallet = new ethers.Wallet(process.env.PRIV_KEY, ethers.provider);

    if ((await web3.eth.getCode(address)) != '0x') return console.log(`already deployed on ${network.name}`);

    // //burn 0 and 1 nonce
    if (nonce < nonceToDeploy) {
        for (let i = 0; i < nonceToDeploy - nonce; i++) {
            const sendTx = await wallet.sendTransaction({
                to: wallet.address,
                value: 1,
            });
            await sendTx.wait();
        }
    }
    if ((await web3.eth.getTransactionCount(deployer)) != nonceToDeploy) return console.log('wrong nonce');

    await deploy('ERC1167Factory', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['ProxyFactory', 'Implementation'];
