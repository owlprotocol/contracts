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

    uint public auctionDuration;
    uint public endPrice; //once it hits this price the bids cannot go any lower?
    bool public started;
    bool public ended;
    uint public endAt; //keeps track of auction duration --> is this even needed?

    address public highestBidder;
    uint public currentPrice;
    //mapping(address => uint) public bids; i don't think we need a mapping because this is one and done?

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
     * @param _auctionDuration duration of auction (in hours)
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

        nft = IERC721Upgradeable(_nft);
        nftId = _nftId;

        acceptableToken = IERC20Upgradeable(ERC20contractAddress);

        seller = _seller;
        auctionDuration = _auctionDuration;
        currentPrice = _startPrice;
        endPrice = _endPrice;
        //console.log('seller', seller);

        __Ownable_init();
        _transferOwnership(seller);
        //console.log('owner', owner());
    }

    /**********************
         Interaction
    **********************/

    function start() external onlyOwner {
        require(!started, "started");
        //require(msg.sender == seller, "not seller");

        nft.transferFrom(seller, address(this), nftId); //change from msg.sender to seller, why?
        started = true;
        endAt = block.timestamp + auctionDuration * 1 days;

        emit Start();
    }

    function bid(uint amount, address from) external payable { //added from address to track original caller (bidder), why doesnt msg.sender work?
        require(started, "not started");
        require(block.timestamp < endAt, "ended");
        //require(amount > highestBid, "value < highest"); not necessarily true here because highestBid is just the starting price that goes down?
        require(amount = currentPrice, "must bid the current price"); //check if this is right
        require(amount > endPrice, "cannot bid lower than lowest possible price");
        console.log("message sender:" , from);

        SafeERC20Upgradeable.safeTransferFrom(
            acceptableToken,
            from,
            address(this),
            amount
        );

        if (highestBidder != address(0)) {
            //bids[highestBidder] += highestBid;
        }

        highestBidder = from; //highestBidder is the winner and the auction should end
        //highestBid = amount;

        emit Bid(from, amount);
    }

    function end() external onlyOwner {
        require(started, "not started");
        //require(block.timestamp >= endAt, "not ended"); not necessarily true here because auction finishes as soon as a bid is made
        require(!ended, "ended");

        ended = true;
        if (highestBidder != address(0)) {
            nft.safeTransferFrom(address(this), highestBidder, nftId);
            seller.transfer(currentPrice);
        } else {
            nft.safeTransferFrom(address(this), seller, nftId);
        }

        emit End(highestBidder, currentPrice);
    }

    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
