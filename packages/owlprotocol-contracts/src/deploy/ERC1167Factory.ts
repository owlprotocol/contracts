import { ethers } from 'hardhat';

//npx hardhat run --network localhost src/deploy/ERC1167Factory.ts
async function main() {
    // We get the contract to deploy
    const factory = await ethers.getContractFactory('ERC1167Factory');
    const contract = await factory.deploy();

    await contract.deployed();
    console.log('ERC1167Factory deployed to:', contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
