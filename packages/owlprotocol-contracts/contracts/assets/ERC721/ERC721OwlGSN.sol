// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';
import './ERC721Owl.sol';

contract ERC721OwlGSN is ERC721Owl, BaseRelayRecipient {
    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_,
        address _forwarder
    ) external virtual initializer {
        __ERC721OwlGSN_init(_admin, _name, _symbol, baseURI_, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_,
        address _forwarder
    ) external virtual onlyInitializing {
        __ERC721OwlGSN_init(_admin, _name, _symbol, baseURI_, _forwarder);
    }

    function __ERC721OwlGSN_init(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory baseURI_,
        address _forwarder
    ) internal onlyInitializing {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_);
        __ERC721OwlGSN_init_unchained(_admin, baseURI_, _forwarder);
    }

    function __ERC721OwlGSN_init_unchained(
        address _admin,
        string memory baseURI_,
        address _forwarder
    ) internal onlyInitializing {
        _setTrustedForwarder(_forwarder);
    }

    function _msgSender() internal view override(BaseRelayRecipient, ContextUpgradeable) returns (address sender) {
        sender = BaseRelayRecipient._msgSender();
    }

    function _msgData() internal view override(BaseRelayRecipient, ContextUpgradeable) returns (bytes calldata) {
        return BaseRelayRecipient._msgData();
    }

    function versionRecipient() external pure override returns (string memory) {
        return '2.2.6';
    }
}
