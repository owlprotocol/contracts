//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

/**
 * @dev Base for all OWLPROTOCOL contracts
 */
abstract contract OwlBase is UUPSUpgradeable, AccessControlUpgradeable {
    string internal constant __version = 'v0.1';
    bytes32 internal constant ROUTER_ROLE = keccak256('ROUTER_ROLE');

    function __OwlBase_init(address _admin, address _forwarder) internal onlyInitializing {
        __OwlBase_init_unchained(_admin, _forwarder);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ROUTER_ROLE, _forwarder);
    }

    function __OwlBase_init_unchained(address _admin, address _forwarder) internal onlyInitializing {}

    /**
     * @notice **REQUIRED FOR GSN**
     * @dev Return trusted forwarder status.
     */
    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return hasRole(ROUTER_ROLE, forwarder);
    }

    /**
     * @notice Must have owner role
     * @dev Grants ROUTER_ROLE to {a}
     * @param to address to
     */
    function grantRouter(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ROUTER_ROLE, to);
    }

    /**
     * UUPS functions
     */
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
    function _msgSender() internal view virtual override returns (address ret) {
        if (msg.data.length >= 20 && hasRole(ROUTER_ROLE, msg.sender)) {
            // At this point we know that the sender is a trusted forwarder,
            // so we trust that the last bytes of msg.data are the verified sender address.
            // extract sender address from the end of msg.data
            assembly {
                ret := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            ret = msg.sender;
        }
    }

    function _msgData() internal view virtual override returns (bytes calldata) {
        if (msg.data.length >= 20 && hasRole(ROUTER_ROLE, msg.sender)) {
            return msg.data[0:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }

    function versionRecipient() external pure virtual returns (string memory) {
        return '2.2.6';
    }

    // function version() external pure virtual returns (string memory) {
    //     return __version;
    // }
}
