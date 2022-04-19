import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configureGanache from '../../../src/utils/configureGanache';
import setProvider from '../../../src/utils/setProvider';
import MinterSimple from '../../../factory/truffle/MinterSimple';
import MinterBreeding from '../../../factory/truffle/MinterBreeding';
import FactoryERC20Truffle from '../../../factory/truffle/FactoryERC20';
import FactoryERC721Truffle from '../../../factory/truffle/FactoryERC721';
import { encodeGenesUint256, decodeGenesUint256 } from '../../../src/nft-launcher-lib/Species';
import { toBN } from 'web3-utils';
import sleep from '../../../src/utils/sleep';

chai.use(chaiAsPromised);
const { assert, expect } = chai;

describe('MinterBreeding tests', function () {
    let accounts: string[];
    let developer: string;
    let call;
    let minterSimple;
    let minterBreeding: any;
    let nft: any;
    let newSpecimen;
    let newSpecimenDNA;
    // Including lots of genes makes it unlikley that we'll be unlucky and
    // breed a new specimen exactly the same as an existing
    const speciesId = 1;
    const genes = [0, 20, 36, 40, 44, 48, 52, 56, 60];
    const baseParentGenes = [1024, 256, 0, 0, 0, 0, 0, 0, 0];
    const parentGenes: number[][] = [];
    const encodedParents: BN[] = [];
    const numParents = 5;

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([MinterSimple], config.provider, accounts[0]);
        setProvider([MinterBreeding], config.provider, accounts[0]);
        setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
        setProvider([FactoryERC721Truffle], config.provider, accounts[0]);

        developer = accounts[2];

        // Generate parents w incrementing values from baseParentGenes
        for (let i = 0; i < numParents; i++) parentGenes.push(baseParentGenes.map((v) => v + i));

        // Create encodings
        for (const parent of parentGenes) encodedParents.push(encodeGenesUint256(parent, genes));
    });

    beforeEach(async () => {
        // Use MinterSimple to create our parent species
        minterSimple = await MinterSimple.new();
        // Use MinterRandom to breed
        minterBreeding = await MinterBreeding.new();

        nft = await FactoryERC721Truffle.new('NFT', 'NFT');
        const erc20 = await FactoryERC20Truffle.new('0', 'ERC20', 'ERC20');
        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer;
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
    });

    it('MinterBreeding simple breeder testing', async () => {
        // Break breeding w one parent (breaks 2 parent rule)
        call = minterBreeding.breed(speciesId, [encodedParents[0]], { gas: 3000000 });
        expect(call).eventually.to.rejectedWith(Error);

        // Breed our first specimen
        await minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]], { gas: 3000000 });
        assert((await minterBreeding.getPastEvents('MintSpecies'))[0].returnValues.tokenId);
        // Make sure we called our simple breed function (no mutation)
        newSpecimen = (await minterBreeding.getPastEvents('MintSpecies'))[0].returnValues.tokenId;
        newSpecimenDNA = decodeGenesUint256(newSpecimen, genes);
        // Assert our first gene is from one of our parents (mutation function not called)
        // Note mutation testing is done in `RosalindDNA.test.ts`
        // For every value, make sure it's coming from a parent
        for (let geneIdx = 0; geneIdx < parentGenes[0].length; geneIdx++)
            assert(
                newSpecimenDNA[geneIdx].eqn(parentGenes[0][geneIdx]) ||
                    newSpecimenDNA[geneIdx].eqn(parentGenes[1][geneIdx]),
                `Unexpected gene created at geneIdx: ${geneIdx}`,
            );

        // test breedCooldownSeconds
        call = minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]], { gas: 3000000 });
        expect(call).eventually.to.rejectedWith(Error);

        // test not owner of parents
        call = minterBreeding.breed(speciesId, [encodedParents[2], encodedParents[3]], {
            from: developer,
            gas: 3000000,
        });
        expect(call).eventually.to.rejectedWith(Error);
    });

    it('MinterBreeding mutation breeding testing', async () => {
        // Set mutation rules
        const mutationRates = [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of genes) mutationRates.push(toBN(2).pow(toBN(256)).subn(1)); //every gene has 100% chance to mutate
        await minterBreeding.setBreedingRules(
            speciesId, // speciesId
            3, // requiredParents (default to 0)
            1, // breedCooldownSeconds (defaults to 7 days)
            genes, // gene encoding placements
            mutationRates, // mutation rates (defaults to none)
        );

        // Allow cooldown to wear off
        await sleep(1500);

        // Break breeding w 2 parents (breaks 3 parent rule)
        call = minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1]], { gas: 3000000 });
        expect(call).eventually.to.rejectedWith(Error);

        // Breed our second specimen w/ cooldown
        await minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1], encodedParents[2]], {
            gas: 3000000,
        });
        // Make sure we called our mutation function
        newSpecimen = (await minterBreeding.getPastEvents('MintSpecies'))[0].returnValues.tokenId;
        newSpecimenDNA = decodeGenesUint256(newSpecimen, genes);
        // Assert our first gene is a mutation (mutation function called)
        // Note mutation testing is done in `RosalindDNA.test.ts`
        assert.isFalse(
            newSpecimenDNA[0].eqn(parentGenes[0][0]) ||
                newSpecimenDNA[0].eqn(parentGenes[1][0]) ||
                newSpecimenDNA[0].eqn(parentGenes[2][0]),
        );

        // Test cooldown now active
        call = minterBreeding.breed(speciesId, [encodedParents[0], encodedParents[1], encodedParents[2]], {
            gas: 3000000,
        });
        expect(call).eventually.to.rejectedWith(Error);
    });

    it('MinterBreeding BreedingRules configuration', async () => {
        const mutate100 = toBN(2).pow(toBN(256)).subn(1);
        const mutate50 = toBN(2).pow(toBN(255)).subn(1);

        // Set mutation rules
        let mutationRates = [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of genes) mutationRates.push(mutate100); //every gene has 100% chance to mutate
        await minterBreeding.setBreedingRules(
            speciesId, // speciesId
            0, // requiredParents (default to 0)
            0, // breedCooldownSeconds (defaults to 7 days)
            genes, // gene encoding placements
            mutationRates, // mutation rates (defaults to none)
        );
        let currentBreedingRules = await minterBreeding.getBreedingRules(speciesId);
        //@ts-ignore
        assert(currentBreedingRules.genes.length == genes.length, 'genes length not set correctly');
        //@ts-ignore
        assert(currentBreedingRules.mutationRates.length == mutationRates.length, 'mutation not set correctly');

        // Update mutation rates (shortened)
        let newGenes = [0, 8];
        mutationRates = [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of newGenes) mutationRates.push(mutate50); //every gene has 50% chance to mutate
        await minterBreeding.setBreedingRules(
            speciesId, // speciesId
            0, // requiredParents (default to 0)
            0, // breedCooldownSeconds (defaults to 7 days)
            newGenes, // gene encoding placements
            mutationRates, // mutation rates (defaults to none)
        );
        currentBreedingRules = await minterBreeding.getBreedingRules(speciesId);
        //@ts-ignore
        assert(currentBreedingRules.genes.length == newGenes.length, 'genes length not set correctly');
        //@ts-ignore
        assert(currentBreedingRules.mutationRates.length == mutationRates.length, 'mutation not set correctly');
        // Ensure values updated correctly + longer
        assert(
            //@ts-ignore
            currentBreedingRules.mutationRates.every((v) => toBN(v).eq(mutate50)),
            'values not updated!',
        );

        // Update mutation rates (lengthened)
        newGenes = [0, 8, 16, 32];
        mutationRates = [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of newGenes) mutationRates.push(mutate100); //every gene has 50% chance to mutate
        await minterBreeding.setBreedingRules(
            speciesId, // speciesId
            0, // requiredParents (default to 0)
            0, // breedCooldownSeconds (defaults to 7 days)
            newGenes, // gene encoding placements
            mutationRates, // mutation rates (defaults to none)
        );
        currentBreedingRules = await minterBreeding.getBreedingRules(speciesId);
        //@ts-ignore
        assert(currentBreedingRules.genes.length == newGenes.length, 'genes length not set correctly');
        //@ts-ignore
        assert(currentBreedingRules.mutationRates.length == mutationRates.length, 'mutation not set correctly');
        // Ensure values updated correctly + longer
        assert(
            //@ts-ignore
            currentBreedingRules.mutationRates.every((v) => toBN(v).eq(mutate100)),
            'values not updated!',
        );
    });
});
