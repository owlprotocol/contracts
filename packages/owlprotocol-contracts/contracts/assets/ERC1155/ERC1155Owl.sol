// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol';

import '../../OwlBase.sol';

contract ERC1155Owl is OwlBase, ERC1155BurnableUpgradeable, ERC2981Upgradeable {
    bytes32 private constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 private constant URI_ROLE = keccak256('URI_ROLE');
    bytes32 internal constant ROYALTY_ROLE = keccak256('ROYALTY_ROLE');
    string private contractURI_;

    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://ERC1155Owl/', version)));

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes an ERC721Owl contract
     * @param _admin admin for contract
     * @param uri_ uri for contract
     * @param newContractURI new uri for contract
     * @param _forwarder address for trusted forwarder for open GSN
     * @param _receiver address of receiver of royalty fees
     * @param _feeNumerator numerator of royalty fee percentage (numerator / 100)
     */
    function initialize(
        address _admin,
        string calldata uri_,
        string calldata newContractURI,
        address _forwarder,
        address _receiver,
        uint96 _feeNumerator
    ) external initializer {
        __ERC1155Owl_init(_admin, uri_, newContractURI, _forwarder, _receiver, _feeNumerator);
    }

    function proxyInitialize(
        address _admin,
        string calldata uri_,
        string calldata newContractURI,
        address _forwarder,
        address _receiver,
        uint96 _feeNumerator
    ) external onlyInitializing {
        __ERC1155Owl_init(_admin, uri_, newContractURI, _forwarder, _receiver, _feeNumerator);
    }

    function __ERC1155Owl_init(
        address _admin,
        string memory uri_,
        string calldata newContractURI,
        address _forwarder,
        address _receiver,
        uint96 _feeNumerator
    ) internal onlyInitializing {
        __ERC1155_init(uri_);
        __OwlBase_init(_admin, _forwarder);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(URI_ROLE, _admin);
        _grantRole(ROYALTY_ROLE, _admin);
        _setDefaultRoyalty(_receiver, _feeNumerator);

        __ERC1155Owl_init_unchained(newContractURI);
    }

    function __ERC1155Owl_init_unchained(string calldata newContractURI) internal onlyInitializing {
        contractURI_ = newContractURI;
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

    /**
     * @dev Exposing `_setTokenRoyalty`
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyRole(ROYALTY_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev The denominator with which to interpret the fee set in {_setTokenRoyalty} and {_setDefaultRoyalty} as a
     * fraction of the sale price. Overrides definition in ERC2981Upgradeable.
     */
    function _feeDenominator() internal pure override returns (uint96) {
        return 100;
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
    function _msgSender() internal view override(OwlBase, ContextUpgradeable) returns (address) {
        return OwlBase._msgSender();
    }

    function _msgData() internal view override(OwlBase, ContextUpgradeable) returns (bytes calldata) {
        return OwlBase._msgData();
    }

    /* @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155Upgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
