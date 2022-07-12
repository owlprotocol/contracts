// NOTE - Currently disabled
// For future use!
// import { web3, network } from 'hardhat';
// import { HardhatRuntimeEnvironment } from 'hardhat/types';
// import { DeployFunction } from 'hardhat-deploy/types';
// // import { burnNonce } from '../../constants';

// // const address = '0x1Fd2b65F7e23abC6f69EAf5ABf8db73e5a73B73b';
// // const nonceToDeploy = 19;

// const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//     const { deployments, getNamedAccounts } = hre;
//     const { deploy } = deployments;
//     const { deployer } = await getNamedAccounts();

//     await deploy('AcceptEverythingPaymaster', {
//         from: deployer,
//         log: true,
//     });
// };

// export default deploy;
// deploy.tags = ['paymaster'];
