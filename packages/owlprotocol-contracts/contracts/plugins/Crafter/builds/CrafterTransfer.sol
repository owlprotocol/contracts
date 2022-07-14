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
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import '../ICrafter.sol';
import '../../PluginsLib.sol';
import 'hardhat/console.sol';

/**
 * @dev Pluggable Crafting Contract.
 * Players can interact with the contract to have
 * recipie outputs transferred from a deposit.
 */
contract CrafterTransfer is
    BaseRelayRecipient,
    ICrafter,
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    // Specification + ERC165
    bytes32 internal constant ROUTER_ROLE = keccak256('ROUTER_ROLE');
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://CrafterTransfer/', version)));

    /**********************
             Events
    **********************/

    event CreateRecipe(address indexed creator, PluginsLib.Ingredient[] inputs, PluginsLib.Ingredient[] outputs);
    event RecipeUpdate(uint256 craftableAmount);
    event RecipeCraft(uint256 craftedAmount, uint256 craftableAmount, address indexed user);

    /**********************
             Storage
    **********************/

    address public burnAddress;
    uint96 public craftableAmount;

    PluginsLib.Ingredient[] private inputs;
    PluginsLib.Ingredient[] private outputs;

    mapping(uint256 => uint256) nUse; //maps ingredient to nUSE (max count grabbed from amount[0])
    mapping(address => mapping(uint256 => uint256)) usedERC721Inputs; //maps a contract address to a tokenId to nUsed

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
     * @param _admin owner, can control outputs on contract
     * @param _burnAddress Burn address for burn inputs
     * @param _craftableAmount limit on the number of times this recipe can be crafted
     * @param _inputs inputs for recipe
     * @param _outputs outputs for recipe
     * @param _forwarder trusted forwarder address for openGSN
     */
    function initialize(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        PluginsLib.Ingredient[] calldata _inputs,
        PluginsLib.Ingredient[] calldata _outputs,
        address _forwarder
    ) external initializer {
        __CrafterTransfer_init(_admin, _burnAddress, _craftableAmount, _inputs, _outputs, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        PluginsLib.Ingredient[] calldata _inputs,
        PluginsLib.Ingredient[] calldata _outputs,
        address _forwarder
    ) external onlyInitializing {
        __CrafterTransfer_init(_admin, _burnAddress, _craftableAmount, _inputs, _outputs, _forwarder);
    }

    function __CrafterTransfer_init(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        PluginsLib.Ingredient[] calldata _inputs,
        PluginsLib.Ingredient[] calldata _outputs,
        address _forwarder
    ) internal onlyInitializing {
        require(_burnAddress != address(0), 'CrafterTransfer: burn address must not be 0');
        require(_inputs.length > 0, 'CrafterTransfer: A crafting input must be given!');
        require(_outputs.length > 0, 'CrafterTransfer: A crafting output must be given!');

        _transferOwnership(_admin);
        __CrafterTransfer_init_unchained(_admin, _burnAddress, _craftableAmount, _inputs, _outputs, _forwarder);
    }

    function __CrafterTransfer_init_unchained(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        PluginsLib.Ingredient[] calldata _inputs,
        PluginsLib.Ingredient[] calldata _outputs,
        address _forwarder
    ) internal onlyInitializing {
        burnAddress = _burnAddress;

        PluginsLib.validateInputs(_inputs, inputs, nUse);

        uint256 erc721Amount = PluginsLib.validateOutputs(_outputs, outputs, _craftableAmount);

        uint256[][] memory _outputsERC721Ids = PluginsLib.createOutputsArr(_outputs, _craftableAmount, erc721Amount);

        //sets trusted forwarder for open gsn
        _setTrustedForwarder(_forwarder);

        if (_craftableAmount > 0) _deposit(_craftableAmount, _outputsERC721Ids, _admin);
        emit CreateRecipe(_msgSender(), _inputs, _outputs);
    }

    /**
     * @notice Must have owner role
     * @dev Grants ROUTER_ROLE to {a}
     * @param to address to
     */
    function grantRouter(address to) public onlyOwner {
        _grantRole(ROUTER_ROLE, to);
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
        uint96 depositAmount,
        uint256[][] memory _outputsERC721Ids,
        address from
    ) internal {
        //Requires
        require(depositAmount > 0, 'CrafterTransfer: depositAmount cannot be 0!');

        uint256 erc721Outputs = 0;

        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc20) {
                //Transfer ERC20
                SafeERC20Upgradeable.safeTransferFrom(
                    IERC20Upgradeable(ingredient.contractAddr),
                    from,
                    address(this),
                    ingredient.amounts[0] * depositAmount
                );
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                //Transfer ERC721
                require(
                    _outputsERC721Ids[erc721Outputs].length == depositAmount,
                    'CrafterTransfer: _outputsERC721Ids[i] != depositAmount'
                );
                for (uint256 j = 0; j < _outputsERC721Ids[erc721Outputs].length; j++) {
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        from,
                        address(this),
                        _outputsERC721Ids[erc721Outputs][j]
                    );
                    //Update ingredient, push additional ERC721 tokenId
                    ingredient.tokenIds.push(_outputsERC721Ids[erc721Outputs][j]);
                }
                erc721Outputs += 1;
            } else if (ingredient.token == PluginsLib.TokenType.erc1155) {
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
    function withdraw(uint96 withdrawAmount) external onlyOwner {
        // Requires
        require(withdrawAmount > 0, 'CrafterTransfer: withdrawAmount cannot be 0!');
        require(withdrawAmount <= craftableAmount, 'CrafterTransfer: Not enough resources!');

        // Decrease craftableAmount (check-effects)
        craftableAmount -= withdrawAmount;

        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc20) {
                //Transfer ERC20
                SafeERC20Upgradeable.safeTransfer(
                    IERC20Upgradeable(ingredient.contractAddr),
                    _msgSender(),
                    ingredient.amounts[0] * withdrawAmount
                );
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                for (uint256 j = 0; j < withdrawAmount; j++) {
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        address(this),
                        _msgSender(),
                        ingredient.tokenIds[ingredient.tokenIds.length - 1]
                    );
                    ingredient.tokenIds.pop();
                }
            } else if (ingredient.token == PluginsLib.TokenType.erc1155) {
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

    function craft(uint96 craftAmount, uint256[][] calldata _inputERC721Ids) external {
        _craft(craftAmount, _inputERC721Ids, _msgSender());
    }

    function craft(
        uint96 craftAmount,
        uint256[][] calldata _inputERC721Ids,
        address _crafter
    ) external onlyRole(ROUTER_ROLE) {
        _craft(craftAmount, _inputERC721Ids, _crafter);
    }

    /**
     * @notice Craft {craftAmount}
     * @dev Used to craft. Consumes inputs and transfers outputs. Can only be called by forwarder contracts.
     * @param craftAmount How many times to craft
     * @param _inputERC721Ids Array of pre-approved NFTs for crafting usage.
     * @param _crafter the address of the client requesting to craft
     */
    function _craft(
        uint96 craftAmount,
        uint256[][] calldata _inputERC721Ids,
        address _crafter
    ) internal {
        // Requires
        require(craftAmount > 0, 'CrafterTransfer: craftAmount cannot be 0!');
        require(craftAmount <= craftableAmount, 'CrafterTransfer: Not enough resources to craft!');

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
                        _crafter,
                        burnAddress,
                        ingredient.amounts[0] * craftAmount
                    );
                } else {
                    // this is unaffected, as ensured by input validations
                    //Check ERC20
                    require(
                        IERC20Upgradeable(ingredient.contractAddr).balanceOf(_crafter) >=
                            ingredient.amounts[0] * craftAmount,
                        'CrafterTransfer: User missing minimum token balance(s)!'
                    );
                }
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                //ERC721
                uint256[] memory currInputArr = _inputERC721Ids[erc721Inputs];
                require(currInputArr.length == craftAmount, 'CrafterTransfer: _inputERC721Ids[i] != craftAmount');
                if (ingredient.consumableType == PluginsLib.ConsumableType.burned) {
                    //Transfer ERC721
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                            _crafter,
                            burnAddress,
                            currInputArr[j]
                        );
                    }
                } else {
                    //this is N-time, as ensured by input validations
                    //Check ERC721
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        require(
                            IERC721Upgradeable(ingredient.contractAddr).ownerOf(currInputArr[j]) == _crafter,
                            'CrafterTransfer: User does not own token(s)!'
                        );
                        uint256 currTokenId = currInputArr[j];
                        require(
                            (usedERC721Inputs[ingredient.contractAddr])[currTokenId] < nUse[i],
                            'CrafterTransfer: Used over the limit of n'
                        );
                        (usedERC721Inputs[ingredient.contractAddr])[currTokenId] += 1;
                    }
                }
                erc721Inputs += 1;
            } else {
                //this is 1155 token type, as ensured by input validations
                //ERC1155
                if (ingredient.consumableType == PluginsLib.ConsumableType.burned) {
                    //Transfer ERC1155
                    uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                    for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                        amounts[j] = ingredient.amounts[j] * craftAmount;
                    }
                    IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                        _crafter,
                        burnAddress,
                        ingredient.tokenIds,
                        amounts,
                        new bytes(0)
                    );
                } else {
                    //this is unaffected consumable type, as ensured by input validations
                    //Check ERC1155
                    uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                    address[] memory accounts = new address[](ingredient.amounts.length);
                    for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                        amounts[j] = ingredient.amounts[j] * craftAmount;
                        accounts[j] = _crafter;
                    }

                    uint256[] memory balances = IERC1155Upgradeable(ingredient.contractAddr).balanceOfBatch(
                        accounts,
                        ingredient.tokenIds
                    );
                    for (uint256 j = 0; j < balances.length; j++) {
                        require(balances[j] >= amounts[j], 'CrafterTransfer: User missing minimum token balance(s)!');
                    }
                }
            }
        }

        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsLib.Ingredient storage ingredient = outputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc20) {
                //Transfer ERC20
                SafeERC20Upgradeable.safeTransfer(
                    IERC20Upgradeable(ingredient.contractAddr),
                    _crafter,
                    ingredient.amounts[0] * craftAmount
                );
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                //Pop token ids from storage
                for (uint256 j = 0; j < craftAmount; j++) {
                    IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                        address(this),
                        _crafter,
                        ingredient.tokenIds[ingredient.tokenIds.length - 1]
                    );

                    ingredient.tokenIds.pop();
                }
            } else if (ingredient.token == PluginsLib.TokenType.erc1155) {
                //Transfer ERC1155
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j] * craftAmount;
                }
                IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                    address(this),
                    _crafter,
                    ingredient.tokenIds,
                    amounts,
                    new bytes(0)
                );
            }
        }

        emit RecipeCraft(craftAmount, craftableAmount, _crafter);
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
    function _msgSender() internal view override(BaseRelayRecipient, ContextUpgradeable) returns (address sender) {
        sender = BaseRelayRecipient._msgSender();
    }

    function _msgData() internal view override(BaseRelayRecipient, ContextUpgradeable) returns (bytes calldata) {
        return BaseRelayRecipient._msgData();
    }

    function versionRecipient() external pure override returns (string memory) {
        return '2.2.6';
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
