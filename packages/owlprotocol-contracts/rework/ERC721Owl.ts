import { ethers } from 'hardhat';

//npx hardhat run --network localhost src/deploy/ERC721Owl.ts
async function main() {
    const factory = await ethers.getContractFactory('ERC721Owl');
    const contract = await factory.deploy();

    await contract.deployed();
    console.log('ERC721 deployed to:', contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
