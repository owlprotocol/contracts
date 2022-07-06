//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
        subtract,
        set
        // ,
        // multiply,
        // random
    }

    // defines specification of how a specific gene is transformed
    struct GeneMod {
        GeneTransformType geneTransformType;
        uint256 value;
    }
}
