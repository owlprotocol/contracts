//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

/**
 * @dev Base for all OwlProtocol contracts
 *
 * Implements several required mechanisms for all OwlProtocol contracts to
 * utilize:
 * - OpenGSN support (gasless transactions)
 * - Consistent contract versioning
 * - Consistent access control
 * - UUPS contract upgrade support
 */
abstract contract OwlBase is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 internal constant ROUTER_ROLE = keccak256('ROUTER_ROLE');
    // Consistent version across all contracts
    string internal constant _version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://OwlBase/', _version)));

    /**
     * @dev OwlBase required initialization
     * @param _admin address to assign owner rights
     * @param _forwarder OpenGSN forwarder address (if desired).
     */
    function __OwlBase_init(address _admin, address _forwarder) internal onlyInitializing {
        __OwlBase_init_unchained(_admin, _forwarder);
    }

    /**
     * @dev OwlBase unchained initialization.
     * For future implementation.
     */
    function __OwlBase_init_unchained(address _admin, address _forwarder) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ROUTER_ROLE, _forwarder);
    }

    /**
     * @notice Must have owner role
     * @dev Grants ROUTER_ROLE to {to}
     * @param to address to
     */
    function grantRouter(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ROUTER_ROLE, to);
    }

    /**
     * @notice Only callable by admins
     * @dev UUPS function to authorize upgrades
     * @param newImplementation newImplementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Returns the implementation address.
     */
    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     * @dev Support for meta transactions
     * @return ret either msg.sender or user who called transaction through a relayer
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

    /**
     * @dev Support for meta transactions
     * @return msgData from either msg.sender or from user who called through relayer
     */
    function _msgData() internal view virtual override returns (bytes calldata) {
        if (msg.data.length >= 20 && hasRole(ROUTER_ROLE, msg.sender)) {
            return msg.data[0:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }

    /**
     * @dev Returns OpenGSN contract version (used for compatibility checks)
     */
    function versionRecipient() external pure virtual returns (string memory) {
        return '2.2.6';
    }

    /**
     * @dev OwlProtocol contract version. Used to determine compatibility
     * interoperable with other Owl contracts.
     */
    function version() external pure virtual returns (string memory) {
        return _version;
    }

    /**
     * @dev Determine is an address a GSN trusted forwarder.
     * @param forwarder address to query
     * @return OpenGSN trusted forwarder status
     */
    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return hasRole(ROUTER_ROLE, forwarder);
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
