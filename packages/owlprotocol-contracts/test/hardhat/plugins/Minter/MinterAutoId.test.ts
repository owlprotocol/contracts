import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
    BeaconProxyInitializable,
    BeaconProxyInitializable__factory,
    FactoryERC20,
    FactoryERC20__factory,
    FactoryERC721,
    FactoryERC721__factory,
    MinterAutoId,
    MinterAutoId__factory,
    UpgradeableBeaconInitializable,
    UpgradeableBeaconInitializable__factory,
} from '../../../../typechain';

import { predictDeployClone, deployClone } from '../../utils';

describe('MinterAutoId.sol', function () {
    let owner: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    let MinterAutoIdFactory: MinterAutoId__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let MinterImplementation: MinterAutoId;
    let erc20: FactoryERC20;

    let nftAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    before(async () => {
        // Deploy contracts
        MinterAutoIdFactory = (await ethers.getContractFactory('MinterAutoId')) as MinterAutoId__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

        [owner, burnAddress] = await ethers.getSigners();

        MinterImplementation = await MinterAutoIdFactory.deploy();
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([MinterImplementation.deployed(), erc20.deployed()]);

        mintFeeToken = erc20.address;
        mintFeeAddress = burnAddress.address;
        mintFeeAmount = 10;
    });

    describe('MinterAutoId testing', async () => {
        let minter: MinterAutoId;
        let nft: FactoryERC721;

        beforeEach(async () => {
            nft = await FactoryERC721.deploy('NFT', 'NFT');
            await nft.deployed();

            const { address } = await deployClone(MinterImplementation, [
                owner.address,
                mintFeeToken,
                mintFeeAddress,
                mintFeeAmount,
                nft.address,
                '0x' + '0'.repeat(40), // trusted forwarder
            ]);

            minter = (await ethers.getContractAt('MinterAutoId', address)) as MinterAutoId;
        });

        it('MinterAutoId.mint(...)', async () => {
            // Authorize transfer
            await erc20.increaseAllowance(minter.address, '20');

            // Mint Specimen
            await minter.mint(owner.address);
            expect(await nft.exists(0)).to.be.true;

            // Second mint increments id
            await minter.safeMint(owner.address);
            expect(await nft.exists(1)).to.be.true;
        });

        it('Next token id', async () => {
            // Authorize transfer
            await erc20.increaseAllowance(minter.address, '20');

            // Set next token
            await minter.setNextTokenId(100);

            // Mint another
            await minter.mint(owner.address);
            expect(await nft.exists(100));
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
            ethers.constants.AddressZero, // nft addr
            ethers.constants.AddressZero, // trusted forwarder
        ];

        //@ts-ignore
        const data = MinterImplementation.interface.encodeFunctionData('proxyInitialize', args);
        const beaconProxyAddr = await predictDeployClone(beaconProxyImpl, [owner.address, beaconAddr, data]);

        await deployClone(beaconProxyImpl, [owner.address, beaconAddr, data]);
        const contract = (await ethers.getContractAt('MinterAutoId', beaconProxyAddr)) as MinterAutoId;

        await contract.mint(owner.address);
    });
});
