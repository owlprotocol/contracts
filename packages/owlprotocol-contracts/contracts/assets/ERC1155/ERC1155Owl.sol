// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

contract ERC1155Owl is BaseRelayRecipient, ERC1155Upgradeable, ERC1155BurnableUpgradeable, AccessControlUpgradeable {
    bytes32 private constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 private constant URI_ROLE = keccak256('URI_ROLE');
    string private contractURI_;

    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC1155Owl/', version)));

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        string calldata uri_,
        string calldata newContractURI,
        address _forwarder
    ) external initializer {
        __ERC1155Owl_init(_admin, uri_, newContractURI, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        string calldata uri_,
        string calldata newContractURI,
        address _forwarder
    ) external onlyInitializing {
        __ERC1155Owl_init(_admin, uri_, newContractURI, _forwarder);
    }

    function __ERC1155Owl_init(
        address _admin,
        string memory uri_,
        string calldata newContractURI,
        address _forwarder
    ) internal onlyInitializing {
        __ERC1155_init(uri_);
        __ERC1155Burnable_init();
        __AccessControl_init();
        __ERC1155Owl_init_unchained(_admin, newContractURI, _forwarder);
    }

    function __ERC1155Owl_init_unchained(
        address _admin,
        string calldata newContractURI,
        address _forwarder
    ) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(URI_ROLE, _admin);

        contractURI_ = newContractURI;
        _setTrustedForwarder(_forwarder);
    }

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants MINTER_ROLE to {a}
     * @param to address to
     */
    function grantMinter(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, to);
    }

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants URI_ROLE to {a}
     * @param to address to
     */
    function grantUriRole(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(URI_ROLE, to);
    }

    /***** MINTING *****/
    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param id tokenId value
     * @param amount to mint
     * @param data for hooks
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param ids id values
     * @param amounts to mint
     * @param data for hooks
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @notice Must have URI_ROLE role!
     * @dev Allows setting the uri
     * @param newuri set the baseURI value.
     */
    function setURI(string calldata newuri) public onlyRole(URI_ROLE) {
        _setURI(newuri);
    }

    /**
     * @notice Must have URI_ROLE role!
     * @dev Allows setting the contract uri
     * @param newContractURI set the contractURI_ value.
     */
    function setContractURI(string calldata newContractURI) public onlyRole(URI_ROLE) {
        contractURI_ = newContractURI;
    }

    /**
     * @dev Defines collection-wide metadata that is URI-accessible
     *
     */
    function contractURI() public view returns (string memory) {
        return contractURI_;
    }

    /* @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
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
