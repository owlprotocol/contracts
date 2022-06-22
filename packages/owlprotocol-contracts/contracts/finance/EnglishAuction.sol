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

import 'hardhat/console.sol';

contract EnglishAuction is ERC721HolderUpgradeable, ERC1155HolderUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /**********************
             Types
    **********************/
    event Start();
    event Bid(address indexed sender, uint256 amount);
    event Withdraw(address indexed bidder, uint256 amount);
    event End(address winner, uint256 amount);

    IERC721Upgradeable public nft;
    uint256 public nftId;
    IERC20Upgradeable public acceptableToken;

    address payable public seller;
    uint256 public endAt;
    uint256 public auctionDuration;
    bool public started;
    bool public ended;
    uint256 public resetTime; //number of seconds the auction is reset to after a bid within this time


    //IMPLEMENT RESET TIME
    //IMPLMENT BIDS HAVE TO BE MULITPLIER LARGER THAN CURRENT HIGHEST BID

    address public highestBidder;
    uint256 public highestBid;
    mapping(address => uint256) public bids;

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
     * @param _startingBid start bid on nft
     * @param _auctionDuration duration of auction (in seconds)
     * @param _resetTime time at which the auction resets when a bid is made within this time frame (in seconds)
     */
    function initialize(
        address payable _seller,
        address _nft,
        uint _nftId,
        address ERC20contractAddress,
        uint _startingBid,
        uint _auctionDuration,
        uint _resetTime
    ) public initializer {
        //requires
        require (_resetTime > 0, 'must have a valid reset time');

    function proxyInitialize(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startingBid,
        uint256 _auctionDuration
    ) external onlyInitializing {
        __EnglishAuction_init(_seller, _nft, _nftId, ERC20contractAddress, _startingBid, _auctionDuration);
    }

    function __EnglishAuction_init(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startingBid,
        uint256 _auctionDuration
    ) internal onlyInitializing {
        __Ownable_init();
        _transferOwnership(seller);
        __EnglishAuction_init_unchained(_seller, _nft, _nftId, ERC20contractAddress, _startingBid, _auctionDuration);
    }

    function __EnglishAuction_init_unchained(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startingBid,
        uint256 _auctionDuration
    ) internal onlyInitializing {
        nft = IERC721Upgradeable(_nft);
        nftId = _nftId;

        acceptableToken = IERC20Upgradeable(ERC20contractAddress);

        seller = _seller;
        auctionDuration = _auctionDuration;
        resetTime = _resetTime;
        highestBid = _startingBid;

        __Ownable_init();
        _transferOwnership(seller);
    }

    /**********************
         Interaction
    **********************/

    function start() external onlyOwner {
        require(!started, 'started');
        //require(msg.sender == seller, "not seller");

        nft.transferFrom(seller, address(this), nftId); //change from msg.sender to seller, why?
        started = true;
        endAt = block.timestamp + auctionDuration * 1 seconds; // can save gas here by changing endAt to auctionDuration (?)

        emit Start();
    }

    function bid(uint amount, address from) external payable { //added from address to track original caller (bidder), why doesnt msg.sender work?
        //require(endAt > 0, "time's up, auction is over"); //same as line 114 pretty much?
        require(started, "not started");
        require(block.timestamp < endAt, "ended");
        require(amount > highestBid, "value <= highest");


        SafeERC20Upgradeable.safeTransferFrom(
            acceptableToken,
            from,
            address(this),
            amount
        );

        // if bid is made with < reset time remaining on the auction , then add to endAt
        if (endAt - block.timestamp  < resetTime) {

            endAt += (resetTime - (endAt - block.timestamp)) * 1 seconds;

            /**
            //bid at 55 want new endAt = 65
            endAt += 10 - (60 - 55)
            endAt += 5
            60 + 5 = 65


            //bid at 59 want new endAt = 69
            endAt += 10 - (60 - 59)
            endAt += 9
            60 + 9 = 69

            //bid at 53 want new endAt = 63
            endAt += 10 - (60 - 53)
            endAt += 3
            60 + 3 = 63
            */
        }

        highestBidder = from;
        highestBid = amount;

        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }


        //endAt = block.timestamp + resetTime;

        emit Bid(from, amount);
    }

    function withdraw(address to) external {
        //added from parameter as above
        if (!ended) {
            //the highest bidder while the auction is ongoing cannot withdraw; can only withdraw when ended
            require(to != highestBidder, 'the highest bidder cannot withdraw!');
        }
        uint256 bal = bids[to];
        bids[to] = 0;

        acceptableToken.transfer(to, bal);

        emit Withdraw(to, bal);
    }

    //after auction ends, the seller must call end() to transfer nft and funds
    function end() external onlyOwner {
        require(started, "not started");
        require(block.timestamp >= endAt, "not ended");
        require(!ended, "ended");

        ended = true;
        if (highestBidder != address(0)) {
            nft.safeTransferFrom(address(this), highestBidder, nftId);

            acceptableToken.transfer(seller, highestBid);

            bids[highestBidder] -= highestBid; //addition
        } else {
            nft.safeTransferFrom(address(this), seller, nftId);
        }

        emit End(highestBidder, highestBid);
    }

    /**
    Getters
    */

    function getCurrentBid() external view returns (uint) {
        //show the current price
        return highestBid;
    }

    function getCurrentHighestBidder() external view returns (address) {
        return highestBidder;
    }

    function getRemainingTime() external view returns (uint) {
        return endAt - block.timestamp; //in seconds
    }

    function getResetTime() external view returns (uint) {
        return resetTime;
    }

    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
