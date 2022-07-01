

## RosalindDNA

_Library used for combining uint256-encoded genes
Named Rosalind after chemist
Rosalind Franklin who discovered double-helix and significantly
furthered our understanding of DNAs molecular structure._

### GENERATION_MASK

```solidity
uint256 GENERATION_MASK
```

### breedDNASimple

```solidity
function breedDNASimple(uint256[] parents, uint8[] genes, uint256 randomSeed) internal pure returns (uint256 childDNA)
```

_Breeds multiple parents DNA, returning a new combined_

| Name | Type | Description |
| ---- | ---- | ----------- |
| parents | uint256[] | N different parent DNAs |
| genes | uint8[] | start indicies of each gene. First index should ALWAYS be 0. Using [0, 128] splits the DNA into two genes of equal length |
| randomSeed | uint256 | random value to use for gene splicing |

| Name | Type | Description |
| ---- | ---- | ----------- |
| childDNA | uint256 | combined child DNA |

### breedDNAWithMutations

```solidity
function breedDNAWithMutations(uint256[] parents, uint8[] genes, uint256 randomSeed, uint256[] mutationRates) internal pure returns (uint256 childDNA)
```

_Breeds multiple parents DNA, returning a new combined DNA
Allows for random mutations to occur, producing random bits instead._

| Name | Type | Description |
| ---- | ---- | ----------- |
| parents | uint256[] | N different parent DNAs |
| genes | uint8[] | start indicies of each gene. First index should ALWAYS be 0. Using [0, 128] splits the DNA into two genes of equal length |
| randomSeed | uint256 | random value to use for gene splicing |
| mutationRates | uint256[] | probability that a random gene is picked vs. mutated. A higher mutation rate means a higher probability of having a random gene. The mutation rate m is a probability of m/(2^256-1) or in other words the probability that geneRandomnessSeed &lt;&#x3D; m. We therefore assign a mutated gene at the following rates according to m: 0 &#x3D; 000... &#x3D;&gt; 0% 2^254-1 &#x3D; 001... &#x3D;&gt; 25% 2^255-1 &#x3D; 011... &#x3D;&gt; 50% 2^255 + 2^254 -1 &#x3D;&gt; 75% 2^256-1 &#x3D; 111... &#x3D;&gt; 100% Always mutate Calculated probability as a function: 1/2^(256-m) |

| Name | Type | Description |
| ---- | ---- | ----------- |
| childDNA | uint256 | combined child DNA with mutations occuring. |

### generateMutations

```solidity
function generateMutations(uint256 dna, uint8[] genes, uint256 randomSeed, uint256[] mutationRates) internal pure returns (uint256 mutatedDNA)
```

_Mutates encoded DNA_

| Name | Type | Description |
| ---- | ---- | ----------- |
| dna | uint256 | existing DNA to mutate |
| genes | uint8[] | start indicies of each gene. First index should ALWAYS be 0. Using [0, 128] splits the DNA into two genes of equal length |
| randomSeed | uint256 | random value to use for gene splicing |
| mutationRates | uint256[] | probability that a random gene is picked vs. mutated. A higher mutation rate means a higher probability of having a random gene. The mutation rate m is a probability of m/(2^256-1) or in other words the probability that geneRandomnessSeed &lt;&#x3D; m. We therefore assign a mutated gene at the following rates according to m: 0 &#x3D; 000... &#x3D;&gt; 0% 2^254-1 &#x3D; 001... &#x3D;&gt; 25% 2^255-1 &#x3D; 011... &#x3D;&gt; 50% 2^255 + 2^254 -1 &#x3D;&gt; 75% 2^256-1 &#x3D; 111... &#x3D;&gt; 100% Always mutate Calculated probability as a function: 1/2^(256-m) |

| Name | Type | Description |
| ---- | ---- | ----------- |
| mutatedDNA | uint256 | combined child DNA with mutations occuring. |

### breedDNAGenCount

```solidity
function breedDNAGenCount(uint256 child, uint256[] parents) internal pure returns (uint256)
```

_Sets an offsprings generation (increases max parent +1)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| child | uint256 | child dna |
| parents | uint256[] | array of parent dna |

### getGenCount

```solidity
function getGenCount(uint256 child) internal pure returns (uint8)
```

_Gets the generation for a specimen_

| Name | Type | Description |
| ---- | ---- | ----------- |
| child | uint256 | child dna to read specimen age |

### get256Bitmask

```solidity
function get256Bitmask(uint16 startBit, uint16 endBit) internal pure returns (uint256 bitMask)
```

_Generates a 256-bit bitmask from startBit:endBit_

| Name | Type | Description |
| ---- | ---- | ----------- |
| startBit | uint16 | beginning of mask |
| endBit | uint16 | end of mask |

| Name | Type | Description |
| ---- | ---- | ----------- |
| bitMask | uint256 | combined bitmask |

