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

    address public nft;
    uint256 public nftId;
    address public acceptableToken;

    address payable public seller;
    bool public started;
    bool public claimed;
    uint256 public endAt;
    uint256 public auctionDuration;
    uint256 public startingBid;
    uint256 public resetTime; //number of seconds the auction is reset to after a bid within this time

    address public highestBidder;
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
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startingBid,
        uint256 _auctionDuration,
        uint256 _resetTime
    ) external initializer {
        __EnglishAuction_init(_seller, _nft, _nftId, ERC20contractAddress, _startingBid, _auctionDuration, _resetTime);
    }

    function proxyInitialize(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startingBid,
        uint256 _auctionDuration,
        uint256 _resetTime
    ) external onlyInitializing {
        __EnglishAuction_init(_seller, _nft, _nftId, ERC20contractAddress, _startingBid, _auctionDuration, _resetTime);
    }

    function __EnglishAuction_init(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startingBid,
        uint256 _auctionDuration,
        uint256 _resetTime
    ) internal onlyInitializing {
        __Ownable_init();
        _transferOwnership(_seller);

        __EnglishAuction_init_unchained(
            _seller,
            _nft,
            _nftId,
            ERC20contractAddress,
            _startingBid,
            _auctionDuration,
            _resetTime
        );
    }

    function __EnglishAuction_init_unchained(
        address payable _seller,
        address _nft,
        uint256 _nftId,
        address ERC20contractAddress,
        uint256 _startingBid,
        uint256 _auctionDuration,
        uint256 _resetTime
    ) internal onlyInitializing {
        nft = (_nft);
        nftId = _nftId;

        acceptableToken = (ERC20contractAddress);

        seller = _seller;
        auctionDuration = _auctionDuration;
        startingBid = _startingBid;
        resetTime = _resetTime;
        IERC721Upgradeable(nft).transferFrom(seller, address(this), nftId);
    }

    /**********************
         Interaction
    **********************/

    function start() external onlyOwner {
        require(!started, 'EnglishAuction: started');

        started = true;
        endAt = block.timestamp + auctionDuration * 1 seconds; // can save gas here by changing endAt to auctionDuration (?)

        emit Start();
    }

    function bid(uint256 amount) external payable {
        require(started, 'EnglishAuction: not started');
        require(block.timestamp < endAt, 'EnglishAuction: ended');
        require(amount > bids[highestBidder], 'EnglishAuction: value <= highest');

        highestBidder = _msgSender();
        uint256 currBid = bids[_msgSender()];
        bids[_msgSender()] += amount - bids[_msgSender()];

        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            _msgSender(),
            address(this),
            amount - currBid
        );

        // if bid is made with < reset time remaining on the auction , then add to endAt
        if (endAt - block.timestamp < resetTime) endAt = (block.timestamp + resetTime) * 1 seconds;

        emit Bid(_msgSender(), amount);
    }

    function withdraw() external {
        //added from parameter as above
        require(_msgSender() != highestBidder, 'EnglishAuction: the highest bidder cannot withdraw!');

        uint256 bal = bids[_msgSender()];
        bids[_msgSender()] = 0;

        IERC20Upgradeable(acceptableToken).transfer(_msgSender(), bal);

        emit Withdraw(_msgSender(), bal);
    }

    //after auction ends, the seller must call end() to transfer nft and funds
    function claim() external onlyOwner {
        require(started, 'EnglishAuction: not started');
        require(block.timestamp >= endAt, 'EnglishAuction: not ended');
        require(!claimed, 'EnglishAuction: already claimed');

        claimed = true;
        if (highestBidder != address(0)) {
            IERC721Upgradeable(nft).safeTransferFrom(address(this), highestBidder, nftId);
            IERC20Upgradeable(acceptableToken).transfer(seller, bids[highestBidder]);
        } else IERC721Upgradeable(nft).safeTransferFrom(address(this), seller, nftId);

        emit End(highestBidder, bids[highestBidder]);
    }

    /**
    Getters
    */

    function getCurrentBid() external view returns (uint256) {
        //show the current price
        return bids[highestBidder];
    }

    function getRemainingTime() external view returns (uint256) {
        if (block.timestamp >= endAt) return 0;
        return endAt - block.timestamp; //in seconds
    }

    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}
