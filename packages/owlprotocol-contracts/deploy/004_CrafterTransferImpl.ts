import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const address = '0x9375400526B841C045BF40C799ABB8e6fAcA4148';
const nonceToDeploy = 5;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    if (process.env.PRIV_KEY === undefined) return;

    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} as ${address}`);

    //burn nonces 0 - 4
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

    await deploy('CrafterTransfer', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['CrafterTransferImpl', 'CrafterTransfer', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
