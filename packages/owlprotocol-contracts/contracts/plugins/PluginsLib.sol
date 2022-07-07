//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../assets/ERC721/ERC721OwlAttributes.sol';
import 'hardhat/console.sol';

/**
 * @dev Basic crafting structures used through NFTCrafting contracts.
 *
 */
library PluginsLib {
    // Recipe Components

    uint256 private constant ZERO = uint256(keccak256(abi.encode(0)));  // null pointer that is not zero

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
        uint256 currDna,
        uint8[] memory genes,
        PluginsLib.GeneMod[] memory modifications
    ) internal pure returns (uint256 newDna) {
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

    /**
     * @dev validates inputs array of ingredients
     * @param _inputs the inputted array to the Crafter initializer
     * @param inputs storage array of inputs, copied from _inputs
     * @param nUse mapping used to compute N-time validations
     */
    function validateInputs(Ingredient[] memory _inputs, Ingredient[] storage inputs, mapping(uint256 => uint256) storage nUse) internal {
        for (uint256 i = 0; i < _inputs.length; i++) {
            if (_inputs[i].token == PluginsLib.TokenType.erc20) {
                require(_inputs[i].tokenIds.length == 0, 'Transformer: tokenids.length != 0');
                require(_inputs[i].amounts.length == 1, 'Transformer: amounts.length != 1');
            } else if (_inputs[i].token == PluginsLib.TokenType.erc721) {
                //accept all token ids as inputs
                require(_inputs[i].tokenIds.length == 0, 'Transformer: tokenIds.length != 0');

                if (_inputs[i].consumableType == PluginsLib.ConsumableType.NTime) {
                    require(
                        _inputs[i].amounts.length == 1,
                        'Transformer: amounts.length != 1; required for NTime ConsumableType'
                    );
                    nUse[i] = _inputs[i].amounts[0];
                } else require(_inputs[i].amounts.length == 0, 'Transformer: amounts.length != 1 or 0');
            } else if (_inputs[i].token == PluginsLib.TokenType.erc1155) {
                require(
                    _inputs[i].tokenIds.length == _inputs[i].amounts.length,
                    'Transformer: tokenids.length != amounts.length'
                );
            }
            inputs.push(_inputs[i]);
        }
    }

    function arrayContains(uint256[] memory _input, uint256 num) internal returns (bool) {
        for (uint256 j = 0; j < _input.length; j++) 
            if (_input[j] == num) return true;
        return false; 
    }
}

