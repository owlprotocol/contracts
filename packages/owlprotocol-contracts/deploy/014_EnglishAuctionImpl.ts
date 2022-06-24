import { web3, ethers, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

//const address = ''; //change this
//const nonceToDeploy = 16; //change this

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    //if (process.env.PRIV_KEY === undefined) return;
    //const nonce = await web3.eth.getTransactionCount(deployer);
    //const wallet = new ethers.Wallet(process.env.PRIV_KEY, ethers.provider);

    /*
    if ((await web3.eth.getCode(address)) != '0x')
        return console.log(`already deployed on ${network.name} as ${address}`);

     //burn nonces 0 - ?
    if (nonce < nonceToDeploy) {
        for (let i = 0; i < nonceToDeploy - nonce; i++) {
            const sendTx = await wallet.sendTransaction({
                to: wallet.address,
                value: 1,
            });
            await sendTx.wait();
        }
    }
    if ((await web3.eth.getTransactionCount(deployer)) != nonceToDeploy) return console.log('wrong nonce'); */

    await deploy('EnglishAuction', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['EnglishAuctionImpl', 'EnglishAuction', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
