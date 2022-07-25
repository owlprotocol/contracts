//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './CrafterCore.sol';

/**
 * @dev Contract module that enables crafting of different types of assets
 * (ERC20, ERC721, ERC1155) whose crafting outputs are minted to the caller.
 *
 * Crafting configuration is designated by two {PluginsCore#Ingredient}`[]`. One array is the
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
 * Each Ingredient has a `consumableType` field.* This field is for the `inputs`
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
 * This module is used through composition. It can be deployed to create
 * crafting logic with asset contracts that are already on chain and active;
 * plug-and-play, so to speak.
 */
contract CrafterMint is CrafterCore, ERC1155HolderUpgradeable {
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://CrafterMint/', _version)));

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
        __CrafterMint_init(_admin, _burnAddress, _craftableAmount, _inputs, _outputs, _forwarder);
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
        __CrafterMint_init(_admin, _burnAddress, _craftableAmount, _inputs, _outputs, _forwarder);
    }

    /**
     * @dev performs validations that `_inputs` and `_outputs` are valid and
     * creates the configuration
     */
    function __CrafterMint_init(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        Ingredient[] calldata _inputs,
        Ingredient[] calldata _outputs,
        address _forwarder
    ) internal onlyInitializing {
        __CrafterCore_init(_admin, _burnAddress, _inputs, _outputs, _forwarder);

        __CrafterMint_init_unchained(_craftableAmount, _outputs);
    }

    /**
     * @dev performs validations that `_inputs` and `_outputs` are valid and
     * creates the configuration
     */
    function __CrafterMint_init_unchained(uint96 _craftableAmount, Ingredient[] calldata _outputs)
        internal
        onlyInitializing
    {
        uint256 erc721Amount = _validateOutputs(_outputs, _craftableAmount);

        uint256[][] memory _outputsERC721Ids = _createOutputsArr(_outputs, _craftableAmount, erc721Amount);
        if (_craftableAmount > 0) _deposit(_craftableAmount, _outputsERC721Ids);
    }

    /**********************
         Interaction
    **********************/

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`.
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
        _deposit(amount, _outputsERC721Ids);
    }

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`
     * @dev Used to deposit configuration outputs. This is only ever directly
     * called in intializations.
     * @param amount How many times the configuration should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     */
    function _deposit(uint96 amount, uint256[][] memory _outputsERC721Ids) internal {
        require(amount > 0, 'CrafterMint: amount cannot be 0!');
        craftableAmount += amount;

        // address `from` parameter irrelevant in CrafterMint... passing
        // 0 address will suffice
        _addOutputs(amount, _outputsERC721Ids, address(0));

        emit Update(craftableAmount);
    }

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`
     * @dev Used to withdraw configuration outputs out of contract by decreasing
     * `craftableAmount`.
     * @param amount How many sets of outputs should be withdrawn
     */
    function withdraw(uint96 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // This will remove a `amount` of outputs and ERC721 `tokenId`
        // without doing any minting
        _removeOutputs(amount, address(0));

        emit Update(craftableAmount);
    }

    /**
     * @notice Craft `amount`
     * @dev Used to craft. Consumes inputs and mints outputs.
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
        // This will remove a `amount` of outputs and ERC721 `tokenId`
        // while also minting to the _msgSender()
        _removeOutputs(amount, _msgSender());

        _useInputs(_inputERC721Ids, amount);

        emit Craft(amount, craftableAmount, _msgSender());
    }

    /**
     * @dev adds outputs to the contract balances
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
     */
    function _addOutputs(
        uint256 amount,
        uint256[][] memory _outputsERC721Ids,
        address /* from */
    ) internal override {
        // Keep count of the amount of erc721Outputs so if there
        // are multiple `tokenId`s in `_outputsERC721Ids`, next
        // element in the array is only used when iteration is
        // at next ERC721
        uint256 erc721Outputs = 0;

        // Go through all `PluginsCore.Ingredient`s in `outputs` and
        // find ERC721 outputs. Then update `tokenId`s in ERC721 `Ingredient`s
        //  inside the `outputs` array. ERC20 and ERC1155 changes do
        //  not need to be made as their balances are only dependent on the
        // `craftableAmount` variable
        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsCore.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsCore.TokenType.erc721) {
                require(
                    _outputsERC721Ids[erc721Outputs].length == amount,
                    'CrafterMint: _outputsERC721Ids[i] != amount'
                );
                for (uint256 j = 0; j < _outputsERC721Ids[erc721Outputs].length; j++) {
                    // Potential vunerability here is that after this check,
                    // someone with mint rights to the output nft address mints
                    // a tokenId in the output list. It is imperative that
                    // access to minting of the nft is well-secured, as is
                    // guaranteed when launching through the OwlProtocol Portal
                    require(
                        !ERC721Owl(ingredient.contractAddr).exists(_outputsERC721Ids[erc721Outputs][j]),
                        'CrafterMint: tokenId already minted'
                    );

                    //Update ingredient `tokenIds`, push additional ERC721 tokenId
                    ingredient.tokenIds.push(_outputsERC721Ids[erc721Outputs][j]);
                }
                erc721Outputs += 1;
            }
        }
    }

    /**
     * @dev removes outputs from the contract balances. If to != address(0),
     * then assets are also minted to that address
     * @param amount sets of outputs to remove
     * @param to address to send outputs to, if applicable
     */
    function _removeOutputs(uint96 amount, address to) internal override {
        require(amount > 0, 'CrafterMint: amount cannot be 0!');
        require(amount <= craftableAmount, 'CrafterMint: Not enough resources to craft!');

        craftableAmount -= amount;

        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsCore.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsCore.TokenType.erc20 && to != address(0))
                ERC20Owl(ingredient.contractAddr).mint(_msgSender(), ingredient.amounts[0] * amount);
            else if (ingredient.token == PluginsCore.TokenType.erc721) {
                for (uint256 j = 0; j < amount; j++) {
                    if (to != address(0))
                        ERC721Owl(ingredient.contractAddr).mint(
                            _msgSender(),
                            ingredient.tokenIds[ingredient.tokenIds.length - 1]
                        );

                    // Pop `tokenId`s from the back
                    ingredient.tokenIds.pop();
                }
            } else if (ingredient.token == PluginsCore.TokenType.erc1155 && to != address(0)) {
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * amount;
                }

                ERC1155Owl(ingredient.contractAddr).mintBatch(_msgSender(), ingredient.tokenIds, amounts, new bytes(0));
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
