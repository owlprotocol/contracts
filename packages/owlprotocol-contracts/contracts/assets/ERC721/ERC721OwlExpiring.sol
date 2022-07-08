// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import './ERC721Owl.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';

contract ERC721OwlExpiring is ERC721Owl {
    using StringsUpgradeable for uint256;

    bytes32 private constant EXPIRY_ROLE = keccak256('EXPIRY_ROLE');
    string private constant _version = 'v0.1';
    bytes4 private constant ERC165TAG =
        bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC721OwlExpiring/', _version)));

    mapping(uint256 => uint256) internal expires;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_
    ) external override initializer {
        __ERC721OwlExpiring_init(_admin, _name, _symbol, baseURI_);
    }

    function proxyInitialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_
    ) external override onlyInitializing {
        __ERC721OwlExpiring_init(_admin, _name, _symbol, baseURI_);
    }

    function __ERC721OwlExpiring_init(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory baseURI_
    ) internal onlyInitializing {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_);
        __ERC721OwlExpiring_init_unchained(_admin);
    }

    function __ERC721OwlExpiring_init_unchained(address _admin) internal onlyInitializing {
        _grantRole(EXPIRY_ROLE, _admin);
    }

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants EXPIRY_ROLE to {a}
     * @param to address to
     */
    function grantExpiry(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(EXPIRY_ROLE, to);
    }

    /* ERC721Upgradeable Overrides */
    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Owl) returns (bool) {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view override returns (address) {
        require(!_expired(tokenId), 'ERC721: owner query for nonexistent token');
        address owner = ERC721Upgradeable.ownerOf(tokenId);
        require(owner != address(0), 'ERC721: owner query for nonexistent token');
        return owner;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
        require(!_expired(tokenId), 'ERC721Metadata: URI query for nonexistent token');

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : '';
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ownerOf(tokenId);
        require(to != owner, 'ERC721: approval to current owner');

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            'ERC721: approve caller is not owner nor approved for all'
        );

        _approve(to, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view override returns (address) {
        require(!_expired(tokenId), 'ERC721: approved query for nonexistent token');
        return ERC721Upgradeable.getApproved(tokenId);
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        require(!_expired(tokenId), 'ERC721: transfer query for nonexistent token');
        ERC721Upgradeable.transferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        require(!_expired(tokenId), 'ERC721: transfer query for nonexistent token');
        safeTransferFrom(from, to, tokenId, '');
    }

    /**
     * @notice function disabled
     */
    function mint(address to, uint256 tokenId) public override {
        revert('ERC721OwlExpiring: function disabled');
    }

    /**
     * @notice function disabled
     */
    function safeMint(address to, uint256 tokenId) public override {
        revert('ERC721OwlExpiring: function disabled');
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param tokenId tokenId value
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 expireTime
    ) public onlyRole(MINTER_ROLE) {
        if (expires[tokenId] > block.timestamp) _burn(tokenId);
        expires[tokenId] = expireTime + block.timestamp;
        _mint(to, tokenId);
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param tokenId tokenId value
     */
    function safeMint(
        address to,
        uint256 tokenId,
        uint256 expireTime
    ) public onlyRole(MINTER_ROLE) {
        if (expires[tokenId] > block.timestamp) _burn(tokenId);
        expires[tokenId] = expireTime + block.timestamp;
        _safeMint(to, tokenId);
    }

    function extendExpiry(uint256 tokenId, uint256 extendAmount) external onlyRole(EXPIRY_ROLE) {
        expires[tokenId] += extendAmount;
    }

    function _expired(uint256 tokenId) internal view virtual returns (bool) {
        return expires[tokenId] != 0 && expires[tokenId] < block.timestamp;
    }

    function version() public pure override returns (string memory) {
        return _version;
    }
}
