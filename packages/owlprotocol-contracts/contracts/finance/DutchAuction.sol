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

import 'hardhat/console.sol';

contract DutchAuction is ERC721HolderUpgradeable, ERC1155HolderUpgradeable, OwnableUpgradeable, UUPSUpgradeable, FractionalExponents {
    /**********************
             Types
    **********************/
    event Start();
    event Bid(address indexed sender, uint256 amount);
    event Claim();

    address public nft;
    uint256 public nftId;
    address public acceptableToken;

    address payable public seller;

    uint256 public auctionDuration;
    uint256 public startPrice; //starting maximum price
    uint256 public endPrice; //once it hits this price the bids cannot go any lower
    uint256 public startTime;
    bool public started;
    uint256 public endAt; //keeps track of auction duration --> is this even needed if we already have auction duration?
    bool public isNonLinear;

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
     * @param _nft address of nft for auction
     * @param _nftId id of nft for auction
     * @param ERC20contractAddress address of ERC20 token accepted as payment
     * @param _startPrice highest starting price to start the auction
     * @param _endPrice lowest price that seller is willing to accept
     * @param _auctionDuration how long the auction should last
     * @param _isNonLinear set true if the seller wants to set a nonlinear decrease in price
     */
    function initialize(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear
    ) external initializer {
        __DutchAuction_init(
            _seller,
            _nft,
            _nftId,
            ERC20contractAddress,
            _startPrice,
            _endPrice,
            _auctionDuration,
            _isNonLinear
        );
    }

    function proxyInitialize(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear
    ) external onlyInitializing {
        __DutchAuction_init(
            _seller,
            _nft,
            _nftId,
            ERC20contractAddress,
            _startPrice,
            _endPrice,
            _auctionDuration,
            _isNonLinear
        );
    }

    function __DutchAuction_init(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear
    ) internal onlyInitializing {
        __Ownable_init();
        _transferOwnership(_seller);
        __DutchAuction_init_unchained(
            _seller,
            _nft,
            _nftId,
            ERC20contractAddress,
            _startPrice,
            _endPrice,
            _auctionDuration,
            _isNonLinear
        );
    }

    function __DutchAuction_init_unchained(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _auctionDuration,
        bool _isNonLinear
    ) internal onlyInitializing {
        require(_startPrice > _endPrice, "DutchAuction: start price must be greater than end price");
        nft = (_nft);
        nftId = _nftId;

        acceptableToken = (ERC20contractAddress);

        seller = _seller;
        auctionDuration = _auctionDuration;
        startPrice = _startPrice;
        endPrice = _endPrice;
        isNonLinear = _isNonLinear;
        IERC721Upgradeable(nft).transferFrom(seller, address(this), nftId);
    }

    //this is the interval : (block.timestamp at view - block.timestamp at start) / auctionDuration
    //this is the increment: (startPrice - endPrice) * interval

    //current price: start price - [(total time elapsed / auction duration) * (start price - end price)]

    /**********************
         Interaction
    **********************/

    function start() external onlyOwner {
        require(!started, 'DutchAuction: started');

        started = true;
        startTime = block.timestamp;
        endAt = block.timestamp + auctionDuration * 1 seconds; //should be controlled by startPrice/endPrice/timeIntervalLength

        emit Start();
    }

    /**
    Getters
    */

    function getCurrentPrice() public view returns (uint256) {
        //show the current price
        if (block.timestamp >= endAt) return 1e18 * endPrice;
        if (isNonLinear) {
            (uint256 result, uint8 precision) = (power(startPrice - endPrice, 1, uint32(block.timestamp - startTime), uint32( auctionDuration )));
            uint256 exp = (1e18*result/(2 ** precision));
            int256 const = int256(1e18 * int256(startPrice - endPrice) / (1 + int256(endPrice) - int256(startPrice)));

            return uint256((const * int256(exp) / 1e18) - const + 1e18 * int256(startPrice));
        }
        return (1e18 *
            startPrice -
            (((1e18 * (block.timestamp - startTime)) / (auctionDuration)) * ((startPrice - endPrice)))); //round (block.timestamp - startTime) to nearest multiple of 30 seconds: x - x mod 30
    }

    function bid() external payable {
        require(started, 'DutchAuction: not started');
        require(block.timestamp < endAt, 'DutchAuction: ended');

        uint256 bidPrice = getCurrentPrice();

        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            seller,
            bidPrice
        );
        IERC721Upgradeable(nft).safeTransferFrom(address(this),  _msgSender(), nftId);

        emit Bid(_msgSender(), bidPrice);
    }

    function claim() external onlyOwner { //owner withdraws asset if nobody bids
        require(started, 'DutchAuction: not started');
        require(block.timestamp >= endAt, 'DutchAuction: cannot claim when auction is ongoing!');

        IERC721Upgradeable(nft).safeTransferFrom(address(this), seller, nftId);

        emit Claim();
    }

    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
