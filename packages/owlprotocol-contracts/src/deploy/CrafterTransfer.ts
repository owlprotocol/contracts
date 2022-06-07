import { ethers } from 'hardhat';
import { ERC1155, ERC1167Factory, ERC1167Factory__factory, Initializable } from '../../typechain';

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

    //DEPLOY CRAFTER TRANSFER
    const CrafterTransferFactory = await ethers.getContractFactory('CrafterTransfer');
    const CrafterTransferImplementation = await CrafterTransferFactory.deploy();
    await CrafterTransferImplementation.deployed();

    const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
        admin.address,
        ONE_ADDRESS,
        11,
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
                tokenIds: [
                    '15532881770934585726362572820003503218105251610',
                    '22669120234464385131654002667250978900018984730',
                    '11251138692816706083187714911655017808957011738',
                    '5542147921992866558954571033857037263426025242',
                    '23739556003993855042447717144338100252306044698',
                    '23025931936180581485115997338265290227201491226',
                    '29448546774817694566680861022136080797837031194',
                    '35157537545641534090914004899934061343368017690',
                    '40866528316465373615147148777732041888899004186',
                    '45861895240936232901745540205708751110725437210',
                    '45861895019475939582048572849457212409325437210',
                ],
            },
        ],
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
        ERC1155Instnace: ERC1155OwlAddress,
        CrafterTransferInstance: CrafterTransferAddress,
    });
})();
