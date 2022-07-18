//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './CrafterCore.sol';

/**
 * @dev Contract module that enables crafting of
 * different types of assets (ERC20, ERC721, ERC1155)
 * whose crafting outputs are transferred to the
 * caller.
 *
 * Crafting configuration is designated by two
 * {Ingredient}[]. One array is the `inputs`
 * and the other is the `outputs`. The contract
 * allows for the `inputs` to be redeemed for the
 * `outputs`, `craftableAmount` times.
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
 * Configuration is set in the initializers
 * and cannot be edited once the contract has been launched
 * Other configurations will require their own contract to
 * be deployed
 *
 * However, `craftableAmount` can be dynamically updated
 * through the {deposit} and {withdraw} functions which
 * are only accessible to `DEFAULT_ADMIN_ROLE`
 *
 * Each Ingredient has a `consumableType` field.
 * This field is for the `inputs` elements and ignored by the
 * `outputs` elements. ERC20 and ERC1155 `inputs` elements can be
 * `unaffected` or `burned`. `unaffected` will check for
 * ownership/balance while `burned` will send the asset(s)
 * to the `burnAddress`. ERC721 inputs can be `NTime`
 * or `burned`. `NTime` allows for a specfic `tokenId` to
 * only be used 'n times', as defined by contract deployer.
 *
 * ERC20 `inputs` and `outputs` elements should have one number in
 * the `amounts` array denoting ERC20 token amount requirement.
 * `tokenIds` should be empty.
 *
 * NTime consumable type ERC721 inputs should have empty `tokenIds` and
 * `amounts[0]` equal to `n` - the maximum number of times the input can be used.
 * Burned ERC721 `inputs` elements should have * empty `amounts` and `tokenIds`
 * array. This contract accepts *all* `tokenId`s from an ERC721 contract
 * as inputs. ERC721 `outputs` elements must have empty `amounts`
 * array. `tokenIds` array length should be `craftableAmount`. The `tokenIds`
 * array will contain the `tokenIds` to be transferred out when {craft}
 * is called. Important to note that output transfers will be from the
 * *end* of the array since `.pop()` is used.
 *
 * ERC1155 `inputs` and `outputs` elements should have the length
 * of `amounts` and `tokenIds` array be the same. The indeces
 * will be linked where each index denotes how much of each
 * ERC1155 `tokenId` is required.
 *
 * A note on depositing and initialization: depositer/`_admin`
 * must hold a `craftableAmount` of the outputs or the call will
 * fail.
 *
 * This module is used through composition. It can be deployed
 * to create crafting logic with asset contracts that are
 * already on chain and active; plug-and-play, so to speak.
 */
contract CrafterTransfer is CrafterCore, ERC1155HolderUpgradeable {
    string public constant VERSION = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://CrafterTransfer/', VERSION)));

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
     * @param _craftableAmount limit on the number of times this configuration can be crafted
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
     * @dev Initializes contract through beacon proxy (replaces constructor in proxy pattern)
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
     * @dev performs validations that `_inputs` and `_outputs` are valid and creates the configuration
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
     * @dev performs validations that `_inputs` and `_outputs` are valid and creates the configuration
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
     * @notice Must be `DEFAULT_ADMIN_ROLE`. Automatically sends from `msg.sender`
     * @dev Used to deposit configuration outputs.
     * @param depositAmount How many times the configuration should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     */
    function deposit(uint96 depositAmount, uint256[][] calldata _outputsERC721Ids) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _deposit(depositAmount, _outputsERC721Ids, _msgSender());
    }

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`
     * @dev Used to deposit configuration outputs. This is only ever directly
     * called in intializations.
     * @param depositAmount How many times the configuration should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     * @param from address to transfer tokens from
     */
    function _deposit(
        uint96 depositAmount,
        uint256[][] memory _outputsERC721Ids,
        address from
    ) internal {
        require(depositAmount > 0, 'CrafterTransfer: depositAmount cannot be 0!');

        craftableAmount += depositAmount;

        _addOutputs(depositAmount, _outputsERC721Ids, from, true);

        emit Update(craftableAmount);
    }

    /**
     * @notice Must be `DEFAULT_ADMIN_ROLE`
     * @dev Used to withdraw configuration outputs out of contract to the
     * caller. Will also decrease `craftableAmount`
     * @param withdrawAmount How many sets of outputs should be withdrawn
     */
    function withdraw(uint96 withdrawAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Requires
        require(withdrawAmount > 0, 'CrafterTransfer: withdrawAmount cannot be 0!');
        require(withdrawAmount <= craftableAmount, 'CrafterTransfer: Not enough resources!');

        // Decrease craftableAmount (check-effects)
        craftableAmount -= withdrawAmount;

        // Will take outputs out of contract and transfer
        // them to caller
        _removeOutputs(withdrawAmount, _msgSender(), true);

        emit Update(craftableAmount);
    }

    /**
     * @notice Craft `craftAmount`
     * @dev Used to craft. Consumes inputs and transfers outputs.
     * @param craftAmount How many times to craft
     * @param _inputERC721Ids Array of pre-approved NFTs for crafting usage.
     */
    function craft(uint96 craftAmount, uint256[][] calldata _inputERC721Ids) external {
        require(craftAmount > 0, 'CrafterTransfer: craftAmount cannot be 0!');
        require(craftAmount <= craftableAmount, 'CrafterTransfer: Not enough resources to craft!');

        craftableAmount -= craftAmount;

        _useInputs(_inputERC721Ids, craftAmount);

        // This will remove a `withdrawAmount` of outputs and ERC721 `tokenId`
        // by transferring to the address `to`
        _removeOutputs(craftAmount, _msgSender(), true);

        emit Craft(craftAmount, craftableAmount, _msgSender());
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
        override(AccessControlUpgradeable, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
