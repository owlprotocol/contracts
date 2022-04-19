import { toBN } from 'web3-utils';

export function encodeGenesUint256(values: (string | BN | number)[], genes: number[]): BN {
    let encodedGenes = toBN(0);

    // Check value/gene lengths
    if (values.length != genes.length) throw 'mismatching values/genes length!';

    for (let geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Type checks
        let geneValue = values[geneIdx];
        if (typeof geneValue == 'string' || typeof geneValue == 'number') geneValue = toBN(geneValue);

        // Calculate gene start
        const geneStartIdx = genes[geneIdx];

        // Check for overflows
        let geneEndIdx = 256;
        if (geneIdx < genes.length - 1)
            // If we're not on our last iteration, use the next value
            geneEndIdx = genes[geneIdx + 1];
        // Calculate our biggest possible value for this slot (2^n - 1)
        const geneSpace = toBN(2)
            .pow(toBN(geneEndIdx - geneStartIdx))
            .subn(1);
        //@ts-ignore
        if (geneSpace.lt(geneValue)) throw `Value: ${geneValue} too large for it's slot!`;

        // Perform bitwise left-shift on selectedGene
        const selectedGene = geneValue.shln(geneStartIdx);
        // Merge selected gene w/ our encoding
        //@ts-ignore
        encodedGenes = encodedGenes.or(selectedGene);
    }
    return encodedGenes;
}

export function decodeGenesUint256(dna: BN | string | number, genes: number[]) {
    // Type checks
    if (typeof dna == 'string' || typeof dna == 'number') dna = toBN(dna);

    const decodedGenes: BN[] = [];

    for (let geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Calculate gene start/end
        const geneStartIdx = genes[geneIdx];
        let geneEndIdx = 256;
        if (geneIdx < genes.length - 1)
            // If we're NOT at the end of array, grab the next gene ending value
            geneEndIdx = genes[geneIdx + 1];
        // Extract gene value
        let geneValue = dna.clone();
        if (geneEndIdx < 256)
            // Turn off all values past endIdx
            geneValue = geneValue.maskn(geneEndIdx);
        // Bitwise right-shift
        geneValue = geneValue.shrn(geneStartIdx);
        decodedGenes.push(geneValue);
    }
    return decodedGenes;
}
