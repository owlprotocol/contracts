import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import {
    FactoryERC20,
    FactoryERC20__factory,
    FactoryERC721,
    FactoryERC721__factory,
    MinterSimple,
    MinterSimple__factory,
} from '../../../../typechain';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('MinterCore.sol', function () {
    let accounts: SignerWithAddress[];
    let owner: SignerWithAddress;
    let developer: SignerWithAddress;

    let MinterSimpleFactory: MinterSimple__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let minter: MinterSimple;
    let nft: FactoryERC721;
    let erc20: FactoryERC20;

    let speciesAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    before(async () => {
        // Deploy contracts
        MinterSimpleFactory = await ethers.getContractFactory('MinterSimple');
        FactoryERC20 = await ethers.getContractFactory('FactoryERC20');
        FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

        accounts = await ethers.getSigners();
        owner = accounts[0];
        developer = accounts[2];

        minter = await MinterSimpleFactory.deploy();
        nft = await FactoryERC721.deploy('NFT', 'NFT');
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([minter.deployed(), nft.deployed(), erc20.deployed()]);

        speciesAddress = nft.address;
        mintFeeToken = erc20.address;
        mintFeeAddress = developer.address;
        mintFeeAmount = 10;
    });

    describe('MinterCore.createSpecies(...)', async () => {
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
