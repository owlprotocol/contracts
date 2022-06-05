//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

import '../../assets/ERC20/ERC20Owl.sol';
import '../../assets/ERC721/ERC721Owl.sol';
import '../../assets/ERC1155/ERC1155Owl.sol';

import './ICrafter.sol';
import './CraftLib.sol';

/**
 * @dev Pluggable Crafting Contract.
 */
contract CrafterMint is ERC721HolderUpgradeable, OwnableUpgradeable {
    // Events
    event CreateRecipe(address indexed creator, CraftLib.Ingredient[] inputs, CraftLib.Ingredient[] outputs);
    event RecipeUpdate(uint256 craftableAmount);
    event RecipeCraft(uint256 craftedAmount, uint256 craftableAmount, address indexed user);

    address public burnAddress;
    uint256 public craftableAmount;
    uint256 public craftedAmount;

    CraftLib.Ingredient[] public inputs;
    CraftLib.Ingredient[] public outputs;

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
        // Inputs
        for (uint256 i = 0; i < _inputs.length; i++) {
            inputs.push(_inputs[i]);
            // Reject start ids
            if (_outputs[i].token == CraftLib.TokenType.erc721)
                require(_outputs[i].tokenIds.length == 0, 'tokenIds.length != 0');
        }
        // Outputs
        for (uint256 i = 0; i < _outputs.length; i++) {
            outputs.push(_outputs[i]);
            // Reject start ids
            if (_outputs[i].token == CraftLib.TokenType.erc721)
                require(_outputs[i].tokenIds.length == 0, 'tokenIds.length != 0');
        }

        emit CreateRecipe(_msgSender(), _inputs, _outputs);
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

        //Mint outputs
        for (uint256 i = 0; i < outputs.length; i++) {
            CraftLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == CraftLib.TokenType.erc20) {
                //Mint ERC20
                ERC20Owl(ingredient.contractAddr).mint(_msgSender(), ingredient.amounts[0] * craftAmount);
            } else if (ingredient.token == CraftLib.TokenType.erc721) {
                //Mint ERC721, tokenIds from [craftedAmount ... craftedAmount+craftAmount] have already been minted.
                for (uint256 j = ingredient.tokenIds.length; j > ingredient.tokenIds.length - craftAmount; j--) {
                    ERC721Owl(ingredient.contractAddr).mint(_msgSender(), ingredient.tokenIds[j - 1]);
                }
                //Update ingredient, remove withdrawn tokenId
                ingredient.tokenIds.pop();
            } else if (ingredient.token == CraftLib.TokenType.erc1155) {
                //Transfer ERC1155
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * craftAmount;
                }
                ERC1155Owl(ingredient.contractAddr).mintBatch(_msgSender(), ingredient.tokenIds, amounts, new bytes(0));
            }
        }

        emit RecipeCraft(craftedAmount, craftableAmount, _msgSender());
    }
}
