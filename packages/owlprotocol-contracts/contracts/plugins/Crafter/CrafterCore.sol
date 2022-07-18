//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../../assets/ERC20/ERC20Owl.sol';
import '../../assets/ERC721/ERC721Owl.sol';
import '../../assets/ERC1155/ERC1155Owl.sol';
import '../PluginsCore.sol';
import './ICrafter.sol';

abstract contract CrafterCore is PluginsCore, ICrafter, ERC721HolderUpgradeable {
    /**********************
             Events
    **********************/

    event Create(address indexed creator, Ingredient[] inputs, Ingredient[] outputs);

    event Update(uint256 craftableAmount);

    event Craft(uint256 craftedAmount, uint256 craftableAmount, address indexed user);

    /**********************
             Storage
    **********************/

    // Address which burned items are sent to
    address public burnAddress;

    // Sets of crafts left
    uint96 public craftableAmount;

    // Array of inputs in this configurations
    Ingredient[] private inputs;

    // Array of outputs in this configurations
    Ingredient[] private outputs;

    /**********************
        Initialization
    **********************/

    /**
     * @dev performs validations that `_inputs` and `_outputs` are valid and creates the configuration
     */
    function __CrafterCore_init(
        address _admin,
        address _burnAddress,
        Ingredient[] calldata _inputs,
        Ingredient[] calldata _outputs,
        address _forwarder
    ) internal onlyInitializing {
        require(_burnAddress != address(0), 'CrafterCore: burn address must not be 0');
        require(_inputs.length > 0, 'CrafterCore: A crafting input must be given!');
        require(_outputs.length > 0, 'CrafterCore: A crafting output must be given!');
        __OwlBase_init(_admin, _forwarder);

        __CrafterCore_init_unchained(_burnAddress, _inputs, _outputs);
    }

    /**
     * @dev performs validations that `_inputs` and `_outputs` are valid and creates the configuration
     */
    function __CrafterCore_init_unchained(
        address _burnAddress,
        Ingredient[] calldata _inputs,
        Ingredient[] calldata _outputs
    ) internal onlyInitializing {
        burnAddress = _burnAddress;

        // Inputs validated in __CrafterCore_init() since it is
        // the same process for both CrafterTransfer and CrafterMint
        _validateInputs(_inputs);

        emit Create(_msgSender(), _inputs, _outputs);
    }

    /**********************
            Getters
    **********************/

    /**
     * @dev Returns all inputs (without `amounts` or `tokenIds`)
     */
    function getInputs() public view returns (Ingredient[] memory _inputs) {
        return inputs;
    }

    /**
     * @dev Returns all outputs (without `amounts` or `tokenIds`)
     */
    function getOutputs() public view returns (Ingredient[] memory _outputs) {
        return outputs;
    }

    /**********************
           Utilities
    **********************/

    /**
     * @dev Returns all details for a specific ingredient (including amounts/tokenIds)
     * @param index ingredient index to return details for
     * @return token token type
     * @return consumableType consumable type
     * @return contractAddr token contract address
     * @return amounts amount of each token
     * @return tokenIds token ids
     */
    function getInputIngredient(uint256 index)
        public
        view
        returns (
            TokenType token,
            ConsumableType consumableType,
            address contractAddr,
            uint256[] memory amounts,
            uint256[] memory tokenIds
        )
    {
        Ingredient storage i = inputs[index];

        return (i.token, i.consumableType, i.contractAddr, i.amounts, i.tokenIds);
    }

    /**
     * @dev Returns all details for a specific ingredient (including amounts/tokenIds)
     * @param index ingredient index to return details for
     * @return token token type
     * @return consumableType consumable type
     * @return contractAddr token contract address
     * @return amounts amount of each token
     * @return tokenIds token ids
     */
    function getOutputIngredient(uint256 index)
        public
        view
        returns (
            TokenType token,
            ConsumableType consumableType,
            address contractAddr,
            uint256[] memory amounts,
            uint256[] memory tokenIds
        )
    {
        Ingredient storage i = outputs[index];

        return (i.token, i.consumableType, i.contractAddr, i.amounts, i.tokenIds);
    }

    /**
     * @dev calls PluginsCore._validateInputs(_inputs, inputs)
     */
    function _validateInputs(Ingredient[] calldata _inputs) internal {
        super._validateInputs(_inputs, inputs);
    }

    /**
     * @dev call PluginsCore._useInputs(inputs, from, burnAddress, _inputERC721Ids, amount)
     */
    function _useInputs(uint256[][] calldata _inputERC721Ids, uint256 amount) internal {
        super._useInputs(inputs, _msgSender(), burnAddress, _inputERC721Ids, amount);
    }

    /**
     * @dev validates outputs array of ingredients
     * @param _outputs the output array of the Crafter initializer
     * @param _craftableAmount the amount of times the recipe may be crafted
     */
    function _validateOutputs(PluginsCore.Ingredient[] memory _outputs, uint256 _craftableAmount)
        internal
        returns (uint256)
    {
        uint256 erc721Amount = 0;

        for (uint256 i = 0; i < _outputs.length; i++) {
            if (_outputs[i].token == PluginsCore.TokenType.erc20) {
                require(_outputs[i].tokenIds.length == 0, 'CrafterTransfer: tokenids.length != 0');
                require(_outputs[i].amounts.length == 1, 'CrafterTransfer: amounts.length != 1');
                outputs.push(_outputs[i]);
            } else if (_outputs[i].token == PluginsCore.TokenType.erc721) {
                require(
                    _outputs[i].tokenIds.length == _craftableAmount,
                    'CrafterTransfer: tokenids.length != _craftableAmount'
                );
                require(_outputs[i].amounts.length == 0, 'CrafterTransfer: amounts.length != 0');
                erc721Amount++;

                // Copy token data but set tokenIds as empty (these are filled out
                // in the _deposit function call)
                PluginsCore.Ingredient memory x = PluginsCore.Ingredient({
                    token: PluginsCore.TokenType.erc721,
                    consumableType: _outputs[i].consumableType,
                    contractAddr: _outputs[i].contractAddr,
                    amounts: new uint256[](0),
                    tokenIds: new uint256[](0)
                });
                outputs.push(x);
            } else if (_outputs[i].token == PluginsCore.TokenType.erc1155) {
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
     * @dev Creating a static 2d array
     * @param _outputs the output array of the Crafter initializer
     * @param _craftableAmount the amount of times the recipe may be crafted
     * @param erc721Amount the number of erc721 tokens to be used as output
     */
    function _createOutputsArr(
        PluginsCore.Ingredient[] memory _outputs,
        uint256 _craftableAmount,
        uint256 erc721Amount
    ) internal pure returns (uint256[][] memory) {
        uint256[][] memory _outputsERC721Ids = new uint256[][](erc721Amount);
        uint256 outputERC721index = 0;

        for (uint256 i = 0; i < _outputs.length; i++) {
            if (_outputs[i].token == PluginsCore.TokenType.erc721) {
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
     * @dev if transferring, iterate through the `inputs` array
     * and call the appropriate transfer function. Otherwise,
     * only update ERC721 outputs array
     * @param depositAmount sets of outputs to deposit
     * @param _outputsERC721Ids erc721 `tokenId`s to use as outputs
     * @param from if transferring, address to transfer outputs from
     */
    function _addOutputs(
        uint256 depositAmount,
        uint256[][] memory _outputsERC721Ids,
        address from,
        bool transferring
    ) internal {
        // Keep count of the amount of erc721Outputs so if there
        // are multiple `tokenId`s in `_outputsERC721Ids`, next
        // element in the array is only used when iteration is
        // at next ERC721
        uint256 erc721Outputs = 0;

        // Go through all `PluginsCore.Ingredient`s in `outputs` and
        // call appropriate function to transfer the outputs in from
        // `from`
        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsCore.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsCore.TokenType.erc20 && transferring) {
                SafeERC20Upgradeable.safeTransferFrom(
                    IERC20Upgradeable(ingredient.contractAddr),
                    from,
                    address(this),
                    ingredient.amounts[0] * depositAmount
                );
            } else if (ingredient.token == PluginsCore.TokenType.erc721) {
                require(
                    _outputsERC721Ids[erc721Outputs].length == depositAmount,
                    'CrafterTransfer: _outputsERC721Ids[i] != depositAmount'
                );
                for (uint256 j = 0; j < _outputsERC721Ids[erc721Outputs].length; j++) {
                    if (transferring)
                        IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                            from,
                            address(this),
                            _outputsERC721Ids[erc721Outputs][j]
                        );
                    else
                        require(
                            !ERC721Owl(ingredient.contractAddr).exists(_outputsERC721Ids[erc721Outputs][j]),
                            'CrafterCore: tokenId already minted'
                        );
                    //Update ingredient `tokenIds`, push additional ERC721 tokenId
                    ingredient.tokenIds.push(_outputsERC721Ids[erc721Outputs][j]);
                }
                erc721Outputs += 1;
            } else if (ingredient.token == PluginsCore.TokenType.erc1155 && transferring) {
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);

                // Calculate amount of each `tokenId` to transfer
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * depositAmount;
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
     * @dev if transferring, iterate through the `outputs` array
     * and call the appropriate transfer function. Otherwise,
     * only update ERC721 outputs array
     * @param amount sets of outputs to remove
     * @param to if transferring, address to transfer outputs to
     */
    function _removeOutputs(
        uint256 amount,
        address to,
        bool transferring
    ) internal {
        // `transferring` bool will indicate if this is a removal
        // for `CrafterMint` or `CrafterTransfer`. For CrafterMint,
        // in the case of withdrawal, removal of outputs is neccesary
        // without any minting happening. This will be denoted by
        // the `to` address being address(0) since ERC721 prevents
        // minting to address(0) anyways. If to != address(0), then
        // alongside removal of outputs from contract balances,
        // assets will be minted to `to`.
        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsCore.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsCore.TokenType.erc20) {
                if (transferring)
                    SafeERC20Upgradeable.safeTransfer(
                        IERC20Upgradeable(ingredient.contractAddr),
                        to,
                        ingredient.amounts[0] * amount
                    );
                else if (to != address(0))
                    ERC20Owl(ingredient.contractAddr).mint(_msgSender(), ingredient.amounts[0] * amount);
            } else if (ingredient.token == PluginsCore.TokenType.erc721) {
                for (uint256 j = 0; j < amount; j++) {
                    if (transferring)
                        IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                            address(this),
                            to,
                            ingredient.tokenIds[ingredient.tokenIds.length - 1]
                        );
                    else if (to != address(0))
                        ERC721Owl(ingredient.contractAddr).mint(
                            _msgSender(),
                            ingredient.tokenIds[ingredient.tokenIds.length - 1]
                        );
                    // Pop `tokenId`s from the back
                    ingredient.tokenIds.pop();
                }
            } else if (ingredient.token == PluginsCore.TokenType.erc1155) {
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * amount;
                }
                if (transferring)
                    IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                        address(this),
                        to,
                        ingredient.tokenIds,
                        amounts,
                        new bytes(0)
                    );
                else if (to != address(0))
                    ERC1155Owl(ingredient.contractAddr).mintBatch(
                        _msgSender(),
                        ingredient.tokenIds,
                        amounts,
                        new bytes(0)
                    );
            }
        }
    }

    uint256[46] private __gap;
}
