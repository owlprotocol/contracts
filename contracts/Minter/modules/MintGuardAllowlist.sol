//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IMinterCore.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MintGuardAllowlist is ERC165 {

    // // Constructor
    // constructor () {
    //     // Register Private Name
    //     bytes32 interfaceName = keccak256("OWLProtocol://MinterCore");
    //     ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
    //     // Register ERC165 Interface
    //     ERC165Storage._registerInterface(type(IMinterCore).interfaceId);
    // }

    // Store a hash of [ minterContract + speciesId + user ]
    // Allows us to condense the storage down to one slot
    mapping (bytes32 => bool) allowedMinters;

    modifier isSpeciesOwner(address minterContract, uint256 speciesId) {
        // Assert that this user actually has permission to do this
        address minterOwner;
        (,minterOwner,,,) = IMinterCore(minterContract).getSpecies(speciesId);
        require(minterOwner == msg.sender, "Not the owner!");
        _;
    }

    function addAllowedUser(
        address minterContract,
        uint256 speciesId,
        address user
    ) isSpeciesOwner(minterContract, speciesId) public {
        // Add user to allowed minters
        allowedMinters[
            // Permission to this contract species for user
            keccak256(abi.encode(minterContract, speciesId, user))
        ] = true;
    }

    function removeAllowedUser(
        address minterContract,
        uint256 speciesId,
        address user
    ) isSpeciesOwner(minterContract, speciesId) public {
        allowedMinters[
            // Permission to this contract species for user
            keccak256(abi.encode(minterContract, speciesId, user))
        ] = false;
    }

}
