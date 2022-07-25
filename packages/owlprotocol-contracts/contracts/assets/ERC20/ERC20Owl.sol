// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol';

import '../../OwlBase.sol';

contract ERC20Owl is OwlBase, ERC20BurnableUpgradeable {
    bytes32 private constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 private constant URI_ROLE = keccak256('URI_ROLE');

    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC20Owl/', _version)));

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        address _forwarder
    ) external initializer {
        __ERC20Owl_init(_admin, _name, _symbol, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        address _forwarder
    ) external onlyInitializing {
        __ERC20Owl_init(_admin, _name, _symbol, _forwarder);
    }

    function __ERC20Owl_init(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        address _forwarder
    ) internal onlyInitializing {
        __ERC20_init(_name, _symbol);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);

        __ERC20Owl_init_unchained(_admin, _forwarder);
    }

    function __ERC20Owl_init_unchained(address _admin, address _forwarder) internal onlyInitializing {}

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants MINTER_ROLE to {a}
     * @param to address to
     */
    function grantMinter(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, to);
    }

    /***** MINTING *****/
    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param amount amount to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function _msgSender() internal view override(OwlBase, ContextUpgradeable) returns (address) {
        return OwlBase._msgSender();
    }

    function _msgData() internal view virtual override(OwlBase, ContextUpgradeable) returns (bytes calldata) {
        return OwlBase._msgData();
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
