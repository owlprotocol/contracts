import { ethers } from 'hardhat';

//npx hardhat run --network localhost src/deploy/main.ts
async function main() {
    // We get the contract to deploy
    const ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
    const ERC1167Factory = await ERC1167FactoryFactory.deploy();

    const ERC721Factory = await ethers.getContractFactory('ERC721Owl');
    const ERC721Implementation = await ERC721Factory.deploy();

    await Promise.all([ERC1167Factory.deployed(), ERC721Implementation.deployed()]);

    console.debug({
        ERC1167Factory: ERC1167Factory.address,
        ERC721: ERC721Implementation.address,
    });

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    //const coder = new ethers.utils.AbiCoder();
    const salt = ethers.utils.formatBytes32String('');
    //const data = coder.encode(['address', 'string', 'string', 'string'], [ZERO_ADDRESS, 'TestNFT', 'TEST', '']);
    const data = ERC721Implementation.interface.encodeFunctionData('initialize', [
        ZERO_ADDRESS,
        'TestNFT',
        'TEST',
        '0x',
    ]);
    console.debug({ salt, data });
    const ERC721InstanceAddress = await ERC1167Factory.predictDeterministicAddress(
        ERC721Implementation.address,
        salt,
        data,
    );
    await ERC1167Factory.cloneDeterministic(ERC721Implementation.address, salt, data);
    console.debug({
        ERC721Instance: ERC721InstanceAddress
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
