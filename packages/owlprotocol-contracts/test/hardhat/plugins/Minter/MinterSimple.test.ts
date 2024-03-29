import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
    FactoryERC20,
    FactoryERC20__factory,
    FactoryERC721,
    FactoryERC721__factory,
    MinterSimple,
    MinterSimple__factory,
} from '../../../../typechain';

import { deployClone, deployProxy } from '../../utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('MinterSimple.sol', function () {
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    let MinterSimpleFactory: MinterSimple__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let MinterImplementation: MinterSimple;
    let nft: FactoryERC721;
    let erc20: FactoryERC20;

    let nftAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    before(async () => {
        // Deploy contracts
        MinterSimpleFactory = (await ethers.getContractFactory('MinterSimple')) as MinterSimple__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

        [owner, user, burnAddress] = await ethers.getSigners();

        MinterImplementation = await MinterSimpleFactory.deploy();
        nft = await FactoryERC721.deploy('NFT', 'NFT');
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([MinterImplementation.deployed(), nft.deployed(), erc20.deployed()]);

        nftAddress = nft.address;
        mintFeeToken = erc20.address;
        mintFeeAddress = burnAddress.address;
        mintFeeAmount = 10;
    });

    describe('MinterSimple.mint(...) for fee', async () => {
        let minter: MinterSimple;

        beforeEach(async () => {
            const { address } = await deployClone(MinterImplementation, [
                owner.address,
                mintFeeToken,
                mintFeeAddress,
                mintFeeAmount,
                nftAddress,
                '0x' + '0'.repeat(40), // trusted forwarder
            ]);

            minter = (await ethers.getContractAt('MinterSimple', address)) as MinterSimple;
        });

        it('Minting fee', async () => {
            // Authorize transfer
            await erc20.increaseAllowance(minter.address, '20');

            // Mint Specimen
            await expect(() => minter.mint(owner.address, '1')).to.changeTokenBalance(erc20, burnAddress, 10);

            // // SafeMint Specimen
            await expect(() => minter.safeMint(owner.address, '2')).to.changeTokenBalance(erc20, burnAddress, 10);
        });

        it('Not enough funds', async () => {
            await expect(minter.connect(user).safeMint(owner.address, '4')).to.be.revertedWith(
                'ERC20: insufficient allowance',
            );
        });
    });

    describe('MinterSimple.mint(...) no fee', async () => {
        let minter: MinterSimple;

        beforeEach(async () => {
            const { address } = await deployClone(MinterImplementation, [
                owner.address,
                ethers.constants.AddressZero,
                ethers.constants.AddressZero,
                0,
                nftAddress,
                ethers.constants.AddressZero, // trusted forwarder
            ]);

            minter = (await ethers.getContractAt('MinterSimple', address)) as MinterSimple;
        });

        it('mint without fee', async () => {
            await minter.connect(user).mint(user.address, '5');
        });

        it('safeMint without fee', async () => {
            await minter.connect(user).safeMint(user.address, '6');
        });
    });

    it('Beacon proxy initialization', async () => {
        const args = [
            owner.address,
            mintFeeToken,
            mintFeeAddress,
            mintFeeAmount,
            nftAddress,
            '0x' + '0'.repeat(40), // trusted forwarder
        ];

        const contract = (await deployProxy(owner.address, MinterImplementation, args)) as MinterSimple;
        // Authorize transfer
        await erc20.increaseAllowance(contract.address, '10');
        await contract.mint(owner.address, 7);
    });
});
