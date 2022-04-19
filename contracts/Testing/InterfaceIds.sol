//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Minter/IMinterCore.sol";
import "../Minter/builds/IMinterAutoId.sol";
import "../Minter/builds/IMinterBreeding.sol";
import "../Minter/builds/IMinterRandom.sol";
import "../Minter/builds/IMinterSimple.sol";

/**
 * @dev **INTERNAL TOOL**
 * Used to get generated ERC165 interface Ids
 */
contract InterfaceIds {

    function minterCoreInterfaceId() public pure returns (bytes4) { return type(IMinterCore).interfaceId; }
    function minterAutoIdInterfaceId() public pure returns (bytes4) { return type(IMinterAutoId).interfaceId; }
    function minterBreedingInterfaceId() public pure returns (bytes4) { return type(IMinterBreeding).interfaceId; }
    function minterRandomInterfaceId() public pure returns (bytes4) { return type(IMinterRandom).interfaceId; }
    function minterSimpleInterfaceId() public pure returns (bytes4) { return type(IMinterSimple).interfaceId; }

}
