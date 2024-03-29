import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import { encodeGenesUint256, decodeGenesUint256, sleep, deployClone, predictDeployClone } from '../../utils';
import { BigNumber as BN } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    FactoryERC20__factory,
    MinterBreeding,
    MinterBreeding__factory,
    ERC721OwlAttributes,
    ERC721OwlAttributes__factory,
    UpgradeableBeaconInitializable__factory,
    UpgradeableBeaconInitializable,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
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
    const defaultRequiredParents = 2;
    const defaultBreedingCooldownSeconds = 604800; // 7 days

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

        it('Safe Breed Specimen', async () => {
            const minterBreeding = await setupBreederContract();

            // Breed our first specimen
            await minterBreeding.safeBreed([parentIds[0], parentIds[1]]);

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

        it('Fail on same parents', async () => {
            const minterBreeding = await setupBreederContract();

            await expect(minterBreeding.breed([parentIds[0], parentIds[0]])).to.be.revertedWith(
                'NFT currently on cooldown!',
            );
        });

        it('No space for generations', async () => {
            const minterBreeding = await setupBreederContract();

            await expect(
                minterBreeding.setBreedingRules(defaultRequiredParents, 1, defaultBreedingCooldownSeconds, genes, []),
            ).to.be.revertedWith('Generations requires gene[0]=8');
        });

        it('No genes specified', async () => {
            const minterBreeding = await setupBreederContract();

            await expect(
                minterBreeding.setBreedingRules(defaultRequiredParents, 1, defaultBreedingCooldownSeconds, [], []),
            ).to.be.revertedWith('At least one gene must be specified!');
        });

        it('Wrong mutation rates', async () => {
            const minterBreeding = await setupBreederContract();

            await expect(
                minterBreeding.setBreedingRules(
                    defaultRequiredParents,
                    defaultGenerationMultiplier,
                    defaultBreedingCooldownSeconds,
                    genes,
                    [1],
                ),
            ).to.be.revertedWith('Mutation rates must be 0 or equal genes.length');
        });

        it('Clear old mutation rates', async () => {
            const minterBreeding = await setupBreederContract();

            const mutationRates = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ of genes) mutationRates.push(toBN(2).pow(toBN(256)).sub(1)); //every gene has 100% chance to mutate

            await minterBreeding.setBreedingRules(
                defaultRequiredParents,
                defaultGenerationMultiplier,
                defaultBreedingCooldownSeconds,
                genes,
                mutationRates,
            );

            const genes2 = genes.slice(1);
            const mutationRates2 = mutationRates.slice(1);
            const mutationRates2Length = mutationRates2.length;
            await minterBreeding.setBreedingRules(
                defaultRequiredParents,
                defaultGenerationMultiplier,
                defaultBreedingCooldownSeconds,
                genes2,
                mutationRates2,
            );

            const storedMutationRates = (await minterBreeding.getBreedingRules())[4];
            expect(mutationRates2Length, 'previous rates not deleted!').equals(storedMutationRates.length);
        });

        it('NFT on Cooldown', async () => {
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
            await minterBreeding.setBreedingRules(
                defaultRequiredParents,
                defaultGenerationMultiplier,
                cooldownSeconds,
                genes,
                [],
            );

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
            await minterBreeding.setBreedingRules(
                defaultRequiredParents,
                defaultGenerationMultiplier,
                defaultBreedingCooldownSeconds,
                genes,
                mutationRates,
            );

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

            // Slice off [0, ...] for generation storage
            const generationGenes = genes.slice(1);

            // Enable generation counting
            await minterBreeding.setBreedingRules(
                defaultRequiredParents, // requiredParents (default to 0)
                1, // enable 1x multiplier
                defaultBreedingCooldownSeconds, // breedCooldownSeconds (defaults to 7 days)
                generationGenes, // gene encoding placements
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

            // Slice off [0, ...] for generation storage
            const generationGenes = genes.slice(1);

            // Enable generation counting
            await minterBreeding.setBreedingRules(
                defaultRequiredParents, // requiredParents (default to 0)
                1, // enable 1x multiplier
                1, // breedCooldownSeconds (1 sec)
                generationGenes, // gene encoding placements
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

        it('Get breeding rules', async () => {
            const minterBreeding = await setupBreederContract();

            // Enable generation counting
            await minterBreeding.setBreedingRules(
                3, // requiredParents (default to 0)
                0, // enable 1x multiplier
                2, // breedCooldownSeconds (defaults to 7 days)
                genes, // gene encoding placements
                [], // mutation rates (defaults to none)
            );

            const rules = await minterBreeding.getBreedingRules();
            expect(rules[0] === 3);
            expect(rules[1] === 1);
            expect(rules[2].eq(2));
            expect(rules[3]).to.deep.equal(genes);
            expect(rules[4]).to.deep.equal([]);
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
            owner.address,
            0
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
                requiredParents: 2, // requiredParents (default to 2)
                generationCooldownMultiplier: defaultGenerationMultiplier,
                breedCooldownSeconds: 1, // breedCooldownSeconds (defaults to 7 days)
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

        // // Set our gene pattern
        // await minterBreeding.connect(owner).setBreedingRules(
        //     0, // requiredParents (default to 2)
        //     defaultGenerationMultiplier,
        //     0, // breedCooldownSeconds (defaults to 7 days)
        //     genes, // gene encoding placements
        //     [], // mutation rates (defaults to none)
        // );

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

    it('Beacon proxy initialization', async () => {
        const beaconFactory = (await ethers.getContractFactory(
            'UpgradeableBeaconInitializable',
        )) as UpgradeableBeaconInitializable__factory;
        const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

        const beaconProxyFactory = (await ethers.getContractFactory(
            'BeaconProxyInitializable',
        )) as BeaconProxyInitializable__factory;
        const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

        const { address: beaconAddr } = await deployClone(beaconImpl, [owner.address, BreederImplementation.address]);

        const args = [
            owner.address,
            owner.address, // mint fee token
            owner.address, // mint fee address
            1, // mint fee amount
            owner.address, // nft addr
            {
                requiredParents: 0, // requiredParents (default to 2)
                generationCooldownMultiplier: defaultGenerationMultiplier,
                breedCooldownSeconds: 0, // breedCooldownSeconds (defaults to 7 days)
                genes, // gene encoding placements
                mutationRates: [], // mutation rates (defaults to none)
            },
            ethers.constants.AddressZero, // trusted forwarder
        ];

        //@ts-ignore
        const data = BreederImplementation.interface.encodeFunctionData('proxyInitialize', args);
        const beaconProxyAddr = await predictDeployClone(beaconProxyImpl, [owner.address, beaconAddr, data]);

        await deployClone(beaconProxyImpl, [owner.address, beaconAddr, data]);
        const contract = (await ethers.getContractAt('MinterBreeding', beaconProxyAddr)) as MinterBreeding;

        await contract.breed(['000000000']);
    });
});
