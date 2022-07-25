// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './ERC721Owl.sol';
import '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol';

/**
 * @dev This implementation is an extension of OwlProtocol's base {ERC721Owl}
 * that enables on-chain encoding. In most uses of `ERC721`, contract deployers
 * have chosen to keep all metadata off-chain. While this is
 * economical in terms of gas costs it also disallows on-chain actors
 * (first-party or third-party) to deploy contracts that depend on the metadata.
 * This contract solves the latter without sacrificing on the former.
 *
 * In this contract, each `tokenId` is auto-incremented, solely determined by
 * the order of the mint. Each `tokenId` is also paired with a `dna` at the time
 * of mint. The `dna` will hold an encoding of all attributes for that
 * specific `tokenId`, stored in the `dnas` mapping.
 *
 * A "dna" will be stored in its decimal form, however all the metadata can
 * be decoded from its binary form, given the configuration of its "genes". A
 * "gene" represents a potential attribute that a `tokenId` can posses. The
 * size of the "gene" (how many bits it will be allocated in the binary form)
 * will be determined by the amount of possible options the attribute (that the
 * "gene" represents) can have.
 *
 * A quick exemplification of the concept of "genes": Suppose an
 * {ERC721OwlAttributes} instance with 3 attributes and 4 options for each
 * attribute: 4 options can be encoded into two bits (log(4) = 2). Since there
 * are three total attributes, the `tokenId`s in this {ERC721OwlAttributes}
 * instance will require 6 bits for encoding. Suppose the attributes options are
 * in arrays:
 *
 * ```
 * attributes1 = [option1, ..., option4]
 * attributes2 = [option1, ..., option4]
 * attributes3 = [option1, ..., option4]
 * ```
 *
 * So if a `tokenId` was minted with a "dna" that had a binary format of
 * `01 10 11`, that `tokenId`'s metadata would be:
 * - `option2` for `attributes1`
 * - `option3` for `attributes2`
 * - `option4` for `attributes3`
 *
 * `01 10 11` in its decimal form is 27 which is what would be mapped to the
 * `tokenId` it was assigned during minting.
 *
 * If it were ever required, the genes array for this {ERC721OwlAttribtues}
 * instance would be `[0, 2, 4, 6]`. They are, in order, the index ranges of
 * each "gene" in the binary format of the "dna". The genes array must begin at
 * 0 and be strictly increasing. The max size of a "dna" is 256 bits so no
 * element in the genes should be above 255 (it is a uint8[] array).
 *
 * The `dnas` mapping can be dynamically updated by `DNA_ROLE` through the
 * `updateDna()` function.
 */
contract ERC721OwlAttributes is ERC721Owl {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using StringsUpgradeable for uint256;

    bytes32 private constant DNA_ROLE = keccak256('DNA_ROLE');
    bytes4 private constant ERC165TAG =
        bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC721OwlAttributes/', _version)));

    /**********************
           Storage
    **********************/

    // Mapping from tokenId to dna
    mapping(uint256 => uint256) private dnas;

    // Auto-incrementing tokenIds
    CountersUpgradeable.Counter private nextId;

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
     * @param _receiver address of receiver of royalty fees
     * @param _feeNumerator numerator of fee proportion (numerator / 10000)
     */
    function initialize(
        address _admin,
        string calldata _name,
        string calldata _symbol,
        string calldata baseURI_,
        address _forwarder,
        address _receiver,
        uint96 _feeNumerator
    ) external virtual override initializer {
        __ERC721OwlAttributes_init(_admin, _name, _symbol, baseURI_, _forwarder, _receiver, _feeNumerator);
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
        address _forwarder,
        address _receiver,
        uint96 _feeNumerator
    ) external virtual override onlyInitializing {
        __ERC721OwlAttributes_init(_admin, _name, _symbol, baseURI_, _forwarder, _receiver, _feeNumerator);
    }

    function __ERC721OwlAttributes_init(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory baseURI_,
        address _forwarder,
        address _receiver,
        uint96 _feeNumerator
    ) internal onlyInitializing {
        __ERC721Owl_init(_admin, _name, _symbol, baseURI_, _forwarder, _receiver, _feeNumerator);
        _grantRole(DNA_ROLE, _admin);

        __ERC721OwlAttributes_init_unchained();
    }

    function __ERC721OwlAttributes_init_unchained() internal onlyInitializing {}

    /**********************
          Interaction
    **********************/

    /**
     * @notice Must have DEFAULT_ADMIN_ROLE
     * @dev Grants DNA_ROLE to `to`
     * @param to address to
     */
    function grantDna(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DNA_ROLE, to);
    }

    /**
     * @dev returns uri for token metadata.
     * @param tokenId tokenId metadata to fetch
     * @return uri at which metadata is housed
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory uri) {
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');

        string memory baseURI = _baseURI();
        // Uri is not based of tokenId but rather by the dna that is indexed by
        // the tokenId
        uri = bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, dnas[tokenId].toString())) : '';
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param dna of next tokenId
     */
    function mint(address to, uint256 dna) public virtual override onlyRole(MINTER_ROLE) {
        dnas[nextId.current()] = dna;
        _mint(to, nextId.current());
        nextId.increment();
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param dna of next tokenId
     */
    function safeMint(address to, uint256 dna) public virtual override onlyRole(MINTER_ROLE) {
        dnas[nextId.current()] = dna;
        _safeMint(to, nextId.current());
        nextId.increment();
    }

    /**
     * @notice Must have DNA_ROLE
     * @dev Allows changing the dna of a tokenId
     * @param tokenId whose dna to change
     * @param dna new dna for the provided tokenId
     */
    function updateDna(uint256 tokenId, uint256 dna) external onlyRole(DNA_ROLE) {
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
        dnas[tokenId] = dna;
    }

    /**
     * @dev Getter for dna of tokenId
     * @param tokenId whose dna to change
     * @return dna of tokenId
     */
    function getDna(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
        return dnas[tokenId];
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
