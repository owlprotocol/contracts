// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '../../OwlBase.sol';
import '../PluginsLib.sol';
import 'hardhat/console.sol';

/**
 * @dev Pluggable Transformer Contract.
 * Players can interact with the contract to have
 * recipie outputs transferred from a deposit.
 */
contract Transformer is OwlBase, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Transformer/', version)));

    /**********************
             Events
    **********************/
    event Transform(address indexed nftAddr, uint256 indexed tokenId, uint256 oldDna, uint256 newDna);

    /**********************
             Storage
    **********************/

    address public burnAddress;
    PluginsLib.Ingredient[] private inputs;
    address nftAddr;

    uint8[] genes;
    PluginsLib.GeneMod[] modifications;

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
     * @param _forwarder trusted forwarder address for open GSN
     */
    function initialize(
        address _admin,
        address _burnAddress,
        PluginsLib.Ingredient[] memory _inputs,
        uint8[] memory _genes,
        PluginsLib.GeneMod[] memory _modifications,
        address _nftAddr,
        address _forwarder
    ) external initializer {
        __Transformer_init(_admin, _burnAddress, _inputs, _genes, _modifications, _nftAddr, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        address _burnAddress,
        PluginsLib.Ingredient[] memory _inputs,
        uint8[] memory _genes,
        PluginsLib.GeneMod[] memory _modifications,
        address _nftAddr,
        address _forwarder
    ) external onlyInitializing {
        __Transformer_init(_admin, _burnAddress, _inputs, _genes, _modifications, _nftAddr, _forwarder);
    }

    function __Transformer_init(
        address _admin,
        address _burnAddress,
        PluginsLib.Ingredient[] memory _inputs,
        uint8[] memory _genes,
        PluginsLib.GeneMod[] memory _modifications,
        address _nftAddr,
        address _forwarder
    ) internal onlyInitializing {
        require(_burnAddress != address(0), 'Transformer: burn address must not be 0');
        require(_inputs.length > 0, 'Transformer: A crafting input must be given!');

        __OwlBase_init(_admin);
        __Transformer_init_unchained(_burnAddress, _inputs, _genes, _modifications, _nftAddr, _forwarder);
    }

    function __Transformer_init_unchained(
        address _burnAddress,
        PluginsLib.Ingredient[] memory _inputs,
        uint8[] memory _genes,
        PluginsLib.GeneMod[] memory _modifications,
        address _nftAddr,
        address _forwarder
    ) internal onlyInitializing {
        PluginsLib.validateInputs(_inputs, inputs, nUse);

        require(
            _genes.length == _modifications.length,
            'Transformer: length of genes must be the same as length of modifications'
        );

        for (uint256 i = 0; i < _modifications.length; i++) {
            modifications.push(_modifications[i]);
        }

        burnAddress = _burnAddress;
        genes = _genes;
        nftAddr = _nftAddr;

        //set trusted forwarder for open gsn
        _setTrustedForwarder(_forwarder);
    }

    /**
     * @dev Used to transform. Consumes inputs and modifies DNA of inputted NFT token.
     * @param tokenId ID of NFT token to transform
     * @param _inputERC721Ids Array of pre-approved NFTs for crafting usage.
     */

    function transform(uint256 tokenId, uint256[][] calldata _inputERC721Ids) external {
        require(
            IERC721Upgradeable(nftAddr).ownerOf(tokenId) == _msgSender(),
            'Transformer: you are not the owner of that ID!'
        );

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
                        ingredient.amounts[0]
                    );
                } else {} // this is unaffected consumable type, otherwise validate inputs will revert
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                //ERC721
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
                } else {
                    //this is N-Time (otherwise, pluginsLib will revert when validating inputs)
                    for (uint256 j = 0; j < currInputArr.length; j++) {
                        require(
                            IERC721Upgradeable(ingredient.contractAddr).ownerOf(currInputArr[j]) == _msgSender(),
                            'Transformer: User does not own token(s)!'
                        );
                        uint256 currTokenID = currInputArr[j];
                        require(
                            (usedERC721Inputs[ingredient.contractAddr])[currTokenID] < nUse[i],
                            'Transformer: Used over the limit of n'
                        );
                        (usedERC721Inputs[ingredient.contractAddr])[currTokenID] += 1;
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
                        amounts[j] = ingredient.amounts[j];
                    }
                    IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                        _msgSender(),
                        burnAddress,
                        ingredient.tokenIds,
                        amounts,
                        new bytes(0)
                    );
                } else {} //this is unaffected, as ensured by input validations
            }
        }

        // transform DNA
        uint256 currDna = ERC721OwlAttributes(nftAddr).getDna(tokenId);
        uint256 newDna = PluginsLib.transform(currDna, genes, modifications);
        ERC721OwlAttributes(nftAddr).updateDna(tokenId, newDna); // this contract must have DNA_ROLE

        emit Transform(nftAddr, tokenId, currDna, newDna);
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
        override(ERC1155ReceiverUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
