//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '../OwlBase.sol';
import '@opengsn/contracts/src/BasePaymaster.sol';

/**
 * @dev this abstract contract is the base for all Owl Paymasters.
 * It inherits from BasePaymaster implemented by Open GSN and it
 * also inherits from OwlBase to allow for creating Beacon proxies
 * and instances.
 */
abstract contract OwlPaymasterBase is OwlBase, BasePaymaster {
    function _msgSender() internal view virtual override(OwlBase, Context) returns (address ret) {
        return OwlBase._msgSender();
    }

    function _msgData() internal view virtual override(OwlBase, Context) returns (bytes calldata) {
        return OwlBase._msgData();
    }
}
