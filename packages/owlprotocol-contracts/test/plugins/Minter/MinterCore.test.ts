import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import {
    FactoryERC20,
    FactoryERC20__factory,
    FactoryERC721,
    FactoryERC721__factory,
    MinterSimple,
    MinterSimple__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
} from '../../../typechain';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('MinterCore.sol', function () {
    let owner: SignerWithAddress;
    let developer: SignerWithAddress;

    let MinterSimpleFactory: MinterSimple__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let MinterImplementation: MinterSimple;
    let nft: FactoryERC721;
    let erc20: FactoryERC20;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let nftAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    before(async () => {
        // Deploy contracts
        MinterSimpleFactory = (await ethers.getContractFactory('MinterSimple')) as MinterSimple__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        [owner, developer] = await ethers.getSigners();

        MinterImplementation = await MinterSimpleFactory.deploy();
        nft = await FactoryERC721.deploy('NFT', 'NFT');
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([MinterImplementation.deployed(), nft.deployed(), erc20.deployed()]);

        nftAddress = nft.address;
        mintFeeToken = erc20.address;
        mintFeeAddress = developer.address;
        mintFeeAmount = 10;
    });

    describe('MinterCore.createSpecies(...)', async () => {

        let Minter: MinterSimple;

        beforeEach(async () => {

            // Setup deploy
            const MinterCoreData = MinterImplementation.interface.encodeFunctionData('initialize', [
                mintFeeToken,
                mintFeeAddress,
                mintFeeAmount,
                nftAddress
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('1');
            const MinterAddress = await ERC1167Factory.predictDeterministicAddress(
                MinterImplementation.address,
                salt,
                MinterCoreData,
            );

            // Clone
            await ERC1167Factory.cloneDeterministic(MinterImplementation.address, salt, MinterCoreData);
            Minter = await ethers.getContractAt('MinterSimple', MinterSim)

        });

        it('MinterCore species management', async () => {
            // MinterSimple can be used as a substitute for
            // MinterCore, as MinterSimple just exposes the
            // internal minting functions.

            // Create species
            await expect(minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount)).to.emit(
                minter,
                'CreateSpecies',
            );

            // Parse species
            const species = await minter.getSpecies('1');
            assert.equal(species.contractAddr, speciesAddress, 'species address mismatch!');
            assert.equal(species.owner, owner.address, 'species owner issue!');
            assert.equal(species.mintFeeAddress, mintFeeAddress);
            assert(species.mintFeeAmount.eq(mintFeeAmount));
            assert.equal(species.mintFeeToken, mintFeeToken);
        });

        // eslint-disable-next-line prettier/prettier
        it('Species doesn\'t exist!', async () => {
            // Species doens't exist
            await expect(minter.mint('2', '1')).to.be.revertedWith('Species does not exist!');
        });
    });

    describe('MinterCore.mint(...)', async () => {
        it('Minting fee', async () => {
            // Authorize transfer
            await erc20.increaseAllowance(minter.address, '30');

            // Mint Specimen
            await expect(() => minter.mint('1', '1')).to.changeTokenBalance(erc20, developer, 10);

            // // SafeMint Specimen
            await expect(() => minter.safeMint('1', '2')).to.changeTokenBalance(erc20, developer, 10);
        });

        it('Minting event', async () => {
            // Mint Event
            await expect(minter.mint('1', '3')).to.emit(minter, 'MintSpecies');
            // assert.equal(event[0].returnValues.tokenId, 2, 'Specimen minted!');
        });

        it('Not enough funds', async () => {
            await expect(minter.connect(developer).safeMint('1', '4')).to.be.revertedWith(
                'ERC20: insufficient allowance',
            );
        });
    });
});
