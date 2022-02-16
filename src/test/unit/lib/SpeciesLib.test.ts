import { assert } from 'chai';
import { encodeGenesUint256, decodeGenesUint256 } from '../../../nft-launcher-lib/Species';
import { toBN } from 'web3-utils';

describe('Encoding/Decoding uint256 genes', function () {
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
});
