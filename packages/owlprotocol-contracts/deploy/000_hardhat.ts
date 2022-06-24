import { ethers, network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { FactoryERC721 } from '../typechain';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { other } = await getNamedAccounts();

    if (network.name === 'hardhat') {
        await deploy('FactoryERC20', {
            from: other,
            args: [0, 'name', 'ticker'],
            log: true,
        });

        await deploy('FactoryERC721', {
            from: other,
            args: ['name', 'symbol'],
            log: true,
        });
        const { address } = await deployments.get('FactoryERC721');
        const ERC721Contract = (await ethers.getContractAt('FactoryERC721', address)) as FactoryERC721;
        await ERC721Contract.mint(other, 1);
        await ERC721Contract.mint(other, 2);
    }
};

export default deploy;
