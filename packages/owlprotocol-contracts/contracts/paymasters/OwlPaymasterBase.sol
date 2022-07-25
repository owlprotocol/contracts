//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '../OwlBase.sol';
import '@opengsn/contracts/src/interfaces/IPaymaster.sol';
import '@opengsn/contracts/src/interfaces/IRelayHub.sol';
import '@opengsn/contracts/src/utils/GsnEip712Library.sol';
import '@opengsn/contracts/src/forwarder/IForwarder.sol';
import '@opengsn/contracts/src/utils/GsnTypes.sol';

/**
 * @dev this abstract contract is the base for all Owl Paymasters.
 * It inherits from BasePaymaster implemented by Open GSN and it
 * also inherits from OwlBase to allow for creating Beacon proxies
 * and instances.
 */
abstract contract OwlPaymasterBase is OwlBase, IPaymaster {
    IRelayHub internal relayHub;
    address private _trustedForwarder;

    function getHubAddr() public view override returns (address) {
        return address(relayHub);
    }

    //overhead of forwarder verify+signature, plus hub overhead.
    uint256 public constant FORWARDER_HUB_OVERHEAD = 50000;

    //These parameters are documented in IPaymaster.GasAndDataLimits
    uint256 public constant PRE_RELAYED_CALL_GAS_LIMIT = 100000;
    uint256 public constant POST_RELAYED_CALL_GAS_LIMIT = 110000;
    uint256 public constant PAYMASTER_ACCEPTANCE_BUDGET = PRE_RELAYED_CALL_GAS_LIMIT + FORWARDER_HUB_OVERHEAD;
    uint256 public constant CALLDATA_SIZE_LIMIT = 10500;

    function getGasAndDataLimits() public view virtual override returns (IPaymaster.GasAndDataLimits memory limits) {
        return
            IPaymaster.GasAndDataLimits(
                PAYMASTER_ACCEPTANCE_BUDGET,
                PRE_RELAYED_CALL_GAS_LIMIT,
                POST_RELAYED_CALL_GAS_LIMIT,
                CALLDATA_SIZE_LIMIT
            );
    }

    // this method must be called from preRelayedCall to validate that the forwarder
    // is approved by the paymaster as well as by the recipient contract.
    function _verifyForwarder(GsnTypes.RelayRequest calldata relayRequest) public view {
        require(address(_trustedForwarder) == relayRequest.relayData.forwarder, 'Forwarder is not trusted');
        GsnEip712Library.verifyForwarderTrusted(relayRequest);
    }

    /*
     * modifier to be used by recipients as access control protection for preRelayedCall & postRelayedCall
     */
    modifier relayHubOnly() {
        require(msg.sender == getHubAddr(), 'can only be called by RelayHub');
        _;
    }

    function setRelayHub(IRelayHub hub) public onlyRole(DEFAULT_ADMIN_ROLE) {
        relayHub = hub;
    }

    function setTrustedForwarder(address forwarder) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _trustedForwarder = forwarder;
    }

    function trustedForwarder() public view virtual override returns (address) {
        return _trustedForwarder;
    }

    /// check current deposit on relay hub.
    function getRelayHubDeposit() public view override returns (uint256) {
        return relayHub.balanceOf(address(this));
    }

    // any money moved into the paymaster is transferred as a deposit.
    // This way, we don't need to understand the RelayHub API in order to replenish
    // the paymaster.
    receive() external payable virtual {
        require(address(relayHub) != address(0), 'relay hub address not set');
        relayHub.depositFor{value: msg.value}(address(this));
    }

    /// withdraw deposit from relayHub
    function withdrawRelayHubDepositTo(uint256 amount, address payable target) public onlyRole(DEFAULT_ADMIN_ROLE) {
        relayHub.withdraw(amount, target);
    }

    function _msgSender() internal view virtual override(OwlBase) returns (address ret) {
        return OwlBase._msgSender();
    }

    function _msgData() internal view virtual override(OwlBase) returns (bytes calldata) {
        return OwlBase._msgData();
    }
}
