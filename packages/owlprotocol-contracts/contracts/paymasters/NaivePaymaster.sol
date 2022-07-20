// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

import '@opengsn/contracts/src/forwarder/IForwarder.sol';
import '@opengsn/contracts/src/BasePaymaster.sol';

import './OwlPaymasterBase.sol';

/**
 * @dev This paymaster will approve transactions sent through a relay provider
 * by the target contracts that are updated in the 'targets' mapping. This
 * mapping maps an address to a boolean to indicate whether or not the address
 * can be approved or not for gasless transactions
 * https://docs.opengsn.org/tutorials/integration.html#creating_a_paymaster
 */
contract NaivePaymaster is OwlPaymasterBase {
    //maps addresses to bool to indicate if they are approved for gasless transactions
    mapping(address => bool) targets;

    // allow the owner to set ourTarget
    event TargetSet(address target);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev initializes a paymaster contract
     * @param _admin admin of the paymaster
     * @param _target the target address that should be approved for gasless transactions
     * @param _forwarder address for the trusted forwarder for open GSN
     */
    function initialize(
        address _admin,
        address _target,
        address _forwarder
    ) external initializer {
        __NaivePaymaster_init(_admin, _target, _forwarder);
    }

    function proxyinitialize(
        address _admin,
        address _target,
        address _forwarder
    ) external onlyInitializing {
        __NaivePaymaster_init(_admin, _target, _forwarder);
    }

    function __NaivePaymaster_init(
        address _admin,
        address _target,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_admin, _forwarder);
        __NaivePaymaster_init_unchained(_target);
    }

    function __NaivePaymaster_init_unchained(address _target) internal onlyInitializing {
        targets[_target] = true;
        emit TargetSet(_target);
    }

    /**
     * @dev updates the mapping of target addresses to approve
     * the passed in address
     */
    function setTarget(address target) external onlyRole(DEFAULT_ADMIN_ROLE) {
        targets[target] = true;
        emit TargetSet(target);
    }

    /**
     * @dev updates the mapping of target addresses to disapprove
     * the passed in address
     */
    function removeTarget(address target) external onlyRole(DEFAULT_ADMIN_ROLE) {
        targets[target] = false;
    }

    event PreRelayed(uint256);
    event PostRelayed(uint256);

    /**
     * @dev function that performs all access control. It verifies that
     * the relay request passes in an address that has been set as a
     * target address and is approved for a gasless transaction
     */
    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external virtual override returns (bytes memory context, bool) {
        _verifyForwarder(relayRequest);
        (signature, approvalData, maxPossibleGas);

        require(targets[relayRequest.request.to] == true);
        emit PreRelayed(block.timestamp);
        return (abi.encode(block.timestamp), false);
    }

    /**
     * @dev function that performs all bookkeeping after a function call
     * has been made.
     */
    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external virtual override {
        (context, success, gasUseWithoutPost, relayData);
        emit PostRelayed(abi.decode(context, (uint256)));
    }

    /**
     * @dev function that is required for open GSN paymasters
     */
    function versionPaymaster() external view virtual override returns (string memory) {
        return '2.0.3';
    }
}
