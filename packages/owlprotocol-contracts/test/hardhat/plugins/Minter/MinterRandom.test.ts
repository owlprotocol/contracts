import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import {
    FactoryERC20__factory,
    FactoryERC721__factory,
    FactoryERC20,
    FactoryERC721,
    MinterRandom,
    MinterRandom__factory,
    UpgradeableBeaconInitializable__factory,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
} from '../../../../typechain';
import { UpgradeableBeaconInitializable } from '../../../../types/ethers';
import { deployClone, predictDeployClone } from '../../utils';

describe('MinterRandom.sol', function () {
    let owner: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    let MinterRandomFactory: MinterRandom__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let MinterImplementation: MinterRandom;
    let nft: FactoryERC721;
    let erc20: FactoryERC20;

    let nftAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    before(async () => {
        // Deploy contracts
        MinterRandomFactory = (await ethers.getContractFactory('MinterRandom')) as MinterRandom__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

        [owner, burnAddress] = await ethers.getSigners();

        MinterImplementation = await MinterRandomFactory.deploy();
        nft = await FactoryERC721.deploy('NFT', 'NFT');
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([MinterImplementation.deployed(), nft.deployed(), erc20.deployed()]);

        nftAddress = nft.address;
        mintFeeToken = erc20.address;
        mintFeeAddress = burnAddress.address;
        mintFeeAmount = 10;
    });

    describe('MinterRandom Minting', async () => {
        let minter: MinterRandom;

        beforeEach(async () => {
            const { address } = await deployClone(MinterImplementation, [
                owner.address,
                mintFeeToken,
                mintFeeAddress,
                mintFeeAmount,
                nftAddress,
                '0x' + '0'.repeat(40), // trusted forwarder
            ]);

            minter = (await ethers.getContractAt('MinterRandom', address)) as MinterRandom;
        });

        it('MinterRandom.mint(...)', async () => {
            // Authorize transfer
            await erc20.increaseAllowance(minter.address, '20');

            // Mint Specimen
            await minter.mint(owner.address);

            // SafeMint Specimen
            await minter.safeMint(owner.address);
        });
    });

    it('Beacon proxy initialization', async () => {
        const beaconFactory = (await ethers.getContractFactory(
            'UpgradeableBeaconInitializable',
        )) as UpgradeableBeaconInitializable__factory;
        const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

        const beaconProxyFactory = (await ethers.getContractFactory(
            'BeaconProxyInitializable',
        )) as BeaconProxyInitializable__factory;
        const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

        const { address: beaconAddr } = await deployClone(beaconImpl, [owner.address, MinterImplementation.address]);

        const args = [
            owner.address,
            ethers.constants.AddressZero, // mint fee token
            ethers.constants.AddressZero, // mint fee address
            0, // mint amount
            nftAddress, // nft addr
            ethers.constants.AddressZero, // trusted forwarder
        ];

        //@ts-ignore
        const data = MinterImplementation.interface.encodeFunctionData('proxyInitialize', args);
        const beaconProxyAddr = await predictDeployClone(beaconProxyImpl, [owner.address, beaconAddr, data]);

        await deployClone(beaconProxyImpl, [owner.address, beaconAddr, data]);
        const contract = (await ethers.getContractAt('MinterAutoId', beaconProxyAddr)) as MinterRandom;

        await contract.mint(owner.address);
    });
});
