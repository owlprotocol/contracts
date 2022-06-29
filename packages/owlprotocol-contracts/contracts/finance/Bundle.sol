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

import './BundleLib.sol';
import '../plugins/Minter/builds/MinterAutoId.sol';
import 'hardhat/console.sol';

contract Bundle is ERC721HolderUpgradeable, ERC1155HolderUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /**********************
             Types
    **********************/
    event Lock(BundleLib.Asset[] assetsLocked);
    event Unlock();

    address public lootBoxMinterAddress;
    address payable public client;
    address public admin;

    uint256 public nextLootBoxId;

   
 
    mapping(uint256 => BundleLib.Asset[]) public lootBoxStorage; //maps token id of lootbox to assets in bundle

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
     * @param _client the caller of the lock and unlock functions
     */
    function initialize(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress
    ) external initializer {
        __EnglishAuction_init(_admin, _client, _lootBoxMinterAddress);
    }

    function proxyInitialize(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress
    ) external onlyInitializing {
        __EnglishAuction_init(_admin, _client, _lootBoxMinterAddress);
    }

    function __EnglishAuction_init(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress
        
    ) internal onlyInitializing {
        __Ownable_init();
         _transferOwnership(_admin);

        __EnglishAuction_init_unchained(
           _admin,
           _client, _lootBoxMinterAddress
        );
    }

    function __EnglishAuction_init_unchained(
        address _admin,
        address payable _client,
        address _lootBoxMinterAddress
    ) internal onlyInitializing {
        admin = _admin;
        client = _client; 
        lootBoxMinterAddress = _lootBoxMinterAddress;
    }

    /**********************
         Interaction
    **********************/

    function lock(BundleLib.Asset[] calldata assetsToLock) external payable {
        // require (lockBoxStorage[lootbox.tokenId].length == 0, 'Bundle.sol: there are already assets locked in that lootbox!');
        require (_msgSender() == client, 'Bundle.sol: you are not authorized to call the lock function!');
        require(lootBoxMinterAddress != address(0), 'Bundle.sol: set lootbox address first!');



        for (uint i = 0; i < assetsToLock.length; i++) {
            if (assetsToLock[i].token == BundleLib.TokenType.erc20) {
                lootBoxStorage[nextLootBoxId].push(assetsToLock[i]);
                SafeERC20Upgradeable.safeTransferFrom(
                    IERC20Upgradeable(assetsToLock[i].contractAddr),
                    _msgSender(),
                    address(this),
                    assetsToLock[i].amount
                );
            }
            else if (assetsToLock[i].token == BundleLib.TokenType.erc721) {
                lootBoxStorage[nextLootBoxId].push(assetsToLock[i]);
                IERC721Upgradeable(assetsToLock[i].contractAddr).transferFrom(_msgSender(), address(this), assetsToLock[i].tokenId);
            }
            else if (assetsToLock[i].token == BundleLib.TokenType.erc1155) {
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
        //mint lockbox to msg sender
        MinterAutoId(lootBoxMinterAddress).mint(_msgSender());

        emit Lock(assetsToLock);
    }

    function unlock(uint256 lootBoxId) external {
        //require (_msg.sender() == IERC721Upgradeable(lootbox.contractAddr).ownerOf(lootbox.tokenId), 'Bundle.sol: not owned by this lootbox!');
        require (_msgSender() == client, 'Bundle.sol: you are not authorized to call the unlock function!');

        for (uint i = lootBoxStorage[lootBoxId].length - 1; i >= 0; i--) {
            if (lootBoxStorage[lootBoxId][i].token == BundleLib.TokenType.erc20) { 
                lootBoxStorage[lootBoxId].pop();
                IERC20Upgradeable(lootBoxStorage[lootBoxId][i].contractAddr).transfer(_msgSender(), 1);
            }
            else if (lootBoxStorage[lootBoxId][i].token == BundleLib.TokenType.erc721) {
                lootBoxStorage[lootBoxId].pop();
                IERC721Upgradeable(lootBoxStorage[lootBoxId][i].contractAddr).transferFrom(address(this), _msgSender(), lootBoxStorage[lootBoxId][i].tokenId);
            }
            else if (lootBoxStorage[lootBoxId][i].token == BundleLib.TokenType.erc1155) {
                lootBoxStorage[lootBoxId].pop();
                IERC1155Upgradeable(lootBoxStorage[lootBoxId][i].contractAddr).safeTransferFrom(
                    address(this),
                    _msgSender(),
                    lootBoxStorage[lootBoxId][i].tokenId,
                    lootBoxStorage[lootBoxId][i].amount,
                    new bytes(0)
                );
            }


        }

        emit Unlock();

    }

    function setLootboxAddress(address lootbox) external onlyOwner { //if id is 0, mint a new lootbox id, else access the inputted lootbox id
        lootBoxMinterAddress = lootbox;
        MinterAutoId(lootbox).setNextTokenId(nextLootBoxId);
    }


    /**
    Getters
    */

    function getLootboxStorage(uint256 tokenId) external view returns ( BundleLib.Asset[] memory _storage)
    {
        return lootBoxStorage[tokenId];
    }
    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
