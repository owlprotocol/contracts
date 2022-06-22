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

    IERC721Upgradeable public nft;
    uint public nftId;
    IERC20Upgradeable public acceptableToken;

    address payable public seller;
    address public bidder;

    uint public auctionDuration;
    uint public startPrice; //starting maximum price
    uint public endPrice; //once it hits this price the bids cannot go any lower
    uint public startTime;
    bool public started;
    bool public ended;
    uint public endAt; //keeps track of auction duration --> is this even needed if we already have auction duration?

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
     */
    function initialize(
        address payable _seller,
        address _nft,
        uint _nftId,
        address ERC20contractAddress,
        uint _startPrice,
        uint _endPrice,
        uint _auctionDuration
    ) public initializer {
        //requires


        //this is the interval : (block.timestamp at view - block.timestamp at start) / auctionDuration
        //this is the increment: (startPrice - endPrice) * interval

        //current price: start price - [(total time elapsed / auction duration) * (start price - end price)]


        nft = IERC721Upgradeable(_nft);
        nftId = _nftId;

        acceptableToken = IERC20Upgradeable(ERC20contractAddress);

        seller = _seller;
        auctionDuration = _auctionDuration;
        startPrice = _startPrice;
        endPrice = _endPrice;
        console.log('seller', seller);

        __Ownable_init();
        _transferOwnership(seller);
        console.log('owner', owner());
    }

    /**********************
         Interaction
    **********************/

    function start() external onlyOwner {
        require(!started, "started");

        nft.transferFrom(seller, address(this), nftId); //change from msg.sender to seller, why?
        started = true;
        startTime = block.timestamp;
        endAt = block.timestamp + auctionDuration * 1 seconds; //should be controlled by startPrice/endPrice/timeIntervalLength

        emit Start();
    }

    /**
    Getters
    */

    function getCurrentPrice() public view returns (uint) {
        //show the current price
        return startPrice - (((block.timestamp - startTime) - (block.timestamp - startTime) % 30) / auctionDuration) * (startPrice - endPrice);  //round (block.timestamp - startTime) to nearest multiple of 30 seconds: x - x mod 30
    }

    function bid(uint amount) external payable { //added from address to track original caller (bidder), why doesnt msg.sender work?
        require(started, "not started");
        require(block.timestamp < endAt, "ended");
        require(!ended, "auction ended");
        require(amount == getCurrentPrice(), "must bid the current price"); //check if this is right
        require(amount >= endPrice, "cannot bid lower than lowest possible price");

        SafeERC20Upgradeable.safeTransferFrom(
            acceptableToken,
            _msgSender(),
            address(this),
            amount
        );
        ended = true;
        bidder = _msgSender();

        emit Bid(_msgSender(), amount);
    }

    function transfer() external onlyOwner {
        require(started, "not started");

        if (ended) {
            nft.safeTransferFrom(address(this), bidder, nftId);
            seller.transfer(getCurrentPrice());
        } else if (block.timestamp >= endAt) { //added this because otherwise the owner can withdraw when the auction is ongoing but no bids are made (ended == false)
            nft.safeTransferFrom(address(this), seller, nftId);
        }

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
