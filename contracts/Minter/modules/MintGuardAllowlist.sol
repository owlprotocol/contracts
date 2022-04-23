//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IMinterCore.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev Allowlist MintGuard for Minter
 *
 */
contract MintGuardAllowlist is ERC165 {

    // TODO - events
    // TODO - docs

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
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, user));
        // Add user to allowed minters
        allowedMinters[key] = true;
    }

    function removeAllowedUser(
        address minterContract,
        uint256 speciesId,
        address user
    ) isSpeciesOwner(minterContract, speciesId) public {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, user));
        // Permission to this contract species for user
        allowedMinters[key] = false;
    }

    function allowMint(
        uint256 speciesId,
        address user
    ) public view returns (bool) {
        bytes32 key = keccak256(abi.encode(msg.sender, speciesId, user));
        return allowedMinters[key];
    }

}
