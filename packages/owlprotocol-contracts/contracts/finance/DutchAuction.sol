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
import "@prb/math/contracts/PRBMathUD60x18.sol";

import "hardhat/console.sol";

contract DutchAuction is
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /**********************
             Types
    **********************/
    event Start();
    event Bid(address indexed sender, uint amount);
    event End(address winner, uint amount);

    address public nft;
    uint public nftId;
    address public acceptableToken;

    address payable public seller;
    address public bidder;

    uint public auctionDuration;
    uint public startPrice; //starting maximum price
    uint public endPrice; //once it hits this price the bids cannot go any lower
    uint public startTime;
    bool public started;
    bool public claimed;
    uint public endAt; //keeps track of auction duration --> is this even needed if we already have auction duration?
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
     * @param
     */
    function initialize(
        address payable _seller,
        address _nft,
        uint _nftId,
        address ERC20contractAddress,
        uint _startPrice,
        uint _endPrice,
        uint _auctionDuration
    ) external initializer {
        __DutchAuction_init(_seller, _nft, _nftId, ERC20contractAddress, _startPrice, _endPrice, _auctionDuration);
    }

    function proxyInitialize(
        address payable _seller,
        address _nft,
        uint _nftId,
        address ERC20contractAddress,
        uint _startPrice,
        uint _endPrice,
        uint _auctionDuration
    ) external onlyInitializing {
        __DutchAuction_init(_seller, _nft, _nftId, ERC20contractAddress, _startPrice, _endPrice, _auctionDuration);
    }

    function __DutchAuction_init(
        address payable _seller,
        address _nft,
        uint _nftId,
        address ERC20contractAddress,
        uint _startPrice,
        uint _endPrice,
        uint _auctionDuration
    ) internal onlyInitializing {
        __Ownable_init();
        _transferOwnership(_seller);
        __DutchAuction_init_unchained(_seller, _nft, _nftId, ERC20contractAddress, _startPrice, _endPrice, _auctionDuration);
    }

    function __DutchAuction_init_unchained(
        address payable _seller,
        address _nft,
        uint _nftId,
        address ERC20contractAddress,
        uint _startPrice,
        uint _endPrice,
        uint _auctionDuration
    ) internal onlyInitializing {
        nft = (_nft);
        nftId = _nftId;

        acceptableToken = (ERC20contractAddress);

        seller = _seller;
        auctionDuration = _auctionDuration;
        startPrice = _startPrice;
        endPrice = _endPrice;
        IERC721Upgradeable(nft).transferFrom(seller, address(this), nftId);
    }

        //this is the interval : (block.timestamp at view - block.timestamp at start) / auctionDuration
        //this is the increment: (startPrice - endPrice) * interval

        //current price: start price - [(total time elapsed / auction duration) * (start price - end price)]

    /**********************
         Interaction
    **********************/

    function start() external onlyOwner {
        require(!started, "DutchAuction: started");

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
        if (isNonLinear) return (1e18 * startPrice) - 1e18 * (startPrice - endPrice) ** (block.timestamp - startTime) + 1;   
    
        return (1e18 * startPrice - ((1e18 * (block.timestamp - startTime) / (auctionDuration))  * ((startPrice - endPrice))));  //round (block.timestamp - startTime) to nearest multiple of 30 seconds: x - x mod 30
        
        
    }

    function bid() external payable { //added from address to track original caller (bidder), why doesnt msg.sender work?
        require(started, "DutchAuction: not started");
        require(block.timestamp < endAt, "DutchAuction: ended");


        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            address(this),
            getCurrentPrice()
        );

        claimed = true;
        bidder = _msgSender();
        emit Bid(_msgSender(), getCurrentPrice());
    }

    function claim() external onlyOwner {
        require(started, "DutchAuction: not started");
        require(block.timestamp >= endAt, "DutchAuction: not ended");

        if (claimed) {
            IERC721Upgradeable(nft).safeTransferFrom(address(this), bidder, nftId);
            IERC20Upgradeable(acceptableToken).transfer(seller, getCurrentPrice());
        } else 
            IERC721Upgradeable(nft).safeTransferFrom(address(this), seller, nftId);
        
        

        emit End(bidder, getCurrentPrice());
    }

    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
