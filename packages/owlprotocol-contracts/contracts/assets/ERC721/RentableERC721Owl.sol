// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import './RentableERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

contract RentableERC721Owl is RentableERC721Upgradeable, AccessControlUpgradeable {
    bytes32 private constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 private constant URI_ROLE = keccak256('URI_ROLE');
    bytes32 private constant RENTER_ROLE = keccak256('RENTER_ROLE');

    string public baseURI;

    mapping(uint256 => uint256) rentalExpires;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_
    ) external initializer {
        __RentableERC721Owl_init(_admin, _name, _symbol, baseURI_);
    }

    function proxyInitialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_
    ) external onlyInitializing {
        __RentableERC721Owl_init(_admin, _name, _symbol, baseURI_);
    }

    function __RentableERC721Owl_init(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory baseURI_
    ) internal onlyInitializing {
        __RentableERC721Owl_init_unchained(_admin, baseURI_);
        __RentableERC721Upgradeable_init(_name, _symbol);
        __AccessControl_init();
    }

    function __RentableERC721Owl_init_unchained(address _admin, string memory baseURI_) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(URI_ROLE, _admin);
        _grantRole(RENTER_ROLE, _admin);
        baseURI = baseURI_;
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

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants RENTER_ROLE to {a}
     * @param to address to
     */
    function grantRenter(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RENTER_ROLE, to);
    }

    /***** MINTING *****/
    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param tokenId tokenId value
     */
    function mint(address to, uint256 tokenId, uint256 expireTime) public onlyRole(MINTER_ROLE) {
        rentalExpires[tokenId] = expireTime + block.timestamp;
        _mint(to, tokenId);
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param tokenId tokenId value
     */
    function safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(RentableERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function burn(uint256 tokenId) public virtual {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721Burnable: caller is not owner nor approved");
        _burn(tokenId);
    }

    function extendRental(uint256 tokenId, uint256 extendAmount) external onlyRole(RENTER_ROLE){
        rentalExpires[tokenId] += extendAmount;
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner;
        if (rentalExpires[tokenId] > block.timestamp) owner = address(0);
        else owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }
}
