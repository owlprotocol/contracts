//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '../OwlBase.sol';

/**
 @dev Abstract contract with types and utilities that will be used by many (if
 not all) Plugins contracts
 */
abstract contract PluginsCore is OwlBase {
    event RouterError(uint256 indexed routeId, address indexed sender, bytes indexed data);

    // Unaffected inputs of this type are unaffected by the crafting process.
    // DOES NOT APPLY TO ERC 721 INPUTS, USE NTime INSTEAD.
    // Burned inputs of this type are burned during the crafting process/
    // NTime inputs of this type are not burned, but can only be used N times in
    // the same recipe; Only available for ERC721 TokenType
    enum ConsumableType {
        unaffected,
        burned,
        NTime
    }

    // Current set of support token types as assets
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

    // mapping from ingredient to nUSE (max count grabbed from amounts[0])
    mapping(uint256 => uint256) nUse;

    // mapping from contract address to tokenId to nUsed
    mapping(address => mapping(uint256 => uint256)) usedERC721Inputs;

    /**
     * @dev will use/consume inputs as dicatated by the configuration
     * @param inputs set of inputs in the configuration
     * @param from address to use/consume inputs from
     * @param burnAddress in case configuration requires a burn
     * address to transfer items to
     * @param _inputERC721Ids set of ERC721 `tokenId`s, if applicable
     * Example of `_inputERC721Ids` with `amount = 2` with 3 `Ingredient`s
     * in `inputs` with `TokenType.ERC721`
     * ```
     * [
     *  [1, 2]
     *  [3, 4]
     *  [5, 6]
     * ]
     * ```
     * @param amount sets of inputs to use/consume
     */
    function _useInputs(
        Ingredient[] storage inputs,
        address from,
        address burnAddress,
        uint256[][] calldata _inputERC721Ids,
        uint256 amount
    ) internal {
        // Keep count of the amount of erc721Inputs so if there
        // are multiple `tokenId`s in `_inputsERC721Ids`, next
        // element in the array is only used when iteration is
        // at next ERC721
        uint256 erc721Inputs = 0;

        for (uint256 i = 0; i < inputs.length; i++) {
            Ingredient storage ingredient = inputs[i];
            if (ingredient.token == TokenType.erc20) {
                if (ingredient.consumableType == ConsumableType.burned) {
                    SafeERC20Upgradeable.safeTransferFrom(
                        IERC20Upgradeable(ingredient.contractAddr),
                        from,
                        burnAddress,
                        ingredient.amounts[0] * amount
                    );
                } else {
                    // this is unaffected, as ensured by input validations
                    require(
                        IERC20Upgradeable(ingredient.contractAddr).balanceOf(from) >= ingredient.amounts[0] * amount,
                        'PluginsCore: User missing minimum token balance(s)!'
                    );
                }
            } else if (ingredient.token == TokenType.erc721) {
                uint256[] memory currInputArr = _inputERC721Ids[erc721Inputs];
                require(currInputArr.length == amount, 'PluginsCore: _inputERC721Ids[i] != amount');
                if (ingredient.consumableType == ConsumableType.burned) {
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                            from,
                            burnAddress,
                            currInputArr[j]
                        );
                    }
                } else {
                    //this is N-time, as ensured by input validations
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        require(
                            IERC721Upgradeable(ingredient.contractAddr).ownerOf(currInputArr[j]) == from,
                            'PluginsCore: User does not own token(s)!'
                        );
                        uint256 currTokenId = currInputArr[j];
                        require(
                            (usedERC721Inputs[ingredient.contractAddr])[currTokenId] < nUse[i],
                            'PluginsCore: Used over the limit of n'
                        );
                        (usedERC721Inputs[ingredient.contractAddr])[currTokenId] += 1;
                    }
                }
                erc721Inputs += 1;
            } else {
                // this is 1155 token type, as ensured by input validations
                if (ingredient.consumableType == ConsumableType.burned) {
                    uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                    for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                        amounts[j] = ingredient.amounts[j] * amount;
                    }
                    IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                        from,
                        burnAddress,
                        ingredient.tokenIds,
                        amounts,
                        new bytes(0)
                    );
                } else {
                    //this is unaffected consumable type, as ensured by input validations
                    uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                    address[] memory accounts = new address[](ingredient.amounts.length);
                    for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                        amounts[j] = ingredient.amounts[j] * amount;
                        accounts[j] = from;
                    }

                    uint256[] memory balances = IERC1155Upgradeable(ingredient.contractAddr).balanceOfBatch(
                        accounts,
                        ingredient.tokenIds
                    );
                    for (uint256 j = 0; j < balances.length; j++) {
                        require(balances[j] >= amounts[j], 'PluginsCore: User missing minimum token balance(s)!');
                    }
                }
            }
        }
    }

    /**
     * @dev validates inputs array of ingredients
     * @param _inputs the inputted array to the Crafter initializer
     * @param inputs storage array of inputs, copied from _inputs
     */
    function _validateInputs(Ingredient[] calldata _inputs, Ingredient[] storage inputs) internal {
        for (uint256 i = 0; i < _inputs.length; i++) {
            TokenType token = _inputs[i].token;
            if (token == TokenType.erc20) {
                require(_inputs[i].tokenIds.length == 0, 'PluginsLib: tokenids.length != 0');
                require(_inputs[i].amounts.length == 1, 'PluginsLib: amounts.length != 1');
                require(
                    _inputs[i].consumableType == ConsumableType.unaffected ||
                        _inputs[i].consumableType == ConsumableType.burned,
                    'PluginsLib: ERC20 consumableType not unaffected or burned'
                );
            } else if (token == TokenType.erc721) {
                //accept all token ids as inputs
                require(_inputs[i].tokenIds.length == 0, 'PluginsLib: tokenIds.length != 0');
                require(
                    _inputs[i].consumableType == ConsumableType.burned ||
                        _inputs[i].consumableType == ConsumableType.NTime,
                    'PluginsLib: ERC721 consumableType not burned or NTime'
                );

                if (_inputs[i].consumableType == ConsumableType.NTime) {
                    require(
                        _inputs[i].amounts.length == 1,
                        'PluginsLib: amounts.length != 1; required for NTime ConsumableType'
                    );

                    nUse[i] = _inputs[i].amounts[0];
                } else require(_inputs[i].amounts.length == 0, 'PluginsLib: amounts.length != 0');
            } else if (token == TokenType.erc1155) {
                require(
                    _inputs[i].tokenIds.length == _inputs[i].amounts.length,
                    'PluginsLib: tokenids.length != amounts.length'
                );
                require(
                    _inputs[i].consumableType == ConsumableType.unaffected ||
                        _inputs[i].consumableType == ConsumableType.burned,
                    'PluginsLib: ERC1155 consumableType not unaffected or burned'
                );
            } else revert(); //revert if not valid token type

            inputs.push(_inputs[i]);
        }
    }

    uint256[48] private __gap;
}
