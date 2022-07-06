//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../../assets/ERC721/ERC721OwlAttributes.sol';
import 'hardhat/console.sol';

/**
 * @dev Basic crafting structures used through NFTCrafting contracts.
 *
 */
library TransformerLib {
    // Recipe Components

    /**
     * @dev Allows for specification of what happens to input ingredients after craft is complete
     * @param unaffected inputs of this type are unaffected by the crafting process
     * @param burned inputs of this type are burned during the crafting process
     * @param locked inputs of this type are locked into the contract during the crafting process
     * @param NTime inputs of this type are not burned, but can only be used N times in the same recipe
     */
    enum ConsumableType {
        unaffected,
        burned,
        locked,
        NTime
    }
    /**
     * @custom:enum Allows for specification of what happens to input ingredients after craft is complete
     */
    enum TokenType {
        erc20,
        erc721,
        erc1155
    }

    struct Ingredient {
        TokenType token;
        ConsumableType consumableType;
        address contractAddr;
        uint256[] amounts;
        uint256[] tokenIds;
    }

    enum GeneTransformType {
        none,
        add,
        sub,
        mult,
        set
        // ,
        // random
    }

    // defines specification of how a specific gene is transformed
    struct GeneMod {
        GeneTransformType geneTransformType;
        uint256 value;
    }

    function transform(
        uint256 tokenId,
        uint256 currDna,
        uint8[] memory genes,
        TransformerLib.GeneMod[] memory modifications
    ) internal returns (uint256 newDna) {
        for (uint16 geneIdx = 0; geneIdx < genes.length; geneIdx++) {
            // Gene details
            uint16 geneStartIdx = genes[geneIdx];
            uint16 geneEndIdx = geneIdx < genes.length - 1 ? genes[geneIdx + 1] : 256;

            uint256 bitmask = get256Bitmask(geneStartIdx, geneEndIdx);
            uint256 gene = (currDna & bitmask) >> geneStartIdx;

            uint256 maxBits = geneEndIdx - geneStartIdx;

            GeneMod memory currMod = modifications[geneIdx];
            if (currMod.geneTransformType == GeneTransformType.add) {
                uint256 sum = gene + currMod.value;
                if (sum > 2**maxBits - 1) gene = 2**maxBits - 1;
                else gene = sum;
            } else if (currMod.geneTransformType == GeneTransformType.sub) {
                if (currMod.value > gene) gene = 0;
                else gene = gene - currMod.value;
            } else if (currMod.geneTransformType == GeneTransformType.mult) {
                uint256 prod = gene * currMod.value;
                if (prod > 2**maxBits - 1) gene = 2**maxBits - 1;
                else gene = prod;
            } else if (currMod.geneTransformType == GeneTransformType.set) {
                gene = currMod.value;
            }

            gene = gene << geneStartIdx;

            newDna = newDna | gene;
        }
    }

    /**
     * @dev Generates a 256-bit bitmask from startBit:endBit
     * @param startBit beginning of mask
     * @param endBit end of mask
     * @return bitMask combined bitmask
     */
    function get256Bitmask(uint16 startBit, uint16 endBit) internal pure returns (uint256 bitMask) {
        uint256 bitMaskStart = type(uint256).max << startBit;
        uint256 bitMaskEnd = type(uint256).max >> (256 - endBit);
        bitMask = bitMaskStart & bitMaskEnd;
    }
}
