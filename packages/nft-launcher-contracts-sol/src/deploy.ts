// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat';

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    // const Greeter = await ethers.getContractFactory("Greeter");
    // const greeter = await Greeter.deploy("Hello, Hardhat!");

    // await greeter.deployed();

    // console.log("Greeter deployed to:", greeter.address);

    // const minterSimple = await ethers.getContractFactory('MinterSimple');
    // const factoryERC721 = await ethers.getContractFactory('FactoryERC721');
    // const factoryERC20 = await ethers.getContractFactory('FactoryERC20');

    // const marketContr = await ethers.getContractFactory('SnakeGameRewards', {
    //     libraries: {
    //         CBORDecoding: (await cborDecoder.deploy()).address,
    //     },
    // });
    // const minterSimpleDeployed = await minterSimple.deploy();
    // const factoryERC721Deployed = await factoryERC721.deploy('owl', 'owl');
    // const factoryERC20Deployed = await factoryERC20.deploy('0', 'owl', 'owl');

    // await minterSimpleDeployed.deployed();
    // console.log('MinterSimple at: ', minterSimpleDeployed.address);

    // await factoryERC721Deployed.deployed();
    // console.log('FactoryERC721 at: ', factoryERC721Deployed.address);

    // await factoryERC20Deployed.deployed();
    // console.log('factoryERC20 at: ', factoryERC20Deployed.address);

    //   const NFTContr = await ethers.getContractFactory("NFT");
    //   const NFTDeploy = await NFTContr.deploy(marketDeploy.address);

    //   console.log("NFT deployed at: ", NFTDeploy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
