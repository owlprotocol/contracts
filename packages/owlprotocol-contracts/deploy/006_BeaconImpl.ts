import { web3, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const address = '0xaAC1f37122143C918e533e5B516517b81A88F962';
const nonceToDeploy = 7;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    if (process.env.PRIV_KEY === undefined) return;

    if ((await web3.eth.getCode(address)) != '0x') return console.log(`already deployed on ${network.name}`);

    //burn nonces 0 - 6
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

    await deploy('UpgradeableBeaconInitializable', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['BeaconImpl', 'Beacon', 'Implementation'];
deploy.dependencies = ['ProxyFactory'];
