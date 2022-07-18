import { BigNumber } from 'ethers';

export function encodeGenesUint256(values: (string | BigNumber | number)[], genes: number[]): BigNumber {
    let encodedGenes = BigNumber.from(0);

    // Check value/gene lengths
    if (values.length != genes.length) throw 'mismatching values/genes length!';

    for (let geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Type checks
        let geneValue = values[geneIdx];
        if (typeof geneValue == 'string' || typeof geneValue == 'number') geneValue = BigNumber.from(geneValue);

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

export function decodeGenesUint256(dna: BigNumber | string | number, genes: number[]) {
    // Type checks
    if (typeof dna == 'string' || typeof dna == 'number') dna = BigNumber.from(dna);

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
