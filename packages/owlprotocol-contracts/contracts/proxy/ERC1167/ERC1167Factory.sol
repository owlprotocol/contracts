// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ClonesUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol';
import {ContextUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

/**
 * @dev ERC1167 Minimal Proxy Factory
 */
contract ERC1167Factory is ContextUpgradeable {
    event NewClone(address instance, address implementation, bytes32 salt);

    function clone(address implementation, bytes memory data) public returns (address instance) {
        instance = ClonesUpgradeable.clone(implementation);

        //data is optional
        if (data.length > 0) callInitializer(instance, data);

        emit NewClone(instance, implementation, bytes32(0));
    }

    function cloneDeterministic(
        address implementation,
        bytes32 salt,
        bytes memory data
    ) public returns (address instance) {
        //Salt init data
        salt = keccak256(abi.encodePacked(salt, _msgSender(), data));
        instance = ClonesUpgradeable.cloneDeterministic(implementation, salt);

        //data is optional
        if (data.length > 0) callInitializer(instance, data);

        emit NewClone(instance, implementation, salt);
    }

    function callInitializer(address instance, bytes memory data) internal {
        (bool s, ) = instance.call(data);
        require(s, 'Create2CloneFactory: Failed to call the proxy');
    }

    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        bytes memory data
    ) public view returns (address predicted) {
        //Salt init data
        salt = keccak256(abi.encodePacked(salt, _msgSender(), data));
        predicted = ClonesUpgradeable.predictDeterministicAddress(implementation, salt);
    }
}
