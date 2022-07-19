import { BigNumber, BigNumberish } from 'ethers';
import { BN } from 'bn.js';

export function encodeGenesUint256(values: BigNumberish[], genes: number[]) {
    let encodedGenes = BigNumber.from(0);

    // Check value/gene lengths
    if (values.length != genes.length) throw 'mismatching values/genes length!';

    for (let geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Type checks
        let geneValue = values[geneIdx];
        if (!BigNumber.isBigNumber(geneValue)) geneValue = BigNumber.from(geneValue);

        // Calculate gene start
        const geneStartIdx = genes[geneIdx];

        // Check for overflows
        let geneEndIdx = 256;
        if (geneIdx < genes.length - 1)
            // If we're not on our last iteration, use the next value
            geneEndIdx = genes[geneIdx + 1];
        // Calculate our biggest possible value for this slot (2^n - 1)
        const geneSpace = BigNumber.from(2)
            .pow(BigNumber.from(geneEndIdx - geneStartIdx))
            .sub(1);
        //@ts-ignore
        if (geneSpace.lt(geneValue)) throw `Value: ${geneValue} too large for it's slot!`;

        // Perform bitwise left-shift on selectedGene
        const selectedGene = geneValue.shl(geneStartIdx);
        // Merge selected gene w/ our encoding
        //@ts-ignore
        encodedGenes = encodedGenes.or(selectedGene);
    }
    return encodedGenes;
}

export function decodeGenesUint256(dna: BigNumberish, genes: number[]) {
    // Type checks
    if (!BigNumber.isBigNumber(dna)) dna = BigNumber.from(dna);

    const decodedGenes: BigNumber[] = [];

    for (let geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Calculate gene start/end
        const geneStartIdx = genes[geneIdx];
        let geneEndIdx = 256;
        if (geneIdx < genes.length - 1)
            // If we're NOT at the end of array, grab the next gene ending value
            geneEndIdx = genes[geneIdx + 1];
        // Extract gene value
        let geneValue = dna;
        if (geneEndIdx < 256)
            // Turn off all values past endIdx
            geneValue = geneValue.mask(geneEndIdx);
        // Bitwise right-shift
        geneValue = geneValue.shr(geneStartIdx);
        decodedGenes.push(geneValue);
    }
    return decodedGenes;
}

interface GeneKeys {
    name?: string;
    maxValue: BigNumberish;
}

export function simpleEncoder(genes: GeneKeys[], values: BigNumberish[]) {
    // Same length
    if (genes.length !== values.length) throw 'genes.length !== values.lenth';

    // Ensure value !> maxValue
    for (let i = 0; i < genes.length; i++)
        if (values[i] > genes[i].maxValue)
            throw `value (${values[i]}) passed at ${i} greater than maxValue (${genes[i].maxValue})`;

    // Calculate our gene slots
    const geneStorage = calculateValueSlots(genes);

    return encodeGenesUint256(values, geneStorage);
}

interface DecodedDna {
    [key: string]: BigNumber;
}

export function simpleDecoder(genes: GeneKeys[], dna: BigNumber) {
    // Calculate gene storage slows
    const geneStorage = calculateValueSlots(genes);

    // Decode
    const decodedDna = decodeGenesUint256(dna, geneStorage);

    const returnDna: DecodedDna = {};

    // Handle maxValue checks and take mod if needed.
    // Then turn into object
    for (let i = 0; i < decodedDna.length; i++) {
        const value = decodedDna[i];
        const max = genes[i].maxValue;
        // Take the mod if larger
        if (value.gt(max)) decodedDna[i] = value.mod(max);

        const name = (genes[i].name !== undefined ? genes[i].name : String(i)) as string;
        returnDna[name] = decodedDna[i];
    }

    return returnDna;
}

export function calculateValueSlots(genes: GeneKeys[]) {
    // Convert all to BigNumber, calculate the total max values we're storing
    const bnMaxValues = genes.map((key) => BigNumber.from(key.maxValue));
    const maxValueSlots = bnMaxValues.map((v) => nextBase2Ceil(v));

    // Ensure we're not passing 256 bits of storage
    const total = maxValueSlots.reduce((a, b) => a + b);
    if (total > 256) throw 'not enough storage space! Reduce max values!';

    // Generate gene boundaries (used by encodeUint256(...))
    let start = 0;
    const geneStorage = [0];
    for (let i = 0; i < genes.length; i++) {
        // For the last slot, fill in the rest of the storage
        if (i === genes.length - 1) {
            start += maxValueSlots[i];
            geneStorage.push(start);
        }
    }

    return geneStorage;
}

function nextBase2Ceil(n: BigNumber) {
    // https://github.com/ethers-io/ethers.js/issues/889#issuecomment-653830188
    // TODO - drop BN type and try just *4 (1 hex = 4 binary slots (except on the last one))
    // Convert to BN.js type
    const bnNum = new BN(n.toString());
    return bnNum.toString(2).length;
}
