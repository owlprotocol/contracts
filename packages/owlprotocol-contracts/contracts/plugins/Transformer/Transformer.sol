// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '../../assets/ERC721/ERC721OwlAttributes.sol';
import './TransformerCore.sol';

/**
 * @dev Contract module that enables "transformation" of {ERC721OwlAttributes}
 * tokens. The assumption with {ERC721OwlAttributes} is that the attributes of
 * one individual token are encoded into a number, called "dna". This number is
 * then mapped to the `tokenId`. Transforming configuration is set by one
 * {Ingredient}[] (the inputs) and a {GeneMod}[] (the modifications). The inputs
 * are the cost for the modifications to go through (as set by the contract
 * deployer).
 *
 * ```
 * enum GeneTransformType {
 *     none,
 *     add,
 *     sub,
 *     mult,
 *     set
 * }
 *
 * struct GeneMod {
 *     GeneTransformType geneTransformType;
 *     uint256 value;
 * }
 *
 * struct Ingredient {
 *     TokenType token;
 *     ConsumableType consumableType;
 *     address contractAddr;
 *     uint256[] amounts;
 *     uint256[] tokenIds;
 * }
 * ```
 *
 * Once the {Ingredient}s in the `inputs` array have been used/consumed, the
 * contract will update the "dna" associated with the `tokenId` submitted by the
 * user. See {ERC721OwlAttributes} for an in-depth explanation of how "dna"
 * encodes `tokenId` attributes.
 */
contract Transformer is TransformerCore, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Transformer/', _version)));

    /**********************
             Events
    **********************/
    event Transform(address indexed nftAddr, uint256 indexed tokenId, uint256 oldDna, uint256 newDna);

    /**********************
             Storage
    **********************/

    address public burnAddress;
    Ingredient[] private inputs;
    address nftAddr;

    uint8[] genes;
    GeneMod[] modifications;

    /**********************
        Initialization
    **********************/
    /**
     * @dev Initializes contract (replaces constructor in proxy pattern)
     * @param _admin owner, no special permissions as of current release
     * @param _burnAddress Burn address for burn inputs
     * @param _inputs input ingredients for configuration
     * @param _genes array denoting start location of genes within the 256 bit
     * DNA
     * @param _modifications array denoting the modifications to be made upon
     * each gene after transformation
     * @param _nftAddr the address of the ERC721Owl contract
     * @param _forwarder trusted forwarder address for open GSN
     */
    function initialize(
        address _admin,
        address _burnAddress,
        Ingredient[] calldata _inputs,
        uint8[] memory _genes,
        GeneMod[] memory _modifications,
        address _nftAddr,
        address _forwarder
    ) external initializer {
        __Transformer_init(_admin, _burnAddress, _inputs, _genes, _modifications, _nftAddr, _forwarder);
    }

    /**
     * @dev Initializes contract through beacon proxy (replaces constructor in
     * proxy pattern)
     */
    function proxyInitialize(
        address _admin,
        address _burnAddress,
        Ingredient[] calldata _inputs,
        uint8[] memory _genes,
        GeneMod[] memory _modifications,
        address _nftAddr,
        address _forwarder
    ) external onlyInitializing {
        __Transformer_init(_admin, _burnAddress, _inputs, _genes, _modifications, _nftAddr, _forwarder);
    }

    /**
     * @dev performs validations that `_inputs` are valid and
     * creates the configuration
     */
    function __Transformer_init(
        address _admin,
        address _burnAddress,
        Ingredient[] calldata _inputs,
        uint8[] memory _genes,
        GeneMod[] memory _modifications,
        address _nftAddr,
        address _forwarder
    ) internal onlyInitializing {
        require(_burnAddress != address(0), 'Transformer: burn address must not be 0');
        require(_inputs.length > 0, 'Transformer: A crafting input must be given!');
        __OwlBase_init(_admin, _forwarder);

        __Transformer_init_unchained(_burnAddress, _inputs, _genes, _modifications, _nftAddr);
    }

    /**
     * @dev performs validations that `_inputs` and are valid and
     * creates the configuration
     */
    function __Transformer_init_unchained(
        address _burnAddress,
        Ingredient[] calldata _inputs,
        uint8[] memory _genes,
        GeneMod[] memory _modifications,
        address _nftAddr
    ) internal onlyInitializing {
        _validateInputs(_inputs, inputs);

        require(
            _genes.length == _modifications.length,
            'Transformer: length of genes must be the same as length of modifications'
        );

        for (uint256 i = 0; i < _modifications.length; i++) {
            modifications.push(_modifications[i]); // deep copy
        }

        burnAddress = _burnAddress;
        genes = _genes;
        nftAddr = _nftAddr;
    }

    /**********************
         Interaction
    **********************/

    /**
     * @dev Used to transform. Consumes inputs and modifies DNA of inputted NFT
     * token.
     * @notice the transformer instance from which this method is called from
     * must have ERC721OwlAttributes DNA_ROLE
     * @param tokenId ID of NFT token to transform
     * @param _inputERC721Ids Array of pre-approved NFTs for crafting usage.
     */
    function transform(uint256 tokenId, uint256[][] calldata _inputERC721Ids) external {
        require(
            IERC721Upgradeable(nftAddr).ownerOf(tokenId) == _msgSender(),
            'Transformer: you are not the owner of that ID!'
        );

        _useInputs(inputs, _msgSender(), burnAddress, _inputERC721Ids, 1);

        // Transform DNA
        uint256 currDna = ERC721OwlAttributes(nftAddr).getDna(tokenId);
        uint256 newDna = transform(currDna, genes, modifications);

        // This contract must have DNA_ROLE
        ERC721OwlAttributes(nftAddr).updateDna(tokenId, newDna);
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
        override(OwlBase, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
