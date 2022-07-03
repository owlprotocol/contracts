// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './ERC721Owl.sol';

contract ERC721OwlAttributes is ERC721Owl {
    using StringsUpgradeable for uint256;

    bytes32 private constant DNA_ROLE = keccak256('DNA_ROLE');

    mapping(uint256 => uint256) private dnas;
    uint256 nextId = 0;

    string private constant version = 'v0.1';
    bytes4 private constant ERC165TAG =
        bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC721OwlAttributes/', version)));

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_
    ) external virtual override initializer {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_);
    }

    function proxyInitialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_
    ) external virtual override onlyInitializing {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_);
    }

    function __ERC721OwlAttributes_init(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory baseURI_
    ) internal onlyInitializing {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_);
    }

    function __ERC721OwlAttributes_init_unchained() internal onlyInitializing {}

    /**
     * @dev returns uri for token metadata
     * @param tokenId tokenId metadata to fetch
     * @return uri at which metadata is housed
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory uri) {
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');

        string memory baseURI = _baseURI();
        uri = bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, dnas[tokenId].toString())) : '';
    }

    /***** MINTING *****/
    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param dna of next tokenId
     */
    function mint(address to, uint256 dna) public virtual override onlyRole(MINTER_ROLE) {
        dnas[nextId] = dna;
        _mint(to, nextId++);
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param dna of next tokenId
     */
    function safeMint(address to, uint256 dna) public virtual override onlyRole(MINTER_ROLE) {
        dnas[nextId] = dna;
        _safeMint(to, nextId++);
    }

    /**
     * @notice Must have DNA_ROLE
     * @dev Allows changing the dna of a tokenId
     * @param tokenId whose dna to change
     * @param dna new dna for the provided tokenId
     */
    function udpateDna(uint256 tokenId, uint256 dna) external onlyRole(DNA_ROLE) {
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
        dnas[tokenId] = dna;
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Owl) returns (bool) {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
