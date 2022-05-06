import { assert, expect } from 'chai';
import { encodeGenesUint256, decodeGenesUint256 } from '../../../src/nft-launcher-lib/Species';
import { BigNumber } from 'ethers';
const toBN = BigNumber.from;

describe('Species.ts', function () {
    it('Encode/decode values', async () => {
        // Encode the following values:
        const values = [toBN(255), toBN(65_535), toBN(0), toBN(1), toBN(100000)];
        const genePositions = [0, 8, 24, 32, 40];
        // Encode
        const encodedDna = encodeGenesUint256(values, genePositions);
        // Decode
        const decodedDna = decodeGenesUint256(encodedDna, genePositions);
        // Compare before/after
        for (let valueIdx = 0; valueIdx < values.length; valueIdx++)
            assert(decodedDna[valueIdx].eq(values[valueIdx]), `values at index ${valueIdx} not equal!`);
    });

    it('Test overflows values', async () => {
        // Encode the following values:
        encodeGenesUint256([255, 0], [0, 8]);
        expect(() => encodeGenesUint256([256, 0], [0, 8])).to.throw();

        // Test the end spacing
        encodeGenesUint256([0, toBN(2).pow(toBN(128)).sub(1)], [0, 128]);

        expect(() => encodeGenesUint256([0, toBN(2).pow(toBN(128))], [0, 128])).to.throw();
    });
});
