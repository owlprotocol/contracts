//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../assets/ERC721/ERC721OwlAttributes.sol';

/**
 * @dev Basic crafting structures used through NFTCrafting contracts.
 *
 */
library PluginsLib {

    event RouterError(uint256 indexed routeId, address indexed sender, bytes indexed data);

    /**
     * @dev Allows for specification of what happens to input ingredients after craft is complete
     * @param unaffected inputs of this type are unaffected by the crafting process. DOES NOT APPLY TO ERC 721 INPUTS, USE NTime INSTEAD.
     * @param burned inputs of this type are burned during the crafting process
     * @param NTime inputs of this type are not burned, but can only be used N times in the same recipe
     */
    enum ConsumableType {
        unaffected,
        burned,
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

    /**
     * @dev validates inputs array of ingredients
     * @param _inputs the inputted array to the Crafter initializer
     * @param inputs storage array of inputs, copied from _inputs
     * @param nUse mapping used to compute N-time validations
     */
    function validateInputs(
        Ingredient[] memory _inputs,
        Ingredient[] storage inputs,
        mapping(uint256 => uint256) storage nUse
    ) internal {
        for (uint256 i = 0; i < _inputs.length; i++) {
            TokenType token = _inputs[i].token;
            if (token == PluginsLib.TokenType.erc20) {
                require(_inputs[i].tokenIds.length == 0, 'PluginsLib: tokenids.length != 0');
                require(_inputs[i].amounts.length == 1, 'PluginsLib: amounts.length != 1');
                require(
                    _inputs[i].consumableType == ConsumableType.unaffected ||
                        _inputs[i].consumableType == ConsumableType.burned,
                    'PluginsLib: ERC20 consumableType not unaffected or burned'
                );
            } else if (token == PluginsLib.TokenType.erc721) {
                //accept all token ids as inputs
                require(_inputs[i].tokenIds.length == 0, 'PluginsLib: tokenIds.length != 0');
                require(
                    _inputs[i].consumableType == ConsumableType.burned ||
                        _inputs[i].consumableType == ConsumableType.NTime,
                    'PluginsLib: ERC721 consumableType not burned or NTime'
                );

                if (_inputs[i].consumableType == PluginsLib.ConsumableType.NTime) {
                    require(
                        _inputs[i].amounts.length == 1,
                        'PluginsLib: amounts.length != 1; required for NTime ConsumableType'
                    );

                    nUse[i] = _inputs[i].amounts[0];
                } else require(_inputs[i].amounts.length == 0, 'PluginsLib: amounts.length != 0');
            } else if (token == PluginsLib.TokenType.erc1155) {
                require(
                    _inputs[i].tokenIds.length == _inputs[i].amounts.length,
                    'PluginsLib: tokenids.length != amounts.length'
                );
                require(
                    _inputs[i].consumableType == ConsumableType.unaffected ||
                        _inputs[i].consumableType == ConsumableType.burned,
                    'PluginsLib: ERC1155 consumableType not unaffected or burned'
                );
            } else {
                revert(); //revert if not valid token type
            }
            inputs.push(_inputs[i]);
        }
    }

    /**
     * @dev validates outputs array of ingredients
     * @param _outputs the output array of the Crafter initializer
     * @param outputs storage array of outputs, copied from _outputs
     * @param _craftableAmount the amount of times the recipe may be crafted
     */
    function validateOutputs(
        Ingredient[] memory _outputs,
        Ingredient[] storage outputs,
        uint256 _craftableAmount
    ) internal returns (uint256) {
        uint256 erc721Amount = 0;

        // Outputs validations
        for (uint256 i = 0; i < _outputs.length; i++) {
            if (_outputs[i].token == TokenType.erc20) {
                require(_outputs[i].tokenIds.length == 0, 'CrafterTransfer: tokenids.length != 0');
                require(_outputs[i].amounts.length == 1, 'CrafterTransfer: amounts.length != 1');
                outputs.push(_outputs[i]);
            } else if (_outputs[i].token == TokenType.erc721) {
                require(
                    _outputs[i].tokenIds.length == _craftableAmount,
                    'CrafterTransfer: tokenids.length != _craftableAmount'
                );
                require(_outputs[i].amounts.length == 0, 'CrafterTransfer: amounts.length != 0');
                erc721Amount++;
                //Copy token data but set tokenIds as empty (these are filled out in the _deposit function call)
                Ingredient memory x = Ingredient({
                    token: TokenType.erc721,
                    consumableType: _outputs[i].consumableType,
                    contractAddr: _outputs[i].contractAddr,
                    amounts: new uint256[](0),
                    tokenIds: new uint256[](0)
                });
                outputs.push(x);
            } else if (_outputs[i].token == TokenType.erc1155) {
                require(
                    _outputs[i].tokenIds.length == _outputs[i].amounts.length,
                    'CrafterTransfer: tokenids.length != amounts.length'
                );
                outputs.push(_outputs[i]);
            }
        }

        return erc721Amount;
    }

    /**
     * @param _outputs the output array of the Crafter initializer
     * @param _craftableAmount the amount of times the recipe may be crafted
     * @param erc721Amount the number of erc721 tokens to be used as output
     */
    function createOutputsArr(
        Ingredient[] memory _outputs,
        uint256 _craftableAmount,
        uint256 erc721Amount
    ) internal pure returns (uint256[][] memory) {
        uint256[][] memory _outputsERC721Ids = new uint256[][](erc721Amount);
        uint256 outputERC721index = 0;

        for (uint256 i = 0; i < _outputs.length; i++) {
            if (_outputs[i].token == TokenType.erc721) {
                _outputsERC721Ids[outputERC721index] = new uint256[](_craftableAmount);
                for (uint256 j = 0; j < _craftableAmount; j++) {
                    _outputsERC721Ids[outputERC721index][j] = _outputs[i].tokenIds[j];
                }
                outputERC721index++;
            }
        }

        return _outputsERC721Ids;
    }

    /**
     * @dev Generates a 256-bit bitmask from startBit:endBit
     * @param currDna original DNA, represented in base 10
     * @param genes array representing start indexes of genes within binary representation of currDna
     * @param modifications array describing modifications to each gene
     * @return newDna the transformed DNA
     */
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
                if (currMod.value <= 2**maxBits - 1 && currMod.value >= 0)
                    //set must be in range, otherwise ignored
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
