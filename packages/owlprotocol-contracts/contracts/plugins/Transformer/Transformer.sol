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
 * @dev Contract module that enables transformation of ERC721Owl assets under
 * the same inputs -> outputs logic defined in the Crafter contracts. The
 * Transformer, like Crafter, takes different types of input assets (ERC20,
 * ERC721, ERC1155) in addition to the ERC721Owl to be transformed. However,
 * instead of a new output being transferred or minted to the caller,
 * transformations are made to the existing ERC721Owl's DNA. Logic regarding
 * ingredient consumable type follows that of the Crafter:
 *
 * Crafting configuration is designated by two {Ingredient}[]. One array is the
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
 * array denoting ERC20 token amount requirement. `tokenIds` should be empty.
 * NTime consumable type ERC721 inputs should have empty `tokenIds` and
 * `amounts[0]` equal to `n` - the maximum number of times the input can be used.
 * Burned ERC721 `inputs` elements should have empty `amounts` and `tokenIds`
 * array. This contract accepts *all* `tokenId`s from an ERC721 contract as
 * inputs. ERC721 `outputs` elements must have empty `amounts` array. `tokenIds`
 * array length should be `craftableAmount`. The `tokenIds` array will contain
 * the `tokenIds` to be transferred out when {craft} is called. Important to
 * note that output transfers will be from the *end* of the array since `.pop()`
 * is used.
 *
 * ERC1155 `inputs` and `outputs` elements should have the length of `amounts`
 * and `tokenIds` array be the same. The indices will be linked where each index
 * denotes how much of each ERC1155 `tokenId` is required.
 *
 * This module is used through composition. It can be deployed to create
 * crafting logic with asset contracts that are already on chain and active;
 * plug-and-play, so to speak.
 *
 * Transform configuration is designated by `admin`, `burnAddress`, and an
 * {Ingredient}[] of inputs, as in the Crafter. In addition, it takes an integer
 * array `genes` denoting the start point of each gene within the bit
 * representation of ERC721Owl's DNA. The `modifications` array is of the same
 * length of `genes`, as it describes the modifications that should be made to
 * each gene in the form of a `GeneMod` struct.
 *
 * ```
 * struct GeneMod
 * {
 *   GeneTransformType geneTransformType;
 *   uint256 value;
 * }
 * ```
 *
 * The GeneMod struct refers to a `GeneTransformType`, an enum that can be
 * declared as one of the operations: add, subtract, multiply, divide, or set.
 * The `value` then specifies the amount by which to perform the operation.
 *
 * This configuration is set in the initializers and cannot be edited once the
 * contract has been launched Other configurations will require their own
 * contract to be deployed.
 *
 * Upon successful completion of the `transform()` operation, the ERC721Owl with
 * the passed tokenId will have its DNA modified in-place, never having been
 * transferred out of the caller's possession.
 */
contract Transformer is TransformerCore, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
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
     * @dev performs validations that `_inputs` and `_outputs` are valid and
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
     * @dev performs validations that `_inputs` and `_outputs` are valid and
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
        override(AccessControlUpgradeable, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
