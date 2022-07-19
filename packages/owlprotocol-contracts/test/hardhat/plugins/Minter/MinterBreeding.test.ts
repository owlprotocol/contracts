import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import { encodeGenesUint256, decodeGenesUint256, sleep, deployClone } from '../../utils';
import { BigNumber as BN } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    FactoryERC20__factory,
    MinterBreeding,
    MinterBreeding__factory,
    ERC721OwlAttributes,
    ERC721OwlAttributes__factory,
} from '../../../../typechain';
const toBN = BN.from;

describe('MinterBreeding.sol', function () {
    let MinterBreederFactory: MinterBreeding__factory;
    let ERC721OwlAttributesFactory: ERC721OwlAttributes__factory;
    let FactoryERC20: FactoryERC20__factory;

    let ERC721OwlAttributesImplementation: ERC721OwlAttributes;
    let BreederImplementation: MinterBreeding;

    let nftAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    // Including lots of genes makes it unlikley that we'll be unlucky and
    // breed a new specimen exactly the same as an existing
    const genes = [0, 8, 36, 40, 44, 48, 52, 56, 60];
    const baseParentGenes = [1, 100, 5, 0, 0, 0, 0, 0, 0];
    const parentGenes: number[][] = [];
    const encodedParents: BN[] = [];
    const parentIds: number[] = [];
    const numParents = 5;
    const defaultGenerationMultiplier = 0;

    before(async () => {
        // Deploy contracts
        MinterBreederFactory = (await ethers.getContractFactory('MinterBreeding')) as MinterBreeding__factory;
        ERC721OwlAttributesFactory = (await ethers.getContractFactory(
            'ERC721OwlAttributes',
        )) as ERC721OwlAttributes__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;

        [owner, user, burnAddress] = await ethers.getSigners();

        BreederImplementation = await MinterBreederFactory.deploy();
        ERC721OwlAttributesImplementation = await ERC721OwlAttributesFactory.deploy();

        await Promise.all([BreederImplementation.deployed(), ERC721OwlAttributesImplementation.deployed()]);

        // Generate parents w incrementing values from baseParentGenes
        for (let i = 0; i < numParents; i++) parentGenes.push(baseParentGenes.map((v) => v + i));

        // Create encodings
        for (const parent of parentGenes) encodedParents.push(encodeGenesUint256(parent, genes));

        // Range loop ids (5 parents) [1,2,3,4,5]
        for (let i = 0; i < numParents; i++) parentIds.push(i);
    });

    describe('MinterBreeding.breed(...)', async () => {
        it('Breed Specimen', async () => {
            const minterBreeding = await setupBreederContract();

            // Breed our first specimen
            await minterBreeding.breed([parentIds[0], parentIds[1]]);

            // Make sure we called our simple breed function (no mutation)
            const { dna } = await getLastBred(minterBreeding);
            const newSpecimenDNA = decodeGenesUint256(dna, genes);

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

            await expect(minterBreeding.breed([parentIds[0]])).to.be.revertedWith('Invalid number of parents!');
        });

        it('Test Cooldown', async () => {
            const minterBreeding = await setupBreederContract();

            // Breed our first specimen
            await minterBreeding.breed([parentIds[0], parentIds[1]]);
            // Second should fail (parents on cooldown)
            await expect(minterBreeding.breed([parentIds[0], parentIds[1]])).to.be.revertedWith(
                'NFT currently on cooldown!',
            );
        });

        it('Does not own parent NFT', async () => {
            const minterBreeding = await setupBreederContract();

            await expect(minterBreeding.connect(user).breed([parentIds[2], encodedParents[3]])).to.be.revertedWith(
                'You must own all parents!',
            );
        });

        it('Set Required Parents', async () => {
            const minterBreeding = await setupBreederContract();
            await minterBreeding.setBreedingRules(3, defaultGenerationMultiplier, 0, genes, []);
            // Breed w/ 3 parents
            await minterBreeding.breed([parentIds[0], parentIds[1], parentIds[2]]);
        });

        it('Set breeding cooldown', async () => {
            const minterBreeding = await setupBreederContract();
            const cooldownSeconds = 1;
            await minterBreeding.setBreedingRules(0, defaultGenerationMultiplier, cooldownSeconds, genes, []);

            // Breed our second specimen w/ cooldown
            await minterBreeding.breed([parentIds[0], parentIds[1]]);
            // Allow cooldown to wear off
            await sleep(2000);
            // Cooldown now off
            await minterBreeding.breed([parentIds[0], parentIds[1]]);
        });

        it('Breed with Mutations', async () => {
            const minterBreeding = await setupBreederContract();
            // Set mutation rules
            const mutationRates = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ of genes) mutationRates.push(toBN(2).pow(toBN(256)).sub(1)); //every gene has 100% chance to mutate
            // Set mutations
            await minterBreeding.setBreedingRules(0, defaultGenerationMultiplier, 0, genes, mutationRates);

            // Breed
            await minterBreeding.breed([parentIds[0], parentIds[1]]);

            // Make sure we called our mutation function
            const { dna } = await getLastBred(minterBreeding);
            const newSpecimenDNA = decodeGenesUint256(dna, genes);
            // Assert our first gene is a mutation (mutation function called)
            // Note mutation testing is done in `RosalindDNA.test.ts`
            const geneSlot = 1;
            assert.isFalse(
                newSpecimenDNA[0].eq(parentGenes[0][geneSlot]) ||
                newSpecimenDNA[0].eq(parentGenes[1][geneSlot]) ||
                newSpecimenDNA[0].eq(parentGenes[2][geneSlot]),
            );
        });

        it('Enable generation counter', async () => {
            const minterBreeding = await setupBreederContract();

            // Enable generation counting
            await minterBreeding.setBreedingRules(
                0, // requiredParents (default to 0)
                1, // enable 1x multiplier
                0, // breedCooldownSeconds (defaults to 7 days)
                genes, // gene encoding placements
                [], // mutation rates (defaults to none)
            );

            // Breed our first specimen
            await minterBreeding.breed([parentIds[0], parentIds[4]]);

            // Make sure we called our simple breed function (no mutation)
            const { dna } = await getLastBred(minterBreeding);

            const newSpecimenDNA = decodeGenesUint256(dna, genes);
            expect(newSpecimenDNA[0]).to.equal(6);
        });

        it('Enable generational cooldowns', async () => {
            const minterBreeding = await setupBreederContract();

            // Enable generation counting
            await minterBreeding.setBreedingRules(
                0, // requiredParents (default to 0)
                1, // enable 1x multiplier
                1, // breedCooldownSeconds (defaults to 7 days)
                genes, // gene encoding placements
                [], // mutation rates (defaults to none)
            );

            // Breed our first specimen
            await minterBreeding.breed([parentIds[0], parentIds[1]]);

            // Sleep off first cooldown
            await sleep(2500);

            // Grab specimen data, breed w/ first parent
            const { tokenId } = await getLastBred(minterBreeding);
            await minterBreeding.breed([parentIds[0], tokenId]);

            // Same cooldown length
            await sleep(2500);

            // newSpecimen now on cooldown
            await expect(minterBreeding.breed([parentIds[0], tokenId])).to.be.revertedWith(
                'NFT currently on cooldown!',
            );
        });
    });

    async function setupBreederContract() {
        // Deploy contracts
        let address;
        ({ address } = await deployClone(ERC721OwlAttributesImplementation, [
            owner.address,
            'owltest',
            'owl',
            'abcd',
            '0x' + '0'.repeat(40),
        ]));
        const nft = (await ethers.getContractAt('ERC721OwlAttributes', address)) as ERC721OwlAttributes;

        const erc20 = await FactoryERC20.deploy('0', 'ERC20', 'ERC20');
        await erc20.deployed();

        nftAddress = nft.address;
        mintFeeToken = erc20.address;
        mintFeeAddress = burnAddress.address;
        mintFeeAmount = 10;

        ({ address } = await deployClone(BreederImplementation, [
            owner.address,
            // @ts-ignore
            mintFeeToken,
            // @ts-ignore
            mintFeeAddress,
            // @ts-ignore
            mintFeeAmount,
            nftAddress,
            {
                requiredParents: 0, // requiredParents (default to 2)
                generationCooldownMultiplier: defaultGenerationMultiplier,
                breedCooldownSeconds: 0, // breedCooldownSeconds (defaults to 7 days)
                genes, // gene encoding placements
                mutationRates: [], // mutation rates (defaults to none)
            },
            '0x' + '0'.repeat(40), // trusted forwarder
        ]));

        const minterBreeding = (await ethers.getContractAt('MinterBreeding', address)) as MinterBreeding;

        // Auth minting
        await nft.grantMinter(minterBreeding.address);

        // Authorize transfer(s)
        await erc20.increaseAllowance(minterBreeding.address, 10000);

        // Generate encoded parents [will be ids: parentIds]
        for (const parent of encodedParents) await nft.safeMint(owner.address, parent);

        // Set our gene pattern
        await minterBreeding.connect(owner).setBreedingRules(
            0, // requiredParents (default to 2)
            defaultGenerationMultiplier,
            0, // breedCooldownSeconds (defaults to 7 days)
            genes, // gene encoding placements
            [], // mutation rates (defaults to none)
        );

        return minterBreeding;
    }

    async function getLastBred(minterBreeding: MinterBreeding) {
        // Grab ERC721
        const nftAddr = await minterBreeding.nftContractAddr();
        const nft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;

        // Get Event
        const filter = nft.filters.Transfer();
        const events = await nft.queryFilter(filter);
        const newSpecimen = events[events.length - 1].args.tokenId;

        // Grab it's dna
        const dna = await nft.getDna(newSpecimen);

        return { tokenId: newSpecimen, dna };
    }
});
