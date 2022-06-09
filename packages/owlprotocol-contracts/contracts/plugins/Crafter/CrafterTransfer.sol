//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

import './ICrafter.sol';
import './CraftLib.sol';

import 'hardhat/console.sol';

/**
 * @dev Pluggable Crafting Contract.
 */
contract CrafterTransfer is ICrafter, ERC721HolderUpgradeable, ERC1155HolderUpgradeable, OwnableUpgradeable {
    /**********************
             Types
    **********************/

    event CreateRecipe(address indexed creator, CraftLib.Ingredient[] inputs, CraftLib.Ingredient[] outputs);
    event RecipeUpdate(uint256 craftableAmount);
    event RecipeCraft(uint256 craftedAmount, uint256 craftableAmount, address indexed user);

    address public burnAddress;
    uint256 public craftableAmount;
    uint256 public craftedAmount;

    CraftLib.Ingredient[] private inputs;
    CraftLib.Ingredient[] private outputs;

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Create recipe
     * @dev Configures crafting recipe with inputs/outputs
     * @param _burnAddress Burn address for burn inputs
     * @param _inputs inputs for recipe
     * @param _outputs outputs for recipe
     */
    function initialize(
        address _admin,
        address _burnAddress,
        uint256 _craftableAmount,
        CraftLib.Ingredient[] calldata _inputs,
        CraftLib.Ingredient[] calldata _outputs
    ) public initializer {
        // Requires
        require(_burnAddress != address(0), 'burn address must not be 0');
        require(_inputs.length > 0, 'A crafting input must be given!');
        require(_outputs.length > 0, 'A crafting output must be given!');

        __Ownable_init();
        _transferOwnership(_admin);

        burnAddress = _burnAddress;

        // NOTE - deep copies arrays
        // Inputs validations
        for (uint256 i = 0; i < _inputs.length; i++) {
            inputs.push(_inputs[i]);
            if (_inputs[i].token == CraftLib.TokenType.erc20) {
                require(_inputs[i].tokenIds.length == 0, 'tokenids.length != 0');
                require(_inputs[i].amounts.length == 1, 'amounts.length != 1');
            }
            if (_inputs[i].token == CraftLib.TokenType.erc721) {
                //accept all token ids as inputs
                require(_inputs[i].tokenIds.length == 0, 'tokenids.length != 0');
                require(_inputs[i].amounts.length == 0, 'amounts.length != 0');
            }
            if (_inputs[i].token == CraftLib.TokenType.erc1155) {
                require(_inputs[i].tokenIds.length == _inputs[i].amounts.length, 'tokenids.length != amounts.length');
            }
        }

        uint256 erc721amount = 0;

        // Outputs validations
        for (uint256 i = 0; i < _outputs.length; i++) {
            outputs.push(_outputs[i]);
            if (_outputs[i].token == CraftLib.TokenType.erc20) {
                require(_outputs[i].tokenIds.length == 0, 'tokenids.length != 0');
                require(_outputs[i].amounts.length == 1, 'amounts.length != 1');
            }
            if (_outputs[i].token == CraftLib.TokenType.erc721) {
                require(_outputs[i].tokenIds.length == _craftableAmount, 'tokenids.length != _craftableAmount');
                require(_outputs[i].amounts.length == 0, 'amounts.length != 0');
                erc721amount++;
            }
            if (_outputs[i].token == CraftLib.TokenType.erc1155) {
                require(_outputs[i].tokenIds.length == _outputs[i].amounts.length, 'tokenids.length != amounts.length');
            }
        }

        emit CreateRecipe(_msgSender(), _inputs, _outputs);

        uint256[][] memory _outputsERC721Ids = new uint256[][](erc721amount);
        uint256 outputERC721index = 0;

        for (uint256 i = 0; i < _outputs.length; i++) {
            if (_outputs[i].token == CraftLib.TokenType.erc721) {
                _outputsERC721Ids[outputERC721index] = new uint256[](_craftableAmount);
                for (uint256 j = 0; j < _craftableAmount; j++) {
                    _outputsERC721Ids[outputERC721index][j] = _outputs[i].tokenIds[j];
                }
                outputERC721index++;
            }
        }

        if (_craftableAmount > 0) _deposit(_craftableAmount, _outputsERC721Ids, _admin);
    }

    /**********************
            Getters
    **********************/

    /**
     * @dev Returns all inputs (without `amounts` or `tokenIds`)
     */
    function getInputs() public view returns (CraftLib.Ingredient[] memory _inputs) {
        return inputs;
    }

    /**
     * @dev Returns all outputs (without `amounts` or `tokenIds`)
     */
    function getOutputs() public view returns (CraftLib.Ingredient[] memory _outputs) {
        return outputs;
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
    function getInputIngredient(uint256 index)
        public
        view
        returns (
            CraftLib.TokenType token,
            CraftLib.ConsumableType consumableType,
            address contractAddr,
            uint256[] memory amounts,
            uint256[] memory tokenIds
        )
    {
        CraftLib.Ingredient storage i = inputs[index];

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
            CraftLib.TokenType token,
            CraftLib.ConsumableType consumableType,
            address contractAddr,
            uint256[] memory amounts,
            uint256[] memory tokenIds
        )
    {
        CraftLib.Ingredient storage i = outputs[index];

        return (i.token, i.consumableType, i.contractAddr, i.amounts, i.tokenIds);
    }

    /**********************
         Interaction
    **********************/

    /**
     * @notice Must be recipe creator. Automatically sends from `msg.sender`
     * @dev Used to deposit recipe outputs.
     * @param depositAmount How many times the recipe should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     */
    function deposit(uint256 depositAmount, uint256[][] calldata _outputsERC721Ids) public onlyOwner {
        _deposit(depositAmount, _outputsERC721Ids, _msgSender());
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to deposit recipe outputs
     * @param depositAmount How many times the recipe should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     * @param from address to transfer tokens from
     */
    function _deposit(
        uint256 depositAmount,
        uint256[][] memory _outputsERC721Ids,
        address from
    ) internal {
        //Requires
        require(depositAmount > 0, 'depositAmount cannot be 0!');

        uint256 erc721Outputs = 0;

        for (uint256 i = 0; i < outputs.length; i++) {
            console.log('running');
            CraftLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == CraftLib.TokenType.erc20) {
                //Transfer ERC20
                SafeERC20Upgradeable.safeTransferFrom(
                    IERC20Upgradeable(ingredient.contractAddr),
                    from,
                    address(this),
                    ingredient.amounts[0] * depositAmount
                );
            } else if (ingredient.token == CraftLib.TokenType.erc721) {
                //Transfer ERC721
                require(
                    _outputsERC721Ids[erc721Outputs].length == depositAmount,
                    '_outputsERC721Ids[i] != depositAmount'
                );
                for (uint256 j = 0; j < _outputsERC721Ids[erc721Outputs].length; j++) {
                    console.log('erc115', _outputsERC721Ids[erc721Outputs][j]);
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        from,
                        address(this),
                        _outputsERC721Ids[erc721Outputs][j]
                    );
                    //Update ingredient, push additional ERC721 tokenId
                    ingredient.tokenIds.push(_outputsERC721Ids[erc721Outputs][j]);
                }
                erc721Outputs += 1;
            } else if (ingredient.token == CraftLib.TokenType.erc1155) {
                //Transfer ERC1155
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * depositAmount;
                }
                IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                    from,
                    address(this),
                    ingredient.tokenIds,
                    amounts,
                    new bytes(0)
                );
            }
        }

        // Increase craftableAmount (after transfers have confirmed, prevent reentry)
        craftableAmount += depositAmount;
        emit RecipeUpdate(craftableAmount);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs. Reverse logic as deposit().
     * @param withdrawAmount How many times the craft outputs should be withdrawn
     */
    function withdraw(uint256 withdrawAmount) external onlyOwner {
        // Requires
        require(withdrawAmount > 0, 'withdrawAmount cannot be 0!');
        require(withdrawAmount <= craftableAmount, 'Not enough resources!');

        // Decrease craftableAmount (check-effects)
        craftableAmount -= withdrawAmount;

        for (uint256 i = 0; i < outputs.length; i++) {
            CraftLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == CraftLib.TokenType.erc20) {
                //Transfer ERC20
                SafeERC20Upgradeable.safeTransfer(
                    IERC20Upgradeable(ingredient.contractAddr),
                    _msgSender(),
                    ingredient.amounts[0] * withdrawAmount
                );
            } else if (ingredient.token == CraftLib.TokenType.erc721) {
                //Pop tokenIds from end of array
                //Transfer ERC721, tokenIds from [len-withdrawAmount ... len-1] have already been transferred.
                for (uint256 j = ingredient.tokenIds.length - withdrawAmount; j < ingredient.tokenIds.length; j++) {
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        address(this),
                        _msgSender(),
                        ingredient.tokenIds[j]
                    );
                    //Update ingredient, remove withdrawn tokenId
                    ingredient.tokenIds.pop();
                }
            } else if (ingredient.token == CraftLib.TokenType.erc1155) {
                //Transfer ERC1155
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * withdrawAmount;
                }
                IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                    address(this),
                    _msgSender(),
                    ingredient.tokenIds,
                    amounts,
                    new bytes(0)
                );
            }
        }

        emit RecipeUpdate(craftableAmount);
    }

    /**
     * @notice Craft {craftAmount}
     * @dev Used to craft. Consumes inputs and transfers outputs.
     * @param craftAmount How many times to craft
     * @param _inputERC721Ids Array of pre-approved NFTs for crafting usage.
     */
    function craft(uint256 craftAmount, uint256[][] calldata _inputERC721Ids) public {
        // Requires
        require(craftAmount > 0, 'craftAmount cannot be 0!');
        require(craftAmount <= craftableAmount, 'Not enough resources to craft!');

        // Update crafting stats (check-effects)
        craftableAmount -= craftAmount;
        craftedAmount += craftAmount;

        //Track ERC721 inputs idx
        uint256 erc721Inputs = 0;

        //Transfer inputs
        for (uint256 i = 0; i < inputs.length; i++) {
            CraftLib.Ingredient storage ingredient = inputs[i];
            if (ingredient.token == CraftLib.TokenType.erc20) {
                //ERC20
                if (ingredient.consumableType == CraftLib.ConsumableType.burned) {
                    //Transfer ERC20
                    SafeERC20Upgradeable.safeTransferFrom(
                        IERC20Upgradeable(ingredient.contractAddr),
                        _msgSender(),
                        burnAddress,
                        ingredient.amounts[0] * craftAmount
                    );
                } else if (ingredient.consumableType == CraftLib.ConsumableType.unaffected) {
                    //Check ERC20
                    require(
                        IERC20Upgradeable(ingredient.contractAddr).balanceOf(_msgSender()) >=
                            ingredient.amounts[0] * craftAmount,
                        'User missing minimum token balance(s)!'
                    );
                }
            } else if (ingredient.token == CraftLib.TokenType.erc721) {
                //ERC721
                require(_inputERC721Ids[erc721Inputs].length == craftAmount, '_inputERC721Ids[i] != craftAmount');
                if (ingredient.consumableType == CraftLib.ConsumableType.burned) {
                    //Transfer ERC721
                    for (uint256 j = 0; j < _inputERC721Ids[erc721Inputs].length; j++) {
                        IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                            _msgSender(),
                            burnAddress,
                            _inputERC721Ids[erc721Inputs][j]
                        );
                    }
                } else if (ingredient.consumableType == CraftLib.ConsumableType.unaffected) {
                    //Check ERC721
                    for (uint256 j = 0; j < _inputERC721Ids[erc721Inputs].length; j++) {
                        require(
                            IERC721Upgradeable(ingredient.contractAddr).ownerOf(_inputERC721Ids[erc721Inputs][j]) ==
                                _msgSender(),
                            'User does not own token(s)!'
                        );
                    }
                }
                erc721Inputs += 1;
            } else if (ingredient.token == CraftLib.TokenType.erc1155) {
                //ERC1155
                if (ingredient.consumableType == CraftLib.ConsumableType.burned) {
                    //Transfer ERC1155
                    uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                    for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                        amounts[j] = ingredient.amounts[j] * craftAmount;
                    }
                    IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                        _msgSender(),
                        burnAddress,
                        ingredient.tokenIds,
                        amounts,
                        new bytes(0)
                    );
                } else if (ingredient.consumableType == CraftLib.ConsumableType.unaffected) {
                    //Check ERC1155
                    uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                    address[] memory accounts = new address[](ingredient.amounts.length);
                    for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                        amounts[j] = ingredient.amounts[j] * craftAmount;
                        accounts[j] = _msgSender();
                    }

                    uint256[] memory balances = IERC1155Upgradeable(ingredient.contractAddr).balanceOfBatch(
                        accounts,
                        ingredient.tokenIds
                    );
                    for (uint256 j = 0; j < balances.length; j++) {
                        require(balances[j] >= amounts[j], 'User missing minimum token balance(s)!');
                    }
                }
            }
        }

        //Transfer outputs
        for (uint256 i = 0; i < outputs.length; i++) {
            CraftLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == CraftLib.TokenType.erc20) {
                //Transfer ERC20
                SafeERC20Upgradeable.safeTransfer(
                    IERC20Upgradeable(ingredient.contractAddr),
                    _msgSender(),
                    ingredient.amounts[0] * craftAmount
                );
            } else if (ingredient.token == CraftLib.TokenType.erc721) {
                //Transfer ERC721, tokenIds from [craftedAmount ... craftedAmount+craftAmount] have already been transferred.
                // NOTE - this could cause index issues when items are withdrawn from the crafter
                // Also causes issues with check-effects, craftedAmount is already offset
                // I'm switching this to reverse indexing based on the available ids
                for (uint256 j = ingredient.tokenIds.length; j > ingredient.tokenIds.length - craftAmount; j--) {
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        address(this),
                        _msgSender(),
                        ingredient.tokenIds[j - 1]
                    );
                }
                //Update ingredient, remove withdrawn tokenId
                ingredient.tokenIds.pop();
            } else if (ingredient.token == CraftLib.TokenType.erc1155) {
                //Transfer ERC1155
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * craftAmount;
                }
                IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                    address(this),
                    _msgSender(),
                    ingredient.tokenIds,
                    amounts,
                    new bytes(0)
                );
            }
        }

        emit RecipeCraft(craftedAmount, craftableAmount, _msgSender());
    }
}
