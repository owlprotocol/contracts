//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../PluginsCore.sol';

/**
 * @dev Crafting contracts interface
 */
interface ICrafter {
    /**
     * @dev Initializes contract (replaces constructor in proxy pattern)
     * @param _admin owner, can control outputs on contract
     * @param _burnAddress Burn address for burn inputs
     * @param _craftableAmount limit on the number of times this configuration
     * can be crafted
     * @param _inputs inputs for configuration
     * @param _outputs outputs for configuration
     * @param _forwarder trusted forwarder address for openGSN
     */
    function initialize(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        PluginsCore.Ingredient[] calldata _inputs,
        PluginsCore.Ingredient[] calldata _outputs,
        address _forwarder
    ) external;

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`. Automatically sends from
     * `_msgSender()`
     * @dev Used to deposit configuration outputs.
     * @param amount How many more times the configuration should be
     * craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     * Example of `_outputERC721Ids` with `amount = 2` with 3
     * `Ingredient`s
     * in `outputs` with `TokenType.ERC721`
     * ```
     * [
     *  [1, 2]
     *  [3, 4]
     *  [5, 6]
     * ]
     * ```
     */
    function deposit(uint96 amount, uint256[][] calldata _outputsERC721Ids) external;

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`
     * @dev Used to withdraw configuration outputs out of contract to the
     * caller. Will also decrease `craftableAmount`
     * @param amount How many sets of outputs should be withdrawn
     */
    function withdraw(uint96 amount) external;

    /**
     * @notice Craft `amount`
     * @dev Used to craft. Consumes inputs and transfers outputs.
     * @param amount How many times to craft
     * @param _inputERC721Ids Array of pre-approved NFTs for crafting usage.
     * Example of `_inputERC721Ids` with `amount = 2` with 3 `Ingredient`s
     * in `inputs` with `TokenType.ERC721`
     * ```
     * [
     *  [1, 2]
     *  [3, 4]
     *  [5, 6]
     * ]
     * ```
     */
    function craft(uint96 amount, uint256[][] calldata _inputERC721Ids) external;
}
