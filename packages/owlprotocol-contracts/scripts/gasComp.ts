import { ethers } from 'hardhat';
import { deployClone } from '../test/utils';
import { ERC1167Factory, ERC721Owl } from '../typechain';

(async () => {
    const [admin] = await ethers.getSigners();

    //Deploy ERC721BeaconProxy
    const ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
    const ERC1167Factory = (await ERC1167FactoryFactory.deploy()) as ERC1167Factory;

    const beaconFactory = await ethers.getContractFactory('UpgradeableBeaconInitializable');
    const beaconImpl = await beaconFactory.deploy();

    const beaconProxyFactory = await ethers.getContractFactory('BeaconProxyInitializable');
    const beaconProxyImpl = await beaconProxyFactory.deploy();

    const ERC721OwlFactory = await ethers.getContractFactory('ERC721Owl');
    const ERC721OwlImpl = await ERC721OwlFactory.deploy();

    const { address: beaconERC721InstAddr } = await deployClone(
        beaconImpl,
        [admin.address, ERC721OwlImpl.address],
        ERC1167Factory,
    );
    const { address: ERC721BPInstAddr, receipt: deployReceipt } = await deployClone(
        beaconProxyImpl,
        [
            admin.address,
            beaconERC721InstAddr,
            ERC721OwlImpl.interface.encodeFunctionData('proxyInitialize', [admin.address, 'name', 'symbol', 'baseURI']),
        ],
        ERC1167Factory,
    );

    const nftBeaconProxy = (await ethers.getContractAt('ERC721Owl', ERC721BPInstAddr)) as ERC721Owl;

    //Deploy normal ERC721
    const ERC721Factory = await ethers.getContractFactory('FactoryERC721');
    const ERC721 = await ERC721Factory.deploy('name', 'symbol');
    const normalDeploy = await ERC721.deployTransaction.wait();

    //Minting comparison
    const mintBeaconProxy = await nftBeaconProxy.mint(admin.address, 5);
    const mintNormal = await ERC721.mint(admin.address, 5);

    const beaconProxyReceipt = await mintBeaconProxy.wait();
    const normalReceipt = await mintNormal.wait();

    console.log(`Deploying beacon proxy used ${deployReceipt?.gasUsed} and normal deploy used ${normalDeploy.gasUsed}`);
    console.log(
        `Beacon proxy minting used ${beaconProxyReceipt.gasUsed} gas and normal minting used ${normalReceipt.gasUsed} gas`,
    );
})();
