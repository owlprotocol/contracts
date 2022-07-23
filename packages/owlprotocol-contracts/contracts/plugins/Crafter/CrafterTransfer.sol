//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './CrafterCore.sol';

/**
 * @dev Contract module that enables crafting of different types of assets
 * (ERC20, ERC721, ERC1155) whose crafting outputs are transferred to the
 * caller.
 *
 * Crafting configuration is designated by two {Ingredient}[]. One array is the
 * `inputs` and the other is the `outputs`. The contract allows for the `inputs`
 * to be redeemed for the `outputs`, `craftableAmount` times.
 *
 * ```
 * struct Ingredient {
 *     TokenType token;
 *     ConsumableType consumableType;
 *     address contractAddr;
 *     uint256[] amounts;
 *     uint256[] tokenIds;
 * }
 * ```
 *
 * Configuration is set in the initializers and cannot be edited once the
 * contract has been launched Other configurations will require their own
 * contract to be deployed
 *
 * However, `craftableAmount` can be dynamically updated through the {deposit}
 * and {withdraw} functions which are only accessible to `DEFAULT_ADMIN_ROLE`
 *
 * Each Ingredient has a `consumableType` field. This field is for the `inputs`
 * elements and ignored by the `outputs` elements. ERC20 and ERC1155 `inputs`
 * elements can be `unaffected` or `burned`. `unaffected` will check for
 * ownership/balance while `burned` will send the asset(s) to the `burnAddress`.
 * ERC721 inputs can be `NTime` or `burned`. `NTime` allows for a specfic
 * `tokenId` to only be used 'n times', as defined by contract deployer.
 *
 * ERC20 `inputs` and `outputs` elements should have one number in the `amounts`
 * array denoting ERC20 token amount requirement.* `tokenIds` should be empty.
 *
 * NTime consumable type ERC721 inputs should have empty `tokenIds` and
 * `amounts[0]` equal to `n` - the maximum number of times the input can be
 * used.* Burned ERC721 `inputs` elements should have * empty `amounts` and
 * `tokenIds` array. This contract accepts *all* `tokenId`s from an ERC721
 * contract as inputs. ERC721 `outputs` elements must have empty `amounts`
 * array. `tokenIds` array length should be `craftableAmount`. The `tokenIds`
 * array will contain the `tokenIds` to be transferred out when {craft} is
 * called. Important to note that output transfers will be from the *end* of the
 * array since `.pop()` is used.
 *
 * ERC1155 `inputs` and `outputs` elements should have the length of `amounts`
 * and `tokenIds` array be the same. The indices will be linked where each index
 * denotes how much of each ERC1155 `tokenId` is required.
 *
 * A note on depositing and initialization: depositer/`_admin` must hold a
 * `craftableAmount` of the outputs or the call will fail.
 *
 * This module is used through composition. It can be deployed to create
 * crafting logic with asset contracts that are already on chain and active;
 * plug-and-play, so to speak.
 */
contract CrafterTransfer is CrafterCore, ERC1155HolderUpgradeable {
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://CrafterTransfer/', _version)));

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

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
        Ingredient[] calldata _inputs,
        Ingredient[] calldata _outputs,
        address _forwarder
    ) external initializer {
        __CrafterTransfer_init(_admin, _burnAddress, _craftableAmount, _inputs, _outputs, _forwarder);
    }

    /**
     * @dev Initializes contract through beacon proxy (replaces constructor in
     * proxy pattern)
     */
    function proxyInitialize(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        Ingredient[] calldata _inputs,
        Ingredient[] calldata _outputs,
        address _forwarder
    ) external onlyInitializing {
        __CrafterTransfer_init(_admin, _burnAddress, _craftableAmount, _inputs, _outputs, _forwarder);
    }

    /**
     * @dev performs validations that `_inputs` and `_outputs` are valid and
     * creates the configuration
     */
    function __CrafterTransfer_init(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        Ingredient[] calldata _inputs,
        Ingredient[] calldata _outputs,
        address _forwarder
    ) internal onlyInitializing {
        __CrafterCore_init(_admin, _burnAddress, _inputs, _outputs, _forwarder);

        __CrafterTransfer_init_unchained(_admin, _craftableAmount, _outputs);
    }

    /**
     * @dev performs validations that `_inputs` and `_outputs` are valid and
     * creates the configuration
     */
    function __CrafterTransfer_init_unchained(
        address _admin,
        uint96 _craftableAmount,
        Ingredient[] calldata _outputs
    ) internal onlyInitializing {
        uint256 erc721Amount = _validateOutputs(_outputs, _craftableAmount);

        uint256[][] memory _outputsERC721Ids = _createOutputsArr(_outputs, _craftableAmount, erc721Amount);
        if (_craftableAmount > 0) _deposit(_craftableAmount, _outputsERC721Ids, _admin);
    }

    /**********************
         Interaction
    **********************/

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
    function deposit(uint96 amount, uint256[][] calldata _outputsERC721Ids) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _deposit(amount, _outputsERC721Ids, _msgSender());
    }

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`
     * @dev Used to deposit configuration outputs. This is only ever directly
     * called in intializations.
     * @param amount How many times the configuration should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     * @param from address to transfer tokens from
     */
    function _deposit(
        uint96 amount,
        uint256[][] memory _outputsERC721Ids,
        address from
    ) internal {
        require(amount > 0, 'CrafterTransfer: amount cannot be 0!');

        craftableAmount += amount;

        _addOutputs(amount, _outputsERC721Ids, from);

        emit Update(craftableAmount);
    }

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`
     * @dev Used to withdraw configuration outputs out of contract to the
     * caller. Will also decrease `craftableAmount`
     * @param amount How many sets of outputs should be withdrawn
     */
    function withdraw(uint96 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Will take outputs out of contract and transfer
        // them to caller
        _removeOutputs(amount, _msgSender());

        emit Update(craftableAmount);
    }

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
    function craft(uint96 amount, uint256[][] calldata _inputERC721Ids) external {
        // This will remove a `withdrawAmount` of outputs and ERC721 `tokenId`
        // by transferring to the _msgSender()
        _removeOutputs(amount, _msgSender());

        _useInputs(_inputERC721Ids, amount);

        emit Craft(amount, craftableAmount, _msgSender());
    }

    /**
     * @dev adds outputs to the contract balances and transfers the outputs into
     * the contract
     * @param amount sets of outputs to add
     * @param _outputsERC721Ids if there are ERC721 tokens present, supply their
     * `tokenId`s
     * Example of `_outputERC721Ids` with `amount = 2` with 3 `Ingredient`s
     * in `outputs` with `TokenType.ERC721`
     * ```
     * [
     *  [1, 2]
     *  [3, 4]
     *  [5, 6]
     * ]
     * ```
     * @param from address to transfer assets from
     */
    function _addOutputs(
        uint256 amount,
        uint256[][] memory _outputsERC721Ids,
        address from
    ) internal override {
        // Keep count of the amount of erc721Outputs so if there are multiple
        // `tokenId`s in `_outputsERC721Ids`, next element in the array is only
        // used when iteration is at next ERC721
        uint256 erc721Outputs = 0;

        // Go through all `PluginsCore.Ingredient`s in `outputs` and call
        // appropriate function to transfer the outputs in from `from`
        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsCore.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsCore.TokenType.erc20) {
                IERC20Upgradeable(ingredient.contractAddr).transferFrom(
                    from,
                    address(this),
                    ingredient.amounts[0] * amount
                );
            } else if (ingredient.token == PluginsCore.TokenType.erc721) {
                require(
                    _outputsERC721Ids[erc721Outputs].length == amount,
                    'CrafterTransfer: _outputsERC721Ids[i] != amount'
                );
                for (uint256 j = 0; j < _outputsERC721Ids[erc721Outputs].length; j++) {
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        from,
                        address(this),
                        _outputsERC721Ids[erc721Outputs][j]
                    );

                    //Update ingredient `tokenIds`, push additional ERC721 tokenId
                    ingredient.tokenIds.push(_outputsERC721Ids[erc721Outputs][j]);
                }
                erc721Outputs += 1;
            } else {
                // This is TokenType ERC1155 by way of validateOutputs
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);

                // Calculate amount of each `tokenId` to transfer
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * amount;
                }

                // Use batch transfer to save gas
                IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                    from,
                    address(this),
                    ingredient.tokenIds,
                    amounts,
                    new bytes(0)
                );
            }
        }
    }

    /**
     * @dev removes outputs from contract balances and send the assets to
     * address `to`
     * @param amount sets of outputs to remove
     * @param to address to send outputs to
     */
    function _removeOutputs(uint96 amount, address to) internal override {
        require(amount > 0, 'CrafterTransfer: amount cannot be 0!');
        require(amount <= craftableAmount, 'CrafterTransfer: Not enough resources to craft!');

        craftableAmount -= amount;

        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsCore.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsCore.TokenType.erc20)
                IERC20Upgradeable(ingredient.contractAddr).transfer(to, ingredient.amounts[0] * amount);
            else if (ingredient.token == PluginsCore.TokenType.erc721) {
                for (uint256 j = 0; j < amount; j++) {
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        address(this),
                        to,
                        ingredient.tokenIds[ingredient.tokenIds.length - 1]
                    );

                    // Pop `tokenId`s from the back
                    ingredient.tokenIds.pop();
                }
            } else {
                //ERC1155, by way of validate inputs
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * amount;
                }

                IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                    address(this),
                    to,
                    ingredient.tokenIds,
                    amounts,
                    new bytes(0)
                );
            }
        }
    }

    /**********************
            ERC165
    **********************/

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(OwlBase, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
