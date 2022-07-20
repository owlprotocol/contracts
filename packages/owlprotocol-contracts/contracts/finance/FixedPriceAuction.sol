// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '../OwlBase.sol';
import './AuctionLib.sol';
import 'hardhat/console.sol';

/*
 * @dev This contract executes a simple fixed price, sell-buy auction.
 * The owner can set the price of the asset which will remain fixed throughout
 * the auction. If a buyer buys within the auction duration timeframe, then the asset
 * is transferred to the buyer and the price in ERC20 tokens is transferred from
 * the buyer to the seller. If no buyer buys within the auction duration, then the
 * owner must claim the asset back from the contract and no one is eligible to buy the asset
 * after the auction duration has passed.
 */
contract FixedPriceAuction is OwlBase, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG =
        bytes4(keccak256(abi.encodePacked('OWLProtocol://FixedPriceAuction/', version)));

    /**********************
             Types
    **********************/
    event Start(uint256 startTime);
    event Buy(address indexed buyer, uint256 indexed buyPrice);
    event Claim(address indexed seller, address indexed contractAddr, uint256 tokenId);

    AuctionLib.Asset asset;
    address public acceptableToken;

    address payable public seller;
    address payable public saleFeeAddress;

    uint256 public auctionDuration;
    uint256 public price; //in "eth"
    uint256 public startTime;
    uint256 public saleFee; //integer percentage of sale set aside for owner commission

    bool public isBought;

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Create auction instance
     * @param _seller address of seller for auction
     * @param _asset struct containing information of the asset to be listed
     * @param ERC20contractAddress address of ERC20 token accepted as payment
     * @param _price price to start the auction
     * @param _auctionDuration how long the auction should last
     * @param _saleFee the percentage of the sale to be sent to the original owner as commission
     * @param _saleFeeAddress the address to which the sale fee is sent
     * @param _forwarder address for the trusted forwarder for open GSN integration
     */
    function initialize(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _price,
        uint256 _auctionDuration,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) external initializer {
        __FixedPriceAuction_init(
            _seller,
            _asset,
            ERC20contractAddress,
            _price,
            _auctionDuration,
            _saleFee,
            _saleFeeAddress,
            _forwarder
        );
    }

    function proxyInitialize(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _price,
        uint256 _auctionDuration,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) external onlyInitializing {
        __FixedPriceAuction_init(
            _seller,
            _asset,
            ERC20contractAddress,
            _price,
            _auctionDuration,
            _saleFee,
            _saleFeeAddress,
            _forwarder
        );
    }

    function __FixedPriceAuction_init(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _price,
        uint256 _auctionDuration,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_seller, _forwarder);

        __FixedPriceAuction_init_unchained(
            _seller,
            _asset,
            ERC20contractAddress,
            _price,
            _auctionDuration,
            _saleFee,
            _saleFeeAddress
        );
    }

    function __FixedPriceAuction_init_unchained(
        address payable _seller,
        AuctionLib.Asset memory _asset,
        address ERC20contractAddress,
        uint256 _price,
        uint256 _auctionDuration,
        uint256 _saleFee,
        address payable _saleFeeAddress
    ) internal onlyInitializing {
        require(_seller != _saleFeeAddress, 'FixedPriceAuction: seller cannot be the same as the owner!');
        require(_saleFee <= 100, 'FixedPriceAuction: sale fee cannot be greater than 100 percent!');
        asset = _asset;
        startTime = block.timestamp;

        acceptableToken = ERC20contractAddress;

        seller = _seller;
        auctionDuration = _auctionDuration;
        price = _price;
        isBought = false;
        saleFee = _saleFee;
        saleFeeAddress = _saleFeeAddress;

        // Transferring ERC721 to contract
        if (_asset.token == AuctionLib.TokenType.erc721) {
            IERC721Upgradeable(_asset.contractAddr).transferFrom(seller, address(this), _asset.tokenId);
        } else if (_asset.token == AuctionLib.TokenType.erc1155) {
            // Transferring ERC1155
            IERC1155Upgradeable(_asset.contractAddr).safeTransferFrom(
                seller,
                address(this),
                _asset.tokenId,
                1,
                new bytes(0)
            );
        } else revert('FixedPriceAuction: invalid asset token type');
    }

    /**********************
         Interaction
    **********************/

    /**
     * @dev function that allows a buyer to buy the asset at the fixed price
     */
    function buy() external {
        //operations done in "wei"
        require(block.timestamp < startTime + auctionDuration, 'FixedPriceAuction: ended');
        require(!isBought, 'FixedPriceAuction: somebody has already bought this item!');

        isBought = true;

        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            saleFeeAddress,
            (saleFee * price) / 100
        );
        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            seller,
            price - (saleFee * price) / 100
        );

        // Transfer asset to buyer
        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).safeTransferFrom(address(this), _msgSender(), asset.tokenId);
        else {
            // Asset token type must be ERC1155 as no revert during initialization
            IERC1155Upgradeable(asset.contractAddr).safeTransferFrom(
                address(this),
                _msgSender(),
                asset.tokenId,
                1,
                new bytes(0)
            );
        }

        emit Buy(_msgSender(), price);
    }

    /**
     * @notice must be the owner to call this function
     * @dev allows the owner to reclaim their asset if no one buys
     */
    function claim() external onlyRole(DEFAULT_ADMIN_ROLE) {
        //owner withdraws asset if nobody buys
        require(!isBought, 'FixedPriceAuction: cannot claim when the token has been sold already!');
        require(
            block.timestamp >= startTime + auctionDuration,
            'FixedPriceAuction: cannot claim when auction is ongoing!'
        );

        //transfer asset back to owner
        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).safeTransferFrom(address(this), seller, asset.tokenId);
        else {
            // Asset token type must be ERC1155 as no revert during initialization
            IERC1155Upgradeable(asset.contractAddr).safeTransferFrom(
                address(this),
                seller,
                asset.tokenId,
                1,
                new bytes(0)
            );
        }

        emit Claim(seller, asset.contractAddr, asset.tokenId);
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
        override(AccessControlUpgradeable, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
