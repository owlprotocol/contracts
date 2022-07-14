# Transformer.sol

## How does it work?

The transformation mechanism allows game developers to specify recipes, like in the crafter mechanism, that will result in the modification of a given ERC-721's properties (specifically, their DNA). As an example, each ERC721OWL NFT has a DNA property - which can further be classified into a sequence of genes - that determines its unique attributes. By defining a recipe that specifies the ingredients needed to modify a ERC721OWL's genes, as well as the manner in which each gene will be modified, the game developer can create a system allowing for NFTs to be dynamically modified.

### Example

Suppose we had a 256-bit DNA. Let `genes` be the array [0, 64, 128, 192] - indicating there exist 4 genes (0-63, 64 - 127, 128 - 191, 192 - 255). `modifications` is an array of GeneMod structs ({GeneTransformType, value} - where GeneTransformType represents the type of modification done to the gene in question while value represents the amount of modification, so {add, 5} would represent adding 5 to the gene).

Let's say we were working with a gene represented by the 2-bit number `10`. If our modification for this gene was to add 1, our transformed gene would be `11`.

Our implementation prevents genes from overflowing and underflowing into other genes. For example, adding `2` to `10` would cap the resulting gene at `11` instead of reaching `100`. This logic applies to all operations, including set.
