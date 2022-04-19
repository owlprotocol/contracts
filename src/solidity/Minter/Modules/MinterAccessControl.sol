// //SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// /**
//  * @dev Whitelist
//  *
//  */
// contract MinterAccessControl {

//     // SpeciesID => Access Rules
//     mapping (uint256 => AccessRules) private _accessRules;

//     struct AccessRules {
//         mapping(address => bool) whitelistedUsers;
//         address[] accessControlExtensions;
//     }

//     modifier onlyWhitelisted(uint256 speciesId, address user) {
//         require(isWhitelisted(speciesId, user));
//         _;
//     }

//     function isWhitelisted(uint256 speciesId, address user) public view returns (bool) {
//         return _accessRules[speciesId].whitelistedUsers[user];
//     }

//     function whitelistUser(uint256 speciesId, address user) public

// }
