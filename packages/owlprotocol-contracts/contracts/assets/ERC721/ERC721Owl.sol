// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol';

import '../../OwlBase.sol';

/**
 * @dev This implements the standard OwlProtocol `ERC721` contract that is an
 * extension of Openzeppelin's `ERC721BurnableUpgradeable`. Initializations
 * happens through initializers for compatibility with a EIP1167 minimal-proxy
 * deployment strategy.
 */
contract ERC721Owl is OwlBase, ERC721BurnableUpgradeable {
    bytes32 internal constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 internal constant URI_ROLE = keccak256('URI_ROLE');

    string private constant VERSION = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC721Owl/', VERSION)));

    /**********************
           Storage
    **********************/

    string public baseURI;

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes contract (replaces constructor in proxy pattern)
     * @param _admin owner
     * @param _name name
     * @param _symbol symbol
     * @param baseURI_ uri
     * @param _forwarder trusted forwarder address for openGSN
     */
    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_,
        address _forwarder
    ) external virtual initializer {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_, _forwarder);
    }

    /**
     * @dev Initializes contract through beacon proxy (replaces constructor in
     * proxy pattern)
     */
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
        __OwlBase_init(_admin, _forwarder);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(URI_ROLE, _admin);

        __ERC721Owl_init_unchained(baseURI_);
    }

    function __ERC721Owl_init_unchained(string memory baseURI_) internal onlyInitializing {
        (_msgData());
        baseURI = baseURI_;
    }

    /**********************
          Interaction
    **********************/

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants MINTER_ROLE to `to`
     * @param to address tos
     */
    function grantMinter(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, to);
    }

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants URI_ROLE to `a`
     * @param to address to
     */
    function grantUriRole(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(URI_ROLE, to);
    }

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

    /**
     * @dev exposing `_exists`
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev use {OwlBase._msgSender()}
     */
    function _msgSender() internal view override(OwlBase, ContextUpgradeable) returns (address) {
        return OwlBase._msgSender();
    }

    /**
     * @dev use {OwlBase._msgData()}
     */
    function _msgData() internal view override(OwlBase, ContextUpgradeable) returns (bytes calldata) {
        return OwlBase._msgData();
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
}
