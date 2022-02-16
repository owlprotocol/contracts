import { toBN } from 'web3-utils';

export function encodeGenesUint256(values: BN[], genes: number[]) {
    let encodedGenes = toBN(0);

    if (values.length != genes.length) throw 'mismatching values/genes length!';

    // TODO - reject oversized values.

    for (let geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Calculate gene start
        const geneStartIdx = genes[geneIdx];
        // Perform bitwise left-shift on selectedGene
        const selectedGene = values[geneIdx].shln(geneStartIdx);
        // Merge selected gene w/ our encoding
        encodedGenes = encodedGenes.or(selectedGene);
    }
    return encodedGenes;
}

export function decodeGenesUint256(dna: BN, genes: number[]) {
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
