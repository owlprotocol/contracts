import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    if (process.env.PRIV_KEY === undefined) return;

    await deploy('VRFBeacon', {
        from: deployer,
        args: [
            8001,
            '0x6168499c0cFfCaCD319c818142124B7A15E857ab',
            '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
            50000, //gas limit
            10,
        ],
        log: true,
    });
};

export default deploy;
deploy.tags = ['Random'];
