import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    if (process.env.PRIV_KEY === undefined) return;

    // console.log(await deployments.get('ERC721Owl'));

    await deploy('BeaconProxyInitializable', {
        from: deployer,
        log: true,
    });
};

export default deploy;
deploy.tags = ['BeaconProxy', 'Implementation'];
