import { ethers } from 'hardhat';

//npx hardhat run --network localhost src/deploy/main.ts
async function main() {
    // We get the contract to deploy
    const ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
    const ERC1167Factory = await ERC1167FactoryFactory.deploy();

    const ERC721Factory = await ethers.getContractFactory('ERC721Owl');
    const ERC721Implementation = await ERC721Factory.deploy();

    const CrafterTransferFactory = await ethers.getContractFactory('CrafterTransfer');
    const CrafterTransferImplementation = await CrafterTransferFactory.deploy();

    await Promise.all([ERC1167Factory.deployed(), ERC721Implementation.deployed()]);

    console.debug({
        ERC1167Factory: ERC1167Factory.address,
        ERC721: ERC721Implementation.address,
        CrafterTransferImplementation: CrafterTransferImplementation.address,
    });

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const salt = ethers.utils.formatBytes32String('');

    //ERC721
    const ERC721Data = ERC721Implementation.interface.encodeFunctionData('initialize', [
        ZERO_ADDRESS,
        'TestNFT',
        'TEST',
        '0x',
    ]);
    const ERC721InstanceAddress = await ERC1167Factory.predictDeterministicAddress(
        ERC721Implementation.address,
        salt,
        ERC721Data,
    );
    await ERC1167Factory.cloneDeterministic(ERC721Implementation.address, salt, ERC721Data);

    //CrafterTransfer
    /**
     * address _admin,
        address _burnAddress,
        uint256 _craftableAmount,
        CraftLib.Ingredient[] calldata _inputs,
        CraftLib.Ingredient[] calldata _outputs,
        uint256[][] calldata _outputsERC721Ids
     */
    const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        0,
        [],
        [],
    ]);
    const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
        CrafterTransferImplementation.address,
        salt,
        CrafterTransferData,
    );
    await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);

    console.debug({
        ERC721Instance: ERC721InstanceAddress,
        CrafterTransfer: CrafterTransferAddress,
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
