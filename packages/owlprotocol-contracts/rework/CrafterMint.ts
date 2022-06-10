import { ethers } from 'hardhat';
import { ERC1155, ERC1167Factory, ERC1167Factory__factory, Initializable } from '../typechain';

(async () => {
    const [admin] = await ethers.getSigners();

    const ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
    const ERC1167Factory = await ERC1167FactoryFactory.deploy();

    //DEPLOY ERC721
    const ERC721Factory = await ethers.getContractFactory('ERC721Owl');
    const ERC721Implementation = await ERC721Factory.deploy();

    const ONE_ADDRESS = '0x0000000000000000000000000000000000000001';

    await Promise.all([ERC1167Factory.deployed(), ERC721Implementation.deployed()]);

    console.debug({
        ERC1167Factory: ERC1167Factory.address,
        ERC721: ERC721Implementation.address,
    });

    const salt = ethers.utils.formatBytes32String('0');

    const ERC721Data = ERC721Implementation.interface.encodeFunctionData('initialize', [
        admin.address,
        'CryptoOwls',
        'OWL',
        'https://api.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM',
    ]);
    const ERC721InstanceAddress = await ERC1167Factory.predictDeterministicAddress(
        ERC721Implementation.address,
        salt,
        ERC721Data,
    );
    await ERC1167Factory.cloneDeterministic(ERC721Implementation.address, salt, ERC721Data);

    //DEPLOY ERC1155
    const ERC1155OwlFactory = await ethers.getContractFactory('ERC1155Owl');
    const ERC1155OwlImplementaiton = await ERC1155OwlFactory.deploy();
    await ERC1155OwlImplementaiton.deployed();

    const ERC1155OwlData = ERC1155OwlImplementaiton.interface.encodeFunctionData('initialize', [
        admin.address,
        'https://api.owlprotocol.xyz/...',
    ]);

    const ERC1155OwlAddress = await ERC1167Factory.predictDeterministicAddress(
        ERC1155OwlImplementaiton.address,
        salt,
        ERC1155OwlData,
    );
    await ERC1167Factory.cloneDeterministic(ERC1155OwlImplementaiton.address, salt, ERC1155OwlData);

    //DEPLOY CRAFTER MINT
    const CrafterMintFactory = await ethers.getContractFactory('CrafterMint');
    const CrafterMintImplementation = await CrafterMintFactory.deploy();
    await CrafterMintImplementation.deployed();

    const CrafterMintData = CrafterMintImplementation.interface.encodeFunctionData('initialize', [
        admin.address,
        ONE_ADDRESS,
        [
            {
                token: 2,
                consumableType: 1,
                contractAddr: ERC1155OwlAddress,
                amounts: [2, 2, 2, 1, 1, 1, 2],
                tokenIds: [0, 1, 2, 3, 4, 5, 6],
            },
        ],
        [
            {
                token: 1,
                consumableType: 0,
                contractAddr: ERC721InstanceAddress,
                amounts: [],
                tokenIds: [],
            },
        ],
    ]);

    const CrafterMintAddress = await ERC1167Factory.predictDeterministicAddress(
        CrafterMintImplementation.address,
        salt,
        CrafterMintData,
    );
    await ERC1167Factory.cloneDeterministic(CrafterMintImplementation.address, salt, CrafterMintData);

    console.debug({
        ERC721Instance: ERC721InstanceAddress,
        ERC1155Instnace: ERC1155OwlAddress,
        CrafterMintInstance: CrafterMintAddress,
    });
})();
