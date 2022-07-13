//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

/**
 * @dev Base for all OWLPROTOCOL contracts
 */
abstract contract OwlBase is BaseRelayRecipient, OwnableUpgradeable, UUPSUpgradeable {
    /**
     * UUPS functions
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
    function _msgSender()
        internal
        view
        virtual
        override(BaseRelayRecipient, ContextUpgradeable)
        returns (address sender)
    {
        sender = BaseRelayRecipient._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(BaseRelayRecipient, ContextUpgradeable)
        returns (bytes calldata)
    {
        return BaseRelayRecipient._msgData();
    }

    function versionRecipient() external pure virtual override returns (string memory) {
        return '2.2.6';
    }

    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool);
}
