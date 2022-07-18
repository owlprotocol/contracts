//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';

import './OwlBase.sol';

contract OwlMulticall is OwlBase {
    using AddressUpgradeable for address;

    address[] contracts;
    bytes[] sigs;

    function initialize(
        address _admin,
        address[] calldata _contracts,
        bytes[] calldata _sigs
    ) external initializer {
        __OwlMulticall_init(_admin, _contracts, _sigs);
    }

    function proxyInitialize(
        address _admin,
        address[] calldata _contracts,
        bytes[] calldata _sigs
    ) external onlyInitializing {
        __OwlMulticall_init(_admin, _contracts, _sigs);
    }

    function __OwlMulticall_init(
        address _admin,
        address[] calldata _contracts,
        bytes[] calldata _sigs
    ) internal onlyInitializing {
        // __OwlBase_init(_admin);
        __OwlMulticall_init_unchained(_contracts, _sigs);
    }

    function __OwlMulticall_init_unchained(address[] calldata _contracts, bytes[] calldata _sigs)
        internal
        onlyInitializing
    {
        //last signature to be filled out by caller
        require(contracts.length == sigs.length + 1, 'contracts.length != sigs.length + 1');
        contracts = _contracts;
        sigs = _sigs;
    }

    function executMultiCall(bytes[] calldata args) external {
        require(args.length == contracts.length, 'args.length != contracts.length');
        for (uint256 i = 0; i < contracts.length; i++) {}
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return false;
    }
}
