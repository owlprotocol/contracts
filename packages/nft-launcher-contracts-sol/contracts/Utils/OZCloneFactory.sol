// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';

/**
 * @dev EIP1167 Minimal Proxy Factory
 */
contract OZClonesFactory {
    event NewClone(address instance, address implementation, bytes32 salt);

    function clone(address implementation, bytes memory data) public returns (address instance) {
        instance = Clones.clone(implementation);

        //data is optional
        if (data.length > 0) callInitializer(instance, data);

        emit NewClone(instance, implementation, bytes32(0));
    }

    function cloneDeterministic(
        address implementation,
        bytes32 salt,
        bytes memory data
    ) public returns (address instance) {
        instance = Clones.cloneDeterministic(implementation, salt);

        //data is optional
        if (data.length > 0) callInitializer(instance, data);

        emit NewClone(instance, implementation, salt);
    }

    function callInitializer(address instance, bytes memory data) internal {
        (bool s, ) = instance.call(data);
        require(s, 'Create2CloneFactory: Failed to call the proxy');
    }

    function predictDeterministicAddress(address implementation, bytes32 salt) public view returns (address predicted) {
        return Clones.predictDeterministicAddress(implementation, salt);
    }
}
