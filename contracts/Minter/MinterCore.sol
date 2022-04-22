//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IMinterCore.sol";
import "./modules/IMintGuard.sol";
import "../ERC721/IERC721Mintable.sol";
import "../ERC1820/ERC1820ImplementerAuthorizeAll.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
abstract contract MinterCore is ERC165Storage, ERC1820ImplementerAuthorizeAll {

    // Data Storage
    using Counters for Counters.Counter;
    Counters.Counter private speciesIds;

    mapping (uint256 => Species) internal species;

    // Structs
    struct Species {
        address contractAddr;
        address owner;
        address mintFeeToken;
        uint256 mintFeeAmount;
        address mintFeeAddress;
        address mintGuard;
    }

    // Modifiers
    modifier speciesOwner(uint256 speciesId) {
        // also tests for existence with below require
        require(msg.sender == species[speciesId].owner, "You are not the owner!");
        _;
    }
    modifier speciesExists(uint256 speciesId) {
        // tests for existence
        require(address(0) != species[speciesId].owner, "Species does not exist!");
        _;
    }
    modifier mintAllowed(uint256 speciesId) {
        // check mint guard
        address mintGuard = species[speciesId].mintGuard;
        if (mintGuard != address(0))
            require(IMintGuard(mintGuard).allowMint(speciesId, msg.sender) == true, "Mint denied!");
        _;
    }

    // Constructor
    constructor () {
        // Register Private Name
        bytes32 interfaceName = keccak256("OWLProtocol://MinterCore");
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterCore).interfaceId);
    }

    // Events
    event CreateSpecies(
        uint256 speciesId,
        address contractAddr,
        address indexed owner,
        address mintFeeToken,
        address mintFeeAddress,
        uint256 mintFeeAmount
    );

    /**
     * @dev Create a new type of species and define attributes.
     * @param contractAddress address of associated NFT
     * @param mintFeeToken ERC20 token used for mint expenses
     * @param mintFeeAddress ERC20 address to send minting funds to
     * @param mintFeeAmount ERC20 token amount to charge when minting
     */
    function createSpecies(
        address contractAddress,
        address mintFeeToken,
        address mintFeeAddress,
        uint256 mintFeeAmount
    ) public {
        // Species Counter
        speciesIds.increment();

        // Save our pointer
        Species storage s = species[speciesIds.current()];
        s.contractAddr = contractAddress;
        s.owner = msg.sender;
        s.mintFeeToken = mintFeeToken;
        s.mintFeeAddress = mintFeeAddress;
        s.mintFeeAmount = mintFeeAmount;

        emit CreateSpecies(
            speciesIds.current(),
            contractAddress,
            msg.sender,
            mintFeeToken,
            mintFeeAddress,
            mintFeeAmount
        );
    }

    /**
     * @dev Set external contract to determine whether minting is allowed or not.
     * @param speciesId identifier
     * @param mintGuardAddress contract address of the mint guard
     */
    function setMintGuard(
        uint256 speciesId,
        address mintGuardAddress
    ) public {
        species[speciesId].mintGuard = mintGuardAddress;
    }

    /**
     * @dev Returns features created for a species
     * @param speciesId species identifier
     */
    function getSpecies(
        uint256 speciesId
    ) public view returns (
        address contractAddr,
        address owner,
        address mintFeeToken,
        uint256 mintFeeAmount,
        address mintFeeAddress
    ) {
        Species storage s = species[speciesId];
        return (
            s.contractAddr,
            s.owner,
            s.mintFeeToken,
            s.mintFeeAmount,
            s.mintFeeAddress
        );
    }

    /**
     * @dev Base minting function (not safeMint). Called
     * by implementation contracts.
     * @param speciesId species identifier
     * @param buyer who's paying the ERC20 fee / gets the ERC721 token
     * @param tokenId the token identifier to mint
     */
    function _mintForFee(uint256 speciesId, address buyer, uint256 tokenId) mintAllowed(speciesId) internal {
        Species storage s = species[speciesId];

        // Transfer ERC20
        SafeERC20.safeTransferFrom(IERC20(s.mintFeeToken), buyer, s.mintFeeAddress, s.mintFeeAmount);

        // Call minting operation
        IERC721Mintable(s.contractAddr).mint(buyer, tokenId);
    }

    /**
     * @dev Base minting function (safeMint). Called
     * by implementation contracts.
     * @param speciesId species identifier
     * @param buyer who's paying the ERC20 fee / gets the ERC721 token
     * @param tokenId the token identifier to mint
     */
    function _safeMintForFee(uint256 speciesId, address buyer, uint256 tokenId) mintAllowed(speciesId) internal {
        Species storage s = species[speciesId];

        // Transfer ERC20
        SafeERC20.safeTransferFrom(IERC20(s.mintFeeToken), buyer, s.mintFeeAddress, s.mintFeeAmount);

        // Call minting operation
        IERC721Mintable(s.contractAddr).safeMint(buyer, tokenId);
    }
}
