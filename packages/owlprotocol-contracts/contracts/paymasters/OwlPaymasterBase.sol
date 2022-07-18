//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '../OwlBase.sol';
import '@opengsn/contracts/src/BasePaymaster.sol';

abstract contract OwlPaymasterBase is OwlBase, BasePaymaster {
    function _msgSender() internal view virtual override(OwlBase, Context) returns (address ret) {
        return OwlBase._msgSender();
    }

    function _msgData() internal view virtual override(OwlBase, Context) returns (bytes calldata) {
        return OwlBase._msgData();
    }
}
