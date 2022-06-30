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

import '../utils/FractionalExponents.sol';
import './AuctionLib.sol';

import 'hardhat/console.sol';

contract DutchAuction is
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    FractionalExponents
{
    // Specification + ERC165
    string private constant VERSION = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://DutchAuction/', VERSION)));

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
     * @param _saleFee the percentage of the sale to be sent to the original owner as commission
     * @param _saleFeeAddress the address to which the sale fee is sent
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
        address payable _saleFeeAddress
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
            _saleFeeAddress
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
        address payable _saleFeeAddress
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
            _saleFeeAddress
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
        address payable _saleFeeAddress
    ) internal onlyInitializing {
        __Ownable_init();
        _transferOwnership(_seller);
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
        else if (_asset.token == AuctionLib.TokenType.erc1155)
            //transferring ERC 1155
            IERC1155Upgradeable(_asset.contractAddr).safeTransferFrom(
                seller,
                address(this),
                _asset.tokenId,
                1,
                new bytes(0)
            );
        startTime = block.timestamp;
    }

    //this is the interval : (block.timestamp at view - block.timestamp at start) / auctionDuration
    //this is the increment: (startPrice - endPrice) * interval

    //current price: start price - [(total time elapsed / auction duration) * (start price - end price)]

    /**********************
         Interaction
    **********************/

    /**
    Getters
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

    function bid() external payable {
        require(block.timestamp < startTime + auctionDuration, 'DutchAuction: ended');
        require(!isBought, 'DutchAuction: somebody has already bought this item!');

        uint256 bidPrice = getCurrentPrice();

        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            saleFeeAddress,
            (saleFee * bidPrice) / 100
        );
        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            seller,
            bidPrice - (saleFee * bidPrice) / 100
        );

        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).safeTransferFrom(address(this), _msgSender(), asset.tokenId);
        else if (asset.token == AuctionLib.TokenType.erc1155)
            IERC1155Upgradeable(asset.contractAddr).safeTransferFrom(
                address(this),
                _msgSender(),
                asset.tokenId,
                1,
                new bytes(0)
            );

        isBought = true;

        emit Bid(_msgSender(), bidPrice);
    }

    function claim() external onlyOwner {
        //owner withdraws asset if nobody bids
        require(block.timestamp >= startTime + auctionDuration, 'DutchAuction: cannot claim when auction is ongoing!');

        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).safeTransferFrom(address(this), seller, asset.tokenId);
        else if (asset.token == AuctionLib.TokenType.erc1155)
            IERC1155Upgradeable(asset.contractAddr).safeTransferFrom(
                address(this),
                seller,
                asset.tokenId,
                1,
                new bytes(0)
            );

        emit Claim(seller, asset.contractAddr, asset.tokenId);
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
}
