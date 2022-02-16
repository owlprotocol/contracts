import { assert } from 'chai';
import configureGanache from '../../../utils/configureGanache';
import setProvider from '../../../utils/setProvider';
import RosalindTestLabTruffle from '../../../truffle/RosalindTestLab';
import { encodeGenesUint256, decodeGenesUint256 } from '../../../nft-launcher-lib/Species';
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

        const offspringDNA = await dnaLib.breedDNASimple([parent1, parent2], genes, randomSeed);

        const offspringGenes = decodeGenesUint256(offspringDNA, genes);

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
    });
});
