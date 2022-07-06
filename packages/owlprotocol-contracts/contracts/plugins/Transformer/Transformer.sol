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

import './TransformerLib.sol';

/**
 * @dev Pluggable Crafting Contract.
 * Players can interact with the contract to have
 * recipie outputs transferred from a deposit.
 */
contract Transformer is
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Transformer/', version)));

    /**********************
             Types
    **********************/
     
    TransformerLib.Ingredient[] private inputs;

    address public burnAddress;

    uint8[] genes;
    TransformerLib.GeneMod[] modifications;

    mapping(uint256 => uint256) nUse; //maps ingredient to nUSE (max count grabbed from amount[0])
    mapping(address => mapping(uint256 => uint256)) usedERC721Inputs; //maps a contract address to a tokenId to nUsed 

    /**********************
        Initialization
    **********************/
    /**
     * @notice Create recipe
     * @dev Configures crafting recipe with inputs/outputs
     * @param _burnAddress Burn address for burn inputs
     * @param _inputs inputs for recipe
     */
    function initialize(
        address _admin,
        address _burnAddress,
        TransformerLib.Ingredient[] calldata _inputs,
        uint8[] calldata _genes,
        TransformerLib.GeneMod[] calldata _modifications
    ) external initializer {
        __Transformer_init(_admin, _burnAddress, _inputs, _genes, _modifications);
    }

    function proxyInitialize(
        address _admin,
        address _burnAddress,
        TransformerLib.Ingredient[] calldata _inputs,
        uint8[] calldata _genes,
        TransformerLib.GeneMod[] calldata _modifications
    ) external onlyInitializing {
        __Transformer_init(_admin, _burnAddress, _inputs, _genes, _modifications);
    }

    function __Transformer_init(
        address _admin,
        address _burnAddress,
        TransformerLib.Ingredient[] calldata _inputs,
        uint8[] calldata _genes,
        TransformerLib.GeneMod[] calldata _modifications
    ) internal onlyInitializing {
        require(_burnAddress != address(0), 'Transformer: burn address must not be 0');
        require(_inputs.length > 0, 'Transformer: A crafting input must be given!');

        __Ownable_init();
        _transferOwnership(_admin);
        
        __Transformer_init_unchained(_burnAddress, _inputs, _genes, _modifications);
    }

    function __Transformer_init_unchained(
        address _burnAddress,
        TransformerLib.Ingredient[] calldata _inputs,
        uint8[] calldata _genes,
        TransformerLib.GeneMod[] calldata _modifications
    ) internal onlyInitializing {

        // NOTE - deep copies arrays
        // Inputs validations
        for (uint256 i = 0; i < _inputs.length; i++) {
            if (_inputs[i].token == TransformerLib.TokenType.erc20) {
                require(_inputs[i].tokenIds.length == 0, 'CrafterTransfer: tokenids.length != 0');
                require(_inputs[i].amounts.length == 1, 'CrafterTransfer: amounts.length != 1');
            } else if (_inputs[i].token == TransformerLib.TokenType.erc721) {
                //accept all token ids as inputs
                require(_inputs[i].tokenIds.length == 0, 'CrafterTransfer: tokenIds.length != 0');

                //modified to support NTime
                if (_inputs[i].consumableType == TransformerLib.ConsumableType.NTime) {
                    require(
                        _inputs[i].amounts.length == 1,
                        'CrafterTransfer: amounts.length != 1; required for NTime ConsumableType'
                    );
                    nUse[i] = _inputs[i].amounts[0];
                } else require(_inputs[i].amounts.length == 0, 'CrafterTransfer: amounts.length != 1 or 0');
            } else if (_inputs[i].token == TransformerLib.TokenType.erc1155) {
                require(
                    _inputs[i].tokenIds.length == _inputs[i].amounts.length,
                    'CrafterTransfer: tokenids.length != amounts.length'
                );
            }
            inputs.push(_inputs[i]);
        }

        // Output validations
        require(_genes.length == _modifications.length, 'Transformer: length of genes must be the same as length of modifications');

        burnAddress = _burnAddress;
        genes = _genes;
        modifications = _modifications;
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
