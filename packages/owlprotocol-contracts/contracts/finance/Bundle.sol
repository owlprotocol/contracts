// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import './BundleLib.sol';
import '../plugins/Minter/builds/MinterAutoId.sol';

contract Bundle is
    BaseRelayRecipient,
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Bundle/', version)));

    /**********************
             Types
    **********************/
    event Lock(BundleLib.Asset[] assetsLocked);
    event Unlock();

    address public lootBoxMinterAddress;
    address payable public client;
    address public admin;

    uint256 public nextLootBoxId;

    mapping(uint256 => BundleLib.Asset[]) public lootBoxStorage; //maps token id of _lootBoxMinterAddress to assets in bundle

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Create auction instance
     * @param _admin the admin/owner of the contract
     * @param _client the caller of the lock and unlock functions,
     * @param _forwarder the address for the trusted forwarder for openGSN integration
     */
    function initialize(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress,
        address _forwarder
    ) external initializer {
        __Bundle_init(_admin, _client, _lootBoxMinterAddress, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress,
        address _forwarder
    ) external onlyInitializing {
        __Bundle_init(_admin, _client, _lootBoxMinterAddress, _forwarder);
    }

    function __Bundle_init(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress,
        address _forwarder
    ) internal onlyInitializing {
        _transferOwnership(_admin);
        __Bundle_init_unchained(_admin, _client, _lootBoxMinterAddress, _forwarder);
    }

    function __Bundle_init_unchained(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress,
        address _forwarder
    ) internal onlyInitializing {
        admin = _admin;
        client = _client;
        lootBoxMinterAddress = _lootBoxMinterAddress;

        //Sets trusted forwarder for open GSN
        _setTrustedForwarder(_forwarder);
    }

    /**********************
         Interaction
    **********************/

    function lock(BundleLib.Asset[] calldata assetsToLock) external payable {
        require(_msgSender() == client, 'Bundle.sol: you are not authorized to call the lock function!');
        require(lootBoxMinterAddress != address(0), 'Bundle.sol: set _lootBoxMinterAddress address first!');

        for (uint256 i = 0; i < assetsToLock.length; i++) {
            if (assetsToLock[i].token == BundleLib.TokenType.erc20) {
                lootBoxStorage[nextLootBoxId].push(assetsToLock[i]);
                SafeERC20Upgradeable.safeTransferFrom(
                    IERC20Upgradeable(assetsToLock[i].contractAddr),
                    _msgSender(),
                    address(this),
                    assetsToLock[i].amount
                );
            } else if (assetsToLock[i].token == BundleLib.TokenType.erc721) {
                lootBoxStorage[nextLootBoxId].push(assetsToLock[i]);
                IERC721Upgradeable(assetsToLock[i].contractAddr).transferFrom(
                    _msgSender(),
                    address(this),
                    assetsToLock[i].tokenId
                );
            } else if (assetsToLock[i].token == BundleLib.TokenType.erc1155) {
                lootBoxStorage[nextLootBoxId].push(assetsToLock[i]);
                IERC1155Upgradeable(assetsToLock[i].contractAddr).safeTransferFrom(
                    _msgSender(),
                    address(this),
                    assetsToLock[i].tokenId,
                    assetsToLock[i].amount,
                    new bytes(0)
                );
            }
        }
        nextLootBoxId++;
        MinterAutoId(lootBoxMinterAddress).mint(_msgSender());

        emit Lock(assetsToLock);
    }

    function unlock(uint256 lootBoxId) external {
        require(_msgSender() == client, 'Bundle.sol: you are not authorized to call the unlock function!');
        // following check doesnt work since nftContractAddr variable is private in MinterCore

        uint256 arrayLength = lootBoxStorage[lootBoxId].length;
        for (uint256 i = arrayLength; i >= 1; i--) {
            //loop variables set to avoid uint underflow on decrementing loop
            if (lootBoxStorage[lootBoxId][i - 1].token == BundleLib.TokenType.erc20) {
                BundleLib.Asset memory temp = lootBoxStorage[lootBoxId][i - 1];
                lootBoxStorage[lootBoxId].pop();
                IERC20Upgradeable(temp.contractAddr).transfer(_msgSender(), temp.amount);
            } else if (lootBoxStorage[lootBoxId][i - 1].token == BundleLib.TokenType.erc721) {
                BundleLib.Asset memory temp = lootBoxStorage[lootBoxId][i - 1];
                lootBoxStorage[lootBoxId].pop();
                IERC721Upgradeable(temp.contractAddr).transferFrom(address(this), _msgSender(), temp.tokenId);
            } else if (lootBoxStorage[lootBoxId][i - 1].token == BundleLib.TokenType.erc1155) {
                BundleLib.Asset memory temp = lootBoxStorage[lootBoxId][i - 1];
                lootBoxStorage[lootBoxId].pop();
                IERC1155Upgradeable(temp.contractAddr).safeTransferFrom(
                    address(this),
                    _msgSender(),
                    temp.tokenId,
                    temp.amount,
                    new bytes(0)
                );
            }
        }

        emit Unlock();
    }

    function setLootboxAddress(address _lootBoxMinterAddress) external onlyOwner {
        //if id is 0, mint a new lootBoxMinterAddress id, else access the inputted lootBoxMinterAddress id
        lootBoxMinterAddress = _lootBoxMinterAddress;
        MinterAutoId(_lootBoxMinterAddress).setNextTokenId(nextLootBoxId);
    }

    /**
    Getters
    */

    function getLootboxStorage(uint256 tokenId) external view onlyOwner returns (BundleLib.Asset[] memory _storage) {
        return lootBoxStorage[tokenId];
    }

    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
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
