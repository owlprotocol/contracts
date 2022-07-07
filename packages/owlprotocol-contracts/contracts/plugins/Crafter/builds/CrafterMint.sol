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
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '../../../assets/ERC20/ERC20Owl.sol';
import '../../../assets/ERC721/ERC721Owl.sol';
import '../../../assets/ERC1155/ERC1155Owl.sol';

import './../ICrafter.sol';
import '../../PluginsLib.sol';

/**
 * @dev Pluggable Crafting Contract.
 * Players can interact with the contract to have
 * recipie outputs minted.
 */
contract CrafterMint is
    ICrafter,
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://CrafterMint/', version)));

    /**********************
             Types
    **********************/

    event CreateRecipe(address indexed creator, PluginsLib.Ingredient[] inputs, PluginsLib.Ingredient[] outputs);
    event RecipeUpdate(uint256 craftableAmount);
    event RecipeCraft(uint256 craftedAmount, uint256 craftableAmount, address indexed user);

    address public burnAddress;
    uint96 public craftableAmount;

    PluginsLib.Ingredient[] private inputs;
    PluginsLib.Ingredient[] private outputs;

    mapping(uint256 => uint256) nUse; //maps ingredient to nUSE (max count grabbed from amount[0])
    mapping(address => mapping(uint256 => uint256)) usedERC721Inputs; //maps a contract address to a tokenId to nUsed which we increment

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
        uint96 _craftableAmount,
        PluginsLib.Ingredient[] calldata _inputs,
        PluginsLib.Ingredient[] calldata _outputs
    ) public initializer {
        // Requires
        require(_burnAddress != address(0), 'CrafterMint: burn address must not be 0');
        require(_inputs.length > 0, 'CrafterMint: A crafting input must be given!');
        require(_outputs.length > 0, 'CrafterMint: A crafting output must be given!');

        __Ownable_init();
        _transferOwnership(_admin);

        burnAddress = _burnAddress;

        // NOTE - deep copies arrays
        // Inputs validations
        PluginsLib.validateInputs(_inputs, inputs, nUse);

        uint256 erc721amount = 0;

        // Outputs validations
        for (uint256 i = 0; i < _outputs.length; i++) {
            if (_outputs[i].token == PluginsLib.TokenType.erc20) {
                require(_outputs[i].tokenIds.length == 0, 'CrafterMint: tokenids.length != 0');
                require(_outputs[i].amounts.length == 1, 'CrafterMint: amounts.length != 1');
                outputs.push(_outputs[i]);
            } else if (_outputs[i].token == PluginsLib.TokenType.erc721) {
                require(
                    _outputs[i].tokenIds.length == _craftableAmount,
                    'CrafterMint: tokenids.length != _craftableAmount'
                );
                require(_outputs[i].amounts.length == 0, 'CrafterMint: amounts.length != 0');
                erc721amount++;
                //Copy token data but set tokenIds as empty (these are filled out in the _deposit function call)
                PluginsLib.Ingredient memory x = PluginsLib.Ingredient({
                    token: PluginsLib.TokenType.erc721,
                    consumableType: _outputs[i].consumableType,
                    contractAddr: _outputs[i].contractAddr,
                    amounts: new uint256[](0),
                    tokenIds: new uint256[](0)
                });
                outputs.push(x);
            } else if (_outputs[i].token == PluginsLib.TokenType.erc1155) {
                require(
                    _outputs[i].tokenIds.length == _outputs[i].amounts.length,
                    'CrafterMint: tokenids.length != amounts.length'
                );
                outputs.push(_outputs[i]);
            }
        }

        uint256[][] memory _outputsERC721Ids = new uint256[][](erc721amount);
        uint256 outputERC721index = 0;

        for (uint256 i = 0; i < _outputs.length; i++) {
            if (_outputs[i].token == PluginsLib.TokenType.erc721) {
                _outputsERC721Ids[outputERC721index] = new uint256[](_craftableAmount);
                for (uint256 j = 0; j < _craftableAmount; j++) {
                    _outputsERC721Ids[outputERC721index][j] = _outputs[i].tokenIds[j];
                }
                outputERC721index++;
            }
        }

        if (_craftableAmount > 0) _deposit(_craftableAmount, _outputsERC721Ids);
        emit CreateRecipe(_msgSender(), _inputs, _outputs);
    }

    /**********************
            Getters
    **********************/

    /**
     * @dev Returns all inputs (without `amounts` or `tokenIds`)
     */
    function getInputs() public view returns (PluginsLib.Ingredient[] memory _inputs) {
        return inputs;
    }

    /**
     * @dev Returns all outputs (without `amounts` or `tokenIds`)
     */
    function getOutputs() public view returns (PluginsLib.Ingredient[] memory _outputs) {
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
            PluginsLib.TokenType token,
            PluginsLib.ConsumableType consumableType,
            address contractAddr,
            uint256[] memory amounts,
            uint256[] memory tokenIds
        )
    {
        PluginsLib.Ingredient storage i = inputs[index];

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
            PluginsLib.TokenType token,
            PluginsLib.ConsumableType consumableType,
            address contractAddr,
            uint256[] memory amounts,
            uint256[] memory tokenIds
        )
    {
        PluginsLib.Ingredient storage i = outputs[index];

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
    function deposit(uint96 depositAmount, uint256[][] calldata _outputsERC721Ids) public onlyOwner {
        _deposit(depositAmount, _outputsERC721Ids);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to deposit recipe outputs
     * @param depositAmount How many times the recipe should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     */
    function _deposit(uint96 depositAmount, uint256[][] memory _outputsERC721Ids) internal {
        //Requires
        require(depositAmount > 0, 'CrafterMint: depositAmount cannot be 0!');

        uint256 erc721Outputs = 0;

        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc721) {
                //Transfer ERC721
                require(
                    _outputsERC721Ids[erc721Outputs].length == depositAmount,
                    '_outputsERC721Ids[i] != depositAmount'
                );
                for (uint256 j = 0; j < _outputsERC721Ids[erc721Outputs].length; j++) {
                    require(
                        !ERC721Owl(ingredient.contractAddr).exists(_outputsERC721Ids[erc721Outputs][j]),
                        'tokenId already minted'
                    );
                    //Update ingredient, push additional ERC721 tokenId
                    ingredient.tokenIds.push(_outputsERC721Ids[erc721Outputs][j]);
                }
                erc721Outputs += 1;
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
    function withdraw(uint96 withdrawAmount) external onlyOwner {
        // Requires
        require(withdrawAmount > 0, 'CrafterMint: withdrawAmount cannot be 0!');
        require(withdrawAmount <= craftableAmount, 'CrafterMint: Not enough resources!');

        // Decrease craftableAmount (check-effects)
        craftableAmount -= withdrawAmount;

        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc721) {
                //Pop tokenIds from end of array
                for (uint256 j = 0; j < withdrawAmount; j++) ingredient.tokenIds.pop();
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
    function craft(uint96 craftAmount, uint256[][] calldata _inputERC721Ids) public {
        // Requires
        require(craftAmount > 0, 'CrafterMint: craftAmount cannot be 0!');
        require(craftAmount <= craftableAmount, 'CrafterMint: Not enough resources to craft!');

        // Update crafting stats (check-effects)
        craftableAmount -= craftAmount;

        //Track ERC721 inputs idx
        uint256 erc721Inputs = 0;

        //Transfer inputs
        for (uint256 i = 0; i < inputs.length; i++) {
            PluginsLib.Ingredient storage ingredient = inputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc20) {
                //ERC20
                if (ingredient.consumableType == PluginsLib.ConsumableType.burned) {
                    //Transfer ERC20
                    SafeERC20Upgradeable.safeTransferFrom(
                        IERC20Upgradeable(ingredient.contractAddr),
                        _msgSender(),
                        burnAddress,
                        ingredient.amounts[0] * craftAmount
                    );
                } else if (ingredient.consumableType == PluginsLib.ConsumableType.unaffected) {
                    //Check ERC20
                    require(
                        IERC20Upgradeable(ingredient.contractAddr).balanceOf(_msgSender()) >=
                            ingredient.amounts[0] * craftAmount,
                        'CrafterMint: User missing minimum token balance(s)!'
                    );
                }
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                //ERC721
                require(
                    _inputERC721Ids[erc721Inputs].length == craftAmount,
                    'CrafterMint: _inputERC721Ids[i] != craftAmount'
                );
                uint256[] memory currInputArr = _inputERC721Ids[erc721Inputs];
                if (ingredient.consumableType == PluginsLib.ConsumableType.burned) {
                    //Transfer ERC721
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                            _msgSender(),
                            burnAddress,
                            _inputERC721Ids[erc721Inputs][j]
                        );
                    }
                } else if (ingredient.consumableType == PluginsLib.ConsumableType.unaffected) {
                    //Check ERC721
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        require(
                            IERC721Upgradeable(ingredient.contractAddr).ownerOf(currInputArr[j]) == _msgSender(),
                            'CrafterMint: User does not own token(s)!'
                        );
                    }
                } else if (ingredient.consumableType == PluginsLib.ConsumableType.NTime) {
                    //Check ERC721
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        require(
                            IERC721Upgradeable(ingredient.contractAddr).ownerOf(currInputArr[j]) == _msgSender(),
                            'CrafterMint: User does not own token(s)!'
                        );
                        uint256 currTokenID = currInputArr[j];
                        require(
                            (usedERC721Inputs[ingredient.contractAddr])[currTokenID] < nUse[i],
                            'CrafterMint: Used over the limit of n'
                        );
                        (usedERC721Inputs[ingredient.contractAddr])[currTokenID] += 1;
                    }
                }
                erc721Inputs += 1;
            } else if (ingredient.token == PluginsLib.TokenType.erc1155) {
                //ERC1155
                if (ingredient.consumableType == PluginsLib.ConsumableType.burned) {
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
                } else if (ingredient.consumableType == PluginsLib.ConsumableType.unaffected) {
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
                        require(balances[j] >= amounts[j], 'CrafterMint: User missing minimum token balance(s)!');
                    }
                }
            }
        }

        //Mint outputs
        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc20) {
                //Transfer ERC20
                ERC20Owl(ingredient.contractAddr).mint(_msgSender(), ingredient.amounts[0] * craftAmount);
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                //Pop token ids from storage
                for (uint256 j = 0; j < craftAmount; j++) {
                    ERC721Owl(ingredient.contractAddr).mint(_msgSender(), ingredient.tokenIds[ingredient.tokenIds.length - 1]);
                    
                    //Update ingredient, remove withdrawn tokenId
                    ingredient.tokenIds.pop();
                }
            } else if (ingredient.token == PluginsLib.TokenType.erc1155) {
                //Transfer ERC1155
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * craftAmount;
                }
                ERC1155Owl(ingredient.contractAddr).mintBatch(_msgSender(), ingredient.tokenIds, amounts, new bytes(0));
            }
        }

        emit RecipeCraft(craftAmount, craftableAmount, _msgSender());
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
