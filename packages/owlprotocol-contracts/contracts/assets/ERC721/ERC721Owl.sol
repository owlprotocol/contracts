// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

contract ERC721Owl is BaseRelayRecipient, ERC721Upgradeable, ERC721BurnableUpgradeable, AccessControlUpgradeable {
    bytes32 internal constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 internal constant URI_ROLE = keccak256('URI_ROLE');

    string private constant _version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC721Owl/', _version)));

    string public baseURI;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_,
        address _forwarder
    ) external virtual initializer {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_,
        address _forwarder
    ) external virtual onlyInitializing {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_, _forwarder);
    }

    function __ERC721Owl_init(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory baseURI_,
        address _forwarder
    ) internal onlyInitializing {
        __ERC721_init(_name, _symbol);
        __ERC721Burnable_init();
        __AccessControl_init();
        __ERC721Owl_init_unchained(_admin, baseURI_, _forwarder);
    }

    function __ERC721Owl_init_unchained(
        address _admin,
        string memory baseURI_,
        address _forwarder
    ) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(URI_ROLE, _admin);
        baseURI = baseURI_;
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
     * @param tokenId tokenId value
     */
    function mint(address to, uint256 tokenId) public virtual onlyRole(MINTER_ROLE) {
        _mint(to, tokenId);
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param tokenId tokenId value
     */
    function safeMint(address to, uint256 tokenId) public virtual onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    /**
     * @notice Must have URI_ROLE role!
     * @dev Allows setting the baseURI
     * @param baseURI_ set the baseURI value.
     */
    function setBaseURI(string calldata baseURI_) public onlyRole(URI_ROLE) {
        baseURI = baseURI_;
    }

    /**
     * @dev Overrides OZ internal baseURI getter.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Returns collection-wide URI-accessible metadata
     */
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(baseURI, 'metadata.json'));
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function version() public pure virtual returns (string memory) {
        return _version;
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }

    uint256[49] private __gap;

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
