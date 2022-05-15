import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import { encodeGenesUint256, decodeGenesUint256 } from '../../../../src/nft-launcher-lib/Species';
import sleep from '../../../../src/utils/sleep';
import { BigNumber as BN } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    FactoryERC20__factory,
    FactoryERC721__factory,
    MinterBreeding,
    MinterBreeding__factory,
    MinterSimple__factory,
} from '../../../../typechain';
const toBN = BN.from;

describe('MinterBreeding.sol', function () {
    let accounts: SignerWithAddress[];
    let developer: SignerWithAddress;
    let user: SignerWithAddress;

    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;
    let MinterSimpleFactory: MinterSimple__factory;
    let MinterBreedingFactory: MinterBreeding__factory;

    // Including lots of genes makes it unlikley that we'll be unlucky and
    // breed a new specimen exactly the same as an existing
    const speciesId = 1;
    const genes = [0, 20, 36, 40, 44, 48, 52, 56, 60];
    const baseParentGenes = [1024, 256, 0, 0, 0, 0, 0, 0, 0];
    const parentGenes: number[][] = [];
    const encodedParents: BN[] = [];
    const numParents = 5;

    before(async () => {
        MinterSimpleFactory = await ethers.getContractFactory('MinterSimple');
        MinterBreedingFactory = await ethers.getContractFactory('MinterBreeding');
        FactoryERC20 = await ethers.getContractFactory('FactoryERC20');
        FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

        accounts = await ethers.getSigners();
        developer = accounts[0];
        user = accounts[1];

        // Generate parents w incrementing values from baseParentGenes
        for (let i = 0; i < numParents; i++) parentGenes.push(baseParentGenes.map((v) => v + i));

        // Create encodings
        for (const parent of parentGenes) encodedParents.push(encodeGenesUint256(parent, genes));
    });

    describe('MinterBreeding.breed(...)', async () => {
        it('Breed Specimen', async () => {
            const minterBreeding = await setupBreederContract();

            // Breed our first specimen
            await expect(minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]])).to.emit(
                minterBreeding,
                'MintSpecies',
            );

            // Make sure we called our simple breed function (no mutation)
            const newSpecimen = await getLastBredSpeciesId(minterBreeding);
            const newSpecimenDNA = decodeGenesUint256(newSpecimen, genes);

            // Assert our first gene is from one of our parents (mutation function not called)
            // Note mutation testing is done in `RosalindDNA.test.ts`
            // For every value, make sure it's coming from a parent
            for (let geneIdx = 0; geneIdx < parentGenes[0].length; geneIdx++)
                assert(
                    newSpecimenDNA[geneIdx].eq(parentGenes[0][geneIdx]) ||
                        newSpecimenDNA[geneIdx].eq(parentGenes[1][geneIdx]),
                    `Unexpected gene created at geneIdx: ${geneIdx}`,
                );
        });

        it('Fail on single parent', async () => {
            const minterBreeding = await setupBreederContract();

            await expect(minterBreeding.breed(speciesId, [encodedParents[0]])).to.be.revertedWith(
                'Invalid number of parents!',
            );
        });

        it('Test Cooldown', async () => {
            const minterBreeding = await setupBreederContract();

            // Breed our first specimen
            await minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]]);
            // Second should fail (parents on cooldown)
            await expect(minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]])).to.be.revertedWith(
                'NFT currently on cooldown!',
            );
        });

        it('Does not own parent NFT', async () => {
            const minterBreeding = await setupBreederContract();

            await expect(
                minterBreeding.connect(user).breed(speciesId, [encodedParents[2], encodedParents[3]]),
            ).to.be.revertedWith('You must own all parents!');
        });

        it('Set Required Parents', async () => {
            const minterBreeding = await setupBreederContract();
            await minterBreeding.setBreedingRules(speciesId, 3, 0, genes, []);
            // Breed w/ 3 parents
            await minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1], encodedParents[2]]);
        });

        it('Set breeding cooldown', async () => {
            const minterBreeding = await setupBreederContract();
            const cooldownSeconds = 1;
            await minterBreeding.setBreedingRules(speciesId, 0, cooldownSeconds, genes, []);

            // Breed our second specimen w/ cooldown
            await minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]]);
            // Allow cooldown to wear off
            await sleep(2000);
            // Cooldown now off
            await minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]]);
        });

        it('Breed with Mutations', async () => {
            const minterBreeding = await setupBreederContract();
            // Set mutation rules
            const mutationRates = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ of genes) mutationRates.push(toBN(2).pow(toBN(256)).sub(1)); //every gene has 100% chance to mutate
            // Set mutations
            await minterBreeding.setBreedingRules(speciesId, 0, 0, genes, mutationRates);

            // Breed
            await minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]]);

            // Make sure we called our mutation function
            const newSpecimen = await getLastBredSpeciesId(minterBreeding);
            const newSpecimenDNA = decodeGenesUint256(newSpecimen, genes);
            // Assert our first gene is a mutation (mutation function called)
            // Note mutation testing is done in `RosalindDNA.test.ts`
            assert.isFalse(
                newSpecimenDNA[0].eq(parentGenes[0][0]) ||
                    newSpecimenDNA[0].eq(parentGenes[1][0]) ||
                    newSpecimenDNA[0].eq(parentGenes[2][0]),
            );
        });
    });

    async function setupBreederContract() {
        // Deploy contracts
        const minterSimple = await MinterSimpleFactory.deploy();
        const minterBreeding = await MinterBreedingFactory.deploy();
        const nft = await FactoryERC721.deploy('NFT', 'NFT');
        const erc20 = await FactoryERC20.deploy('0', 'ERC20', 'ERC20');
        await Promise.all([minterSimple.deployed(), minterBreeding.deployed(), nft.deployed(), erc20.deployed()]);

        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer.address;
        const mintFeeAmount = 10;

        // Create species
        await minterSimple.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);
        await minterBreeding.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer(s)
        await erc20.increaseAllowance(minterSimple.address, 10000);
        await erc20.increaseAllowance(minterBreeding.address, 10000);

        // Generate encoded parents
        for (const parent of encodedParents) await minterSimple.safeMint(speciesId, parent);

        // Set our gene pattern
        await minterBreeding.setBreedingRules(
            speciesId, // speciesId
            0, // requiredParents (default to 0)
            0, // breedCooldownSeconds (defaults to 7 days)
            genes, // gene encoding placements
            [], // mutation rates (defaults to none)
        );

        return minterBreeding;
    }

    async function getLastBredSpeciesId(minterBreeding: MinterBreeding) {
        // @ts-ignore
        const filter = minterBreeding.filters.MintSpecies();
        // @ts-ignore
        const newSpecimen = (await minterBreeding.queryFilter(filter))[0].args.tokenId;
        return newSpecimen;
    }
});
