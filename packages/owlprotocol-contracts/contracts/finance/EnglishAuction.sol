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

contract EnglishAuction is 
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
    event Withdraw(address indexed bidder, uint amount);
    event End(address winner, uint amount);

    IERC721Upgradeable public nft;
    uint public nftId;
    IERC20Upgradeable public acceptableToken;

    address payable public seller;
    
    uint public auctionDuration;
    uint public endAt; 
    bool public started;
    bool public ended;
    //IMPLEMENT RESET TIME
    //IMPLMENT BIDS HAVE TO BE MULITPLIER LARGER THAN CURRENT HIGHEST BID

    address public highestBidder;
    uint public highestBid;
    mapping(address => uint) public bids;

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
     * @param _auctionDuration duration of auction (in days)
     */
    function initialize(
        address payable _seller,
        address _nft,
        uint _nftId,
        address ERC20contractAddress, 
        uint _startingBid,
        uint _auctionDuration
    ) public initializer {
        //requires

        nft = IERC721Upgradeable(_nft);
        nftId = _nftId;

        acceptableToken = IERC20Upgradeable(ERC20contractAddress);

        seller = _seller;
        auctionDuration = _auctionDuration;
        highestBid = _startingBid;
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
        require(amount > highestBid, "value <= highest");
        
        SafeERC20Upgradeable.safeTransferFrom(
            acceptableToken,
            from,
            address(this),
            amount
        );

        highestBidder = from;
        highestBid = amount;
        
        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }

        emit Bid(from, amount);
    }

    function withdraw(address to) external { //added from parameter as above
        if (!ended) { //the highest bidder while the auction is ongoing cannot withdraw; can only withdraw when ended
            require(to != highestBidder, 'the highest bidder cannot withdraw!');
        }
        uint bal = bids[to];
        bids[to] = 0;

        acceptableToken.transfer(to, bal);
        
        emit Withdraw(to, bal);
    }

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
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}