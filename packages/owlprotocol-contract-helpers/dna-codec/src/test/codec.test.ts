import { BigNumber } from 'ethers';
import { assert, expect } from 'chai';
import { encodeGenesUint256, decodeGenesUint256, simpleEncoder, simpleDecoder } from '..';
const toBN = BigNumber.from;

describe('codec.ts', function () {
    describe('Low-level codec', () => {
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

    describe('Simplified codec', () => {
        let dna: BigNumber;

        // Test encode values
        const genes = [
            {
                maxValue: 1000,
                name: 'test',
            },
            {
                maxValue: 2_000_000,
                name: 'other',
            },
        ];

        const lowLevelDecode = [0, 10]; // boundaries to call decodeUint256

        const genDummyValues = () => genes.map((v) => BigNumber.from(v.maxValue).sub(1));

        it('simpleEncoder(...)', async () => {
            const dummyValues = genDummyValues();

            dna = simpleEncoder(genes, dummyValues);
            const dna2 = encodeGenesUint256(dummyValues, lowLevelDecode);

            expect(dna.eq(dna2), 'encodings not equal!');
        });

        it('simpleEncoder(...) over max values', async () => {
            expect(() => simpleEncoder(genes, [2000, 100])).to.throw();
        });

        it('simpleEncoder(...) bad lengths', async () => {
            expect(() => simpleEncoder(genes, [100, 100, 100])).to.throw();
        });

        it('simpleEncoder(...) not enough storage', async () => {
            const genesCustom = [
                ...genes,
                {
                    maxValue: BigNumber.from(2).pow(256).sub(1),
                    name: 'maxUint',
                },
            ];
            expect(() => simpleEncoder(genesCustom, [100, 100, 100])).to.throw();
        });

        it('simpleEncoder(...) default naming', async () => {
            const genesCustom = genes;
            //@ts-ignore
            genes[1] = {
                maxValue: 250,
            };
            const decoded = simpleDecoder(genesCustom, dna);
            expect(decoded['1'].eq(250));
        });

        it('simpleDecoder(...)', async () => {
            // Test decode values
            const decoded = Object.values(simpleDecoder(genes, dna));
            const decoded2 = decodeGenesUint256(dna, lowLevelDecode);
            for (let i = 0; i < decoded.length; i++) {
                expect(decoded[i].eq(decoded2[i]), `decoded @${i} wrong!`);
            }
        });
    });
});
