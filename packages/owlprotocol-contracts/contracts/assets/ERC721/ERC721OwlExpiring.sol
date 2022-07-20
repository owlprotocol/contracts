// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';

import './ERC721Owl.sol';
import 'hardhat/console.sol';

/**
 * @dev This implementation is an extension of OwlProtocol's base {ERC721Owl}
 * contract. After a set amount of time determined at mint, the `tokenId` will
 * no longer belong to the minter. The update is not done through a transaction
 * but rather by overriding standaring {ERC721Owl} view function to return
 * `null` results after token expiry has passed.
 *
 * The default `mint(address,uint256)` is disabled in favor of a new signature
 * that allows setting of an expiry time.
 *
 * Initially, setting the expiry time is done by `MINTER_ROLE` during the minting
 * process however consequent updates to the expiry time (but before expiry has
 * taken place) must be done by `EXPIRY_ROLE`. After expiry, `tokenId` is able to
 * reminted by `MINTER_ROLE` but can also be extended by `EXPIRY_ROLE`
 */
contract ERC721OwlExpiring is ERC721Owl {
    using StringsUpgradeable for uint256;

    bytes32 private constant EXPIRY_ROLE = keccak256('EXPIRY_ROLE');
    bytes4 private constant ERC165TAG =
        bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC721OwlExpiring/', VERSION)));

    /**********************
           Storage
    **********************/

    // Mapping from tokenId to block.timestamp in which tokenId expires
    mapping(uint256 => uint256) internal expires;

    /**********************
        Initialization
    **********************/

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
    ) external override initializer {
        __ERC721OwlExpiring_init(_admin, _name, _symbol, baseURI_, _forwarder);
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
    ) external override onlyInitializing {
        __ERC721OwlExpiring_init(_admin, _name, _symbol, baseURI_, _forwarder);
    }

    function __ERC721OwlExpiring_init(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory baseURI_,
        address _forwarder
    ) internal onlyInitializing {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_, _forwarder);
        _grantRole(EXPIRY_ROLE, _admin);

        __ERC721OwlExpiring_init_unchained();
    }

    function __ERC721OwlExpiring_init_unchained() internal onlyInitializing {}

    /**********************
          Interaction
    **********************/

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants EXPIRY_ROLE to `to`
     * @param to address to
     */
    function grantExpiry(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(EXPIRY_ROLE, to);
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view override returns (address) {
        require(!_expired(tokenId), 'ERC721: owner query for nonexistent token');
        address owner = ERC721Upgradeable.ownerOf(tokenId);
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
    function mint(address, uint256) public pure override {
        revert('ERC721OwlExpiring: function disabled');
    }

    /**
     * @notice function disabled
     */
    function safeMint(address, uint256) public pure override {
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
        // If token reaches expiry time, it is available to be reminted. This
        // will be executed by performing a burn before a remint can take place
        // without risk of revert
        if (_expired(tokenId)) _burn(tokenId);
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
        // If token reaches expiry time, it is available to be reminted. This
        // will be executed by performing a burn before a remint can take place
        // without risk of revert
        if (_expired(tokenId)) _burn(tokenId);
        expires[tokenId] = expireTime + block.timestamp;
        _safeMint(to, tokenId);
    }

    /**
     * @notice Must have EXPIRY_ROLE.
     * @dev `expires` mapping is updated with new expire time
     * @param tokenId to update
     * @param extendAmount amount of time to extend by
     */
    function extendExpiry(uint256 tokenId, uint256 extendAmount) external onlyRole(EXPIRY_ROLE) {
        expires[tokenId] += extendAmount;
    }

    /**
     * @dev exposes read access to `expires` mapping
     * @return expireTime block.timestamp of when tokenId expires
     */
    function getExpiry(uint256 tokenId) external view returns (uint256) {
        return expires[tokenId];
    }

    /**
     * @dev checks if tokenId is expired
     * @return bool expired
     */
    function _expired(uint256 tokenId) internal view virtual returns (bool) {
        return expires[tokenId] != 0 && expires[tokenId] < block.timestamp;
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Owl) returns (bool) {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
