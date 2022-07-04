import { encodeGenesUint256, decodeGenesUint256 } from '../../../../src/nft-launcher-lib/Species';
import { BigNumber } from 'ethers';
import { assert, expect } from 'chai';
import { ethers } from 'hardhat';
import { RosalindTestLab__factory } from '../../../../typechain';

const toBN = BigNumber.from;

describe('RosalindDNA.sol', async () => {
    let dnaLibFactory: RosalindTestLab__factory;
    let dnaLib: any;

    // WARNING -> Our assertions use THIS random seed to ensure mutations occur!
    // Changing that value COULD break these tests (if you're unlucky!).
    const randomSeed = '1234';
    const genes = [0, 8, 24, 40, 48];
    const parent1Genes = [255, 65_535, 10, 0, 100_000];
    const parent2Genes = [100, 30_000, 5, 2, 200_000];
    const parent3Genes = [0, 15_000, 25, 3, 300_000];
    const parent1 = encodeGenesUint256(parent1Genes, genes);
    const parent2 = encodeGenesUint256(parent2Genes, genes);
    const parent3 = encodeGenesUint256(parent3Genes, genes);

    before(async () => {
        dnaLibFactory = await ethers.getContractFactory('RosalindTestLab');

        // Since all functions are pure, we don't need to worry
        // about deploying multiple contracts (w/ parallel testing)
        dnaLib = await dnaLibFactory.deploy();
        await dnaLib.deployed();
    });

    describe('RosalindDNA.breedDNASimple(...)', async () => {
        it('2 Parents', async () => {
            const offspringDNA = await dnaLib.breedDNASimple([parent1, parent2], genes, randomSeed);
            const offspringGenes = decodeGenesUint256(offspringDNA, genes);

            // For every value, make sure it's coming from a parent
            for (let geneIdx = 0; geneIdx < parent1Genes.length; geneIdx++)
                assert(
                    offspringGenes[geneIdx].eq(parent1Genes[geneIdx]) ||
                        offspringGenes[geneIdx].eq(parent2Genes[geneIdx]),
                    `Unexpected gene created at geneIdx: ${geneIdx}`,
                );

            // Make sure they're not ALL coming from parent1
            assert(
                !offspringGenes.every((gene, index) => gene.eq(parent1Genes[index])),
                'Every gene in offspring orginiating from parent1!',
            );
            // Make sure they're not ALL coming from parent2
            assert(
                !offspringGenes.every((gene, index) => gene.eq(parent2Genes[index])),
                'Every gene in offspring orginiating from parent1!',
            );
        });

        it('3 Parents', async () => {
            const offspringDNA = await dnaLib.breedDNASimple([parent1, parent2, parent3], genes, randomSeed);
            const offspringGenes = decodeGenesUint256(offspringDNA, genes);

            // Make sure parent3 introduces to new specimen
            assert(
                offspringGenes.some((gene, index) => gene.eq(parent3Genes[index])),
                'parent3 not added to new specimen!',
            );
        });
    });

    describe('RosalindDNA.breedDNAWithMutations(...)', async () => {
        const mutationRates = [
            toBN(0), // 0% chance to mutate
            toBN(2).pow(254).sub(1), // 25% chance to mutate
            toBN(2).pow(255).sub(1), // 50% chance to mutate
            toBN(2) // 75% chance to mutate
                .pow(255) // 255^2...
                .add(
                    toBN(2)
                        .pow(254) // + 254^2...
                        .sub(1),
                ), // -1
            toBN(2).pow(toBN(256)).sub(1), // 100% chance to mutate
        ];

        it('Mutations exist', async () => {
            //@ts-ignore
            const offspringDNA = await dnaLib.breedDNAWithMutations(
                [parent1, parent2],
                genes,
                randomSeed,
                mutationRates,
            );

            const offspringGenes = decodeGenesUint256(offspringDNA, genes);

            // Make sure some values are not coming from parent1 or parent2
            assert(
                !offspringGenes.every((gene, index) => gene.eq(parent1Genes[index]) || gene.eq(parent2Genes[index])),
                'Every gene in offspring orginiating from parent1 or parent2! (no mutations occured)',
            );
        });

        it('First mutates 0%', async () => {
            //@ts-ignore
            const mutatedDNA = await dnaLib.generateMutations(parent1, genes, randomSeed, mutationRates);
            const mutatedGenes = decodeGenesUint256(mutatedDNA, genes);

            // First gene should never mutate
            assert(mutatedGenes[0].eq(parent1Genes[0]), 'unexpected gene mutations');
        });

        it('Last mutates 100%', async () => {
            //@ts-ignore
            const mutatedDNA = await dnaLib.generateMutations(parent1, genes, randomSeed, mutationRates);
            const mutatedGenes = decodeGenesUint256(mutatedDNA, genes);

            // Last gene should always mutated
            assert.isFalse(mutatedGenes[4].eq(parent1Genes[4]), 'expected dna mutation');
        });
    });

    describe('RosalindDNA.breedDNAGenCount(...)', async () => {
        it('Increment on next generation', async () => {
            const parent2Age = parent2Genes[0]; // 100
            const parent3Age = parent3Genes[0]; // 0

            let offspringDNA = await dnaLib.breedDNASimple([parent2, parent3], genes, randomSeed);

            // Set generation
            offspringDNA = await dnaLib.breedDNAGenCount(offspringDNA, [parent2, parent3]);
            const offspringGenes = decodeGenesUint256(offspringDNA, genes);

            // Assert generation == 3
            const nextGeneration = Math.max(parent2Age, parent3Age) + 1; // 101
            assert.isTrue(offspringGenes[0].eq(nextGeneration), 'offspring generation not incremented!');
        });

        it('Throw on last generation', async () => {
            const offspringDNA = await dnaLib.breedDNASimple([parent1, parent2], genes, randomSeed);

            // Set generation (should fail, parent1 is 255 generation already)
            await expect(dnaLib.breedDNAGenCount(offspringDNA, [parent1, parent2])).to.be.revertedWith(
                'Max generation reached!',
            );
        });
    });
});
