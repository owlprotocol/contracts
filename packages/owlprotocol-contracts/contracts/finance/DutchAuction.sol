// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol';

import '../OwlBase.sol';

import '../utils/FractionalExponents.sol';
import './AuctionLib.sol';

/**
 * @dev This contract is a simple on-chain Dutch Auction with a pricing view function that
 * decreases over a set period of time. In a Dutch Auction, the seller defines a starting ceiling price
 * and an ending floor price that then decreases over time based on either a linear or nonlinear function.
 * If a bid is made at any point, the bid must match the current price. Once a bid is made, the auction ends
 * and the owner will receive the current price in which the bid was made in ERC20 tokens. The asset is then
 * transferred to the bidder.
 */
contract DutchAuction is OwlBase, ERC721HolderUpgradeable, ERC1155HolderUpgradeable, FractionalExponents {
    // Specification + ERC165
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://DutchAuction/', _version)));

    /**********************
             Types
    **********************/
    event Start(uint256 startTime);
    event Bid(address indexed sender, uint256 indexed amount);
    event Claim(address indexed seller, address indexed contractAddr, uint256 tokenId);

    AuctionLib.Asset public asset;
    address public acceptableToken;

    address payable public seller;
    address payable public saleFeeAddress;

    uint256 public auctionDuration;
    uint256 public startPrice; //starting maximum price
    uint256 public endPrice; //floor price
    uint256 public startTime;
    uint256 public saleFee;

    bool public isNonLinear;
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
     * @param _startPrice highest starting price to start the auction
     * @param _endPrice lowest price that seller is willing to accept
     * @param _auctionDuration duration of auction (in seconds)
     * @param _isNonLinear set true if the seller wants to set a nonlinear decrease in price
     * @param _saleFee the percentage of the sale to be sent to the marketplace as commission
     * @param _saleFeeAddress the address to which the sale fee is sent
     * @param _forwarder the address for the Trusted Forwarder for Open GSN integration
     */
    function initialize(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) external initializer {
        __DutchAuction_init(
            _seller,
            _asset,
            ERC20contractAddress,
            _startPrice,
            _endPrice,
            _auctionDuration,
            _isNonLinear,
            _saleFee,
            _saleFeeAddress,
            _forwarder
        );
    }

    function proxyInitialize(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) external onlyInitializing {
        __DutchAuction_init(
            _seller,
            _asset,
            ERC20contractAddress,
            _startPrice,
            _endPrice,
            _auctionDuration,
            _isNonLinear,
            _saleFee,
            _saleFeeAddress,
            _forwarder
        );
    }

    function __DutchAuction_init(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_seller, _forwarder);

        __DutchAuction_init_unchained(
            _seller,
            _asset,
            ERC20contractAddress,
            _startPrice,
            _endPrice,
            _auctionDuration,
            _isNonLinear,
            _saleFee,
            _saleFeeAddress
        );
    }

    function __DutchAuction_init_unchained(
        address payable _seller,
        AuctionLib.Asset memory _asset,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear,
        uint256 _saleFee,
        address payable _saleFeeAddress
    ) internal onlyInitializing {
        require(_startPrice > _endPrice, 'DutchAuction: start price must be greater than end price');
        require(_saleFee <= 100, 'DutchAuction: sale fee cannot be greater than 100 percent!'); // TODO: May want to look into optimizing this so that it takes into account the royalty fee
        require(_saleFeeAddress != _seller, 'DutchAuction: seller cannot be the same as the owner!');

        asset = _asset;

        acceptableToken = ERC20contractAddress;

        seller = _seller;
        auctionDuration = _auctionDuration;
        startPrice = _startPrice;
        endPrice = _endPrice;
        isNonLinear = _isNonLinear;
        isBought = false;
        saleFee = _saleFee;
        saleFeeAddress = _saleFeeAddress;

        //transferring ERC 721
        if (_asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(_asset.contractAddr).transferFrom(seller, address(this), _asset.tokenId);
        else {
            // Solidity enforces TokenType will be 721 or 1155
            IERC1155Upgradeable(_asset.contractAddr).safeTransferFrom(
                seller,
                address(this),
                _asset.tokenId,
                1,
                new bytes(0)
            );
        }

        startTime = block.timestamp;
    }

    /**********************
            Getters
    **********************/

    /**
     * @dev Returns the current price of the asset based on the timestamp and type of function
     * @return uint256 price of the asset
     */
    function getCurrentPrice() public view returns (uint256) {
        //show the current price
        if (block.timestamp >= startTime + auctionDuration) return 1e18 * endPrice;
        if (isNonLinear) {
            (uint256 result, uint8 precision) = (
                power(startPrice - endPrice, 1, uint32(block.timestamp - startTime), uint32(auctionDuration))
            );
            uint256 exp = ((1e18 * result) / (2**precision));
            int256 const = int256((1e18 * int256(startPrice - endPrice)) / (1 + int256(endPrice) - int256(startPrice)));

            return uint256(((const * int256(exp)) / 1e18) - const + 1e18 * int256(startPrice));
        }
        return (1e18 *
            startPrice -
            (((1e18 * (block.timestamp - startTime)) / (auctionDuration)) * ((startPrice - endPrice))));
    }

    /**********************
         Interaction
    **********************/

    /**
     * @notice The required ERC20 tokens must be pre-approved before calling!
     * @dev Allows a user to bid at the current price
     */
    function bid() external {
        require(block.timestamp < startTime + auctionDuration, 'DutchAuction: ended');
        require(!isBought, 'DutchAuction: somebody has already bought this item!');

        uint256 bidPrice = getCurrentPrice();
        uint256 marketplaceCommission = (saleFee * bidPrice) / 100;
        address royaltyReceiver;
        uint256 royaltyAmount;

        isBought = true;

        // Marketplace commission
        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            saleFeeAddress,
            marketplaceCommission
        );
        // Royalty
        if (IERC165Upgradeable(asset.contractAddr).supportsInterface(type(IERC2981Upgradeable).interfaceId)) {
            (royaltyReceiver, royaltyAmount) = IERC2981Upgradeable(asset.contractAddr).royaltyInfo(
                asset.tokenId,
                bidPrice
            );
            SafeERC20Upgradeable.safeTransferFrom(
                IERC20Upgradeable(acceptableToken),
                _msgSender(),
                royaltyReceiver,
                royaltyAmount
            );
        }
        // Transfer remainder to seller
        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            seller,
            bidPrice - marketplaceCommission - royaltyAmount // Royalty amount is default 0 if not set
        );

        // Transfer asset to buyer
        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).safeTransferFrom(address(this), _msgSender(), asset.tokenId);
        else {
            // Asset token type is 1155 as initialization did not revert
            IERC1155Upgradeable(asset.contractAddr).safeTransferFrom(
                address(this),
                _msgSender(),
                asset.tokenId,
                1,
                new bytes(0)
            );
        }
        emit Bid(_msgSender(), bidPrice);
    }

    /**
     * @dev Allows the owner to claim back the asset if nobody bids and auction expires
     */
    function claim() external onlyRole(DEFAULT_ADMIN_ROLE) {
        //owner withdraws asset if nobody bids
        require(block.timestamp >= startTime + auctionDuration, 'DutchAuction: cannot claim when auction is ongoing!');
        require(!isBought, 'DutchAuction: you cannot claim when the the asset was already sold!');

        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).safeTransferFrom(address(this), seller, asset.tokenId);
        else {
            // Asset token type is 1155 as initialization did not revert
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
        override(OwlBase, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
