import { assert } from 'chai';
import configureGanache from '../../../src/utils/configureGanache';
import setProvider from '../../../src/utils/setProvider';
import RosalindTestLabTruffle from '../../../factory/truffle/RosalindTestLab';
import { encodeGenesUint256, decodeGenesUint256 } from '../../../src/nft-launcher-lib/Species';
import { toBN } from 'web3-utils';

describe('Rosalind DNA Library', function () {
    let accounts: string[];

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([RosalindTestLabTruffle], config.provider, accounts[0]);
    });

    it('Rosalind Simple Breeding Algorithm', async () => {
        const dnaLib = await RosalindTestLabTruffle.new();
        const randomSeed = '1234';

        const genes = [0, 8, 24, 40, 48];
        const parent1Genes = [toBN(255), toBN(65_535), toBN(10), toBN(0), toBN(100_000)];
        const parent2Genes = [toBN(100), toBN(30_000), toBN(5), toBN(2), toBN(200_000)];
        const parent1 = encodeGenesUint256(parent1Genes, genes);
        const parent2 = encodeGenesUint256(parent2Genes, genes);

        let offspringDNA = await dnaLib.breedDNASimple([parent1, parent2], genes, randomSeed);

        let offspringGenes = decodeGenesUint256(offspringDNA, genes);

        // For every value, make sure it's coming from a parent
        for (let geneIdx = 0; geneIdx < parent1Genes.length; geneIdx++)
            assert(
                offspringGenes[geneIdx].eq(parent1Genes[geneIdx]) || offspringGenes[geneIdx].eq(parent2Genes[geneIdx]),
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

        // Try 3 parents
        const parent3Genes = [toBN(0), toBN(15_000), toBN(25), toBN(3), toBN(300_000)];
        const parent3 = encodeGenesUint256(parent3Genes, genes);

        offspringDNA = await dnaLib.breedDNASimple([parent1, parent2, parent3], genes, randomSeed);

        offspringGenes = decodeGenesUint256(offspringDNA, genes);

        // Make sure parent3 introduces to new specimen
        assert(
            offspringGenes.some((gene, index) => gene.eq(parent3Genes[index])),
            'parent3 not added to new specimen!',
        );
    });

    it('Rosalind Mutation Breeding Algorithm', async () => {
        const dnaLib = await RosalindTestLabTruffle.new();
        // WARNING -> Our assertions use THIS random seed to ensure mutations occur!
        // Changing that value COULD break these tests (if you're unlucky!).
        const randomSeed = '12345';

        const genes = [0, 8, 24, 40, 48];
        const parent1Genes = [toBN(255), toBN(65_535), toBN(10), toBN(0), toBN(100_000)];
        const parent2Genes = [toBN(100), toBN(30_000), toBN(5), toBN(2), toBN(200_000)];
        const parent1 = encodeGenesUint256(parent1Genes, genes);
        const parent2 = encodeGenesUint256(parent2Genes, genes);
        const mutationRates = [
            toBN(0), // 0% chance to mutate
            toBN(2).pow(toBN(254)).subn(1), // 25% chance to mutate
            toBN(2).pow(toBN(255)).subn(1), // 50% chance to mutate
            toBN(2) // 75% chance to mutate
                .pow(toBN(255)) // 255^2...
                .add(toBN(2).pow(toBN(254))) // + 254^2...
                .subn(1), // -1
            toBN(2).pow(toBN(256).subn(1)), // 100% chance to mutate
        ];

        //@ts-ignore
        const offspringDNA = await dnaLib.breedDNAWithMutations([parent1, parent2], genes, randomSeed, mutationRates);

        const offspringGenes = decodeGenesUint256(offspringDNA, genes);

        // Make sure some values are not coming from parent1 or parent2
        assert(
            !offspringGenes.every((gene, index) => gene.eq(parent1Genes[index]) || gene.eq(parent2Genes[index])),
            'Every gene in offspring orginiating from parent1 or parent2! (no mutations occured)',
        );
    });
});
