import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log(await web3.eth.getCode('0x6168499c0cFfCaCD319c818142124B7A15E857ab'));

    if (process.env.PRIV_KEY === undefined) return;
};

export default deploy;
deploy.tags = ['Random'];
