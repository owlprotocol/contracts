import { ethers, network, web3 } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ERC1155, ERC1167Factory, ERC1167Factory__factory, Initializable } from '../typechain';

const tokenIds = [
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
];

const ERC1115Amounts = [2, 2, 2, 1, 1, 1, 2];
const ERC1155Ids = [0, 1, 2, 3, 4, 5, 6];

const salt = ethers.utils.formatBytes32String('0');

let ProxyFactoryAddress = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);
    if (process.env.PRIV_KEY === undefined) return;
    const wallet = new ethers.Wallet(process.env.PRIV_KEY, ethers.provider);
    let ERC1167Factory;
    if (network.name === 'hardhat') {
        const ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        ProxyFactoryAddress = ERC1167Factory.address;
    } else {
        //validate that ProxyFactoryAddress is a real address
        ethers.utils.getAddress(ProxyFactoryAddress);
        ERC1167Factory = await ethers.getContractAt('ERC1167Factory', ProxyFactoryAddress);
    }

    const [admin] = await ethers.getSigners();

    //DEPLOY ERC721
    const ERC721Factory = await ethers.getContractFactory('ERC721Owl');
    const ERC721Implementation = await ERC721Factory.deploy();
    // const ERC721Implementation = await ethers.getContractAt('ERC721Owl', '0xe28D22CCBe42760028f40Ad0c93b862d3e992542');

    //DEPLOY ERC1155
    const ERC1155Factory = await ethers.getContractFactory('ERC1155Owl');
    const ERC1155Implementation = await ERC1155Factory.deploy();
    // const ERC1155Implementation = await ethers.getContractAt(
    //     'ERC1155Owl',
    //     '0xdBd2BaCe25998F67781aA087cEaF8f2a45B5f9B4',
    // );

    const ONE_ADDRESS = '0x0000000000000000000000000000000000000001';

    // await Promise.all([ERC1167Factory.deployed(), ERC721Implementation.deployed()]);

    console.debug({
        ERC1167Factory: ERC1167Factory.address,
        ERC721Implementation: ERC721Implementation.address,
        ERC1155Implementation: ERC1155Implementation.address,
    });

    //Deploy ERC721 Instance through proxy
    const ERC721Data = ERC721Implementation.interface.encodeFunctionData('initialize', [
        admin.address,
        'CryptoOwls',
        'OWL',
        'https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/',
    ]);

    const ERC721InstanceAddress = await ERC1167Factory.predictDeterministicAddress(
        ERC721Implementation.address,
        salt,
        ERC721Data,
    );

    const deployERC721 = await ERC1167Factory.cloneDeterministic(ERC721Implementation.address, salt, ERC721Data);
    await deployERC721.wait();
    const cryptoOwlsContr = await ethers.getContractAt('ERC721Owl', ERC721InstanceAddress);
    //mint token ids
    tokenIds.forEach(async (id) => {
        const mintTx = await cryptoOwlsContr.connect(admin).mint(admin.address, id);
        await mintTx.wait();
    });

    //Deploy ERC1155 Instance through proxy
    const ERC1155Data = ERC1155Implementation.interface.encodeFunctionData('initialize', [
        admin.address,
        'ipfs://QmaWCmXshn6Tk81hpape3kCvTgpjkTQAnDamVuHeY46Tnu',
    ]);

    const ERC1155InstanceAddress = await ERC1167Factory.predictDeterministicAddress(
        ERC1155Implementation.address,
        salt,
        ERC1155Data,
    );

    const deployERC1155 = await ERC1167Factory.cloneDeterministic(ERC1155Implementation.address, salt, ERC1155Data);
    await deployERC1155.wait();
    const cryptoOwlsPartsContr = await ethers.getContractAt('ERC1155Owl', ERC1155InstanceAddress);
    //mint ERC1155 tokens
    const mintTx = await cryptoOwlsPartsContr.connect(admin).mintBatch(admin.address, ERC1155Ids, ERC1115Amounts, '0x');
    await mintTx.wait();

    //DEPLOY CRAFTER TRANSFER
    const CrafterTransferFactory = await ethers.getContractFactory('CrafterTransfer');
    const CrafterTransferImplementation = await CrafterTransferFactory.deploy();
    await CrafterTransferImplementation.deployed();

    const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
        admin.address,
        ONE_ADDRESS,
        10,
        [
            {
                token: 2,
                consumableType: 1,
                contractAddr: ERC1155InstanceAddress,
                amounts: ERC1115Amounts,
                tokenIds: ERC1155Ids,
            },
        ],
        [
            {
                token: 1,
                consumableType: 0,
                contractAddr: ERC721InstanceAddress,
                amounts: [],
                tokenIds,
            },
        ],
    ]);

    const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
        CrafterTransferImplementation.address,
        salt,
        CrafterTransferData,
    );

    console.log('admin', admin.address);
    //approve
    await cryptoOwlsContr.connect(admin).setApprovalForAll(CrafterTransferAddress, true);
    await cryptoOwlsPartsContr.connect(admin).setApprovalForAll(CrafterTransferAddress, true);

    console.log(await cryptoOwlsContr.ownerOf('15532881770934585726362572820003503218105251610'));

    const tx = await CrafterTransferImplementation.initialize(
        admin.address,
        ONE_ADDRESS,
        10,
        [
            {
                token: 2,
                consumableType: 1,
                contractAddr: ERC1155InstanceAddress,
                amounts: ERC1115Amounts,
                tokenIds: ERC1155Ids,
            },
        ],
        [
            {
                token: 1,
                consumableType: 0,
                contractAddr: ERC721InstanceAddress,
                amounts: [],
                tokenIds,
            },
        ],
    );
    await tx.wait();

    // await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);

    console.debug({
        ERC721Instance: ERC721InstanceAddress,
        ERC1155Instnace: ERC1155InstanceAddress,
        CrafterTransferInstance: CrafterTransferAddress,
    });
};
export default deploy;
deploy.tags = ['CrafterTransfer'];
