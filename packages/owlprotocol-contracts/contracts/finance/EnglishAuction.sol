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
import './AuctionLib.sol';
import 'hardhat/console.sol';

/**
 * @dev This contract is a standard English Auction smart contract that allows
 * bidders to keep bidding until the highest bidder wins the asset. In an
 * English Auction, the owner defines the starting price and bidders can make
 * bids that are higher than the current price.* The auction duration is defined
 * by the bids being made and if they are made within the resetTime.
 * Theoretically, the auction can go on forever if higher bids continue to be
 * made within the resetTime period.* Once the ending time is passed, the
 * auction finishes and the NFT is transferred to the highest bidder.
 */
contract EnglishAuction is OwlBase, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://EnglishAuction/', version)));

    /**********************
             Types
    **********************/
    event Start(uint256 startTime);
    event Bid(address indexed sender, uint256 amount);
    event Withdraw(address indexed bidder, uint256 amount);

    AuctionLib.Asset public asset;
    address public acceptableToken;

    address payable public seller;
    address payable public saleFeeAddress;
    bool public ownerClaimed;
    bool public winnerClaimed;

    uint256 public endAt;
    uint256 public auctionDuration;
    uint256 public startPrice;
    uint256 public resetTime; //number of seconds the auction is reset to after a bid within this time
    uint256 public saleFee;

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
     * @dev Create English Auction instance
     * @param _seller address of seller for auction
     * @param _asset struct containing information of the asset to be listed
     * @param ERC20contractAddress address of ERC20 token accepted as payment
     * @param _startPrice start bid on nft
     * @param _auctionDuration duration of auction (in seconds)
     * @param _resetTime time at which the auction resets when a bid is made within this time frame (in seconds)
     * @param _saleFee the percentage of the sale to be sent to the marketplace as commission
     * @param _saleFeeAddress the address to which the sale fee is sent
     * @param _forwarder the address for the Trusted Forwarder for Open GSN integration
     */
    function initialize(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _auctionDuration,
        uint256 _resetTime,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) external initializer {
        __EnglishAuction_init(
            _seller,
            _asset,
            ERC20contractAddress,
            _startPrice,
            _auctionDuration,
            _resetTime,
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
        uint256 _auctionDuration,
        uint256 _resetTime,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) external onlyInitializing {
        __EnglishAuction_init(
            _seller,
            _asset,
            ERC20contractAddress,
            _startPrice,
            _auctionDuration,
            _resetTime,
            _saleFee,
            _saleFeeAddress,
            _forwarder
        );
    }

    function __EnglishAuction_init(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _auctionDuration,
        uint256 _resetTime,
        uint256 _saleFee,
        address payable _saleFeeAddress,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_seller, _forwarder);

        __EnglishAuction_init_unchained(
            _seller,
            _asset,
            ERC20contractAddress,
            _startPrice,
            _auctionDuration,
            _resetTime,
            _saleFee,
            _saleFeeAddress
        );
    }

    function __EnglishAuction_init_unchained(
        address payable _seller,
        AuctionLib.Asset calldata _asset,
        address ERC20contractAddress,
        uint256 _startPrice,
        uint256 _auctionDuration,
        uint256 _resetTime,
        uint256 _saleFee,
        address payable _saleFeeAddress
    ) internal onlyInitializing {
        require(_saleFee <= 100, 'EnglishAuction: saleFee cannot be above 100 percent!');
        asset = _asset;

        acceptableToken = ERC20contractAddress;

        seller = _seller;
        auctionDuration = _auctionDuration;
        startPrice = _startPrice;
        resetTime = _resetTime;
        saleFee = _saleFee;
        saleFeeAddress = _saleFeeAddress;

        // Transferring ERC721
        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).transferFrom(seller, address(this), asset.tokenId);
        else {
            // Solidity enforces TokenType will be 721 or 1155
            IERC1155Upgradeable(asset.contractAddr).safeTransferFrom(
                seller,
                address(this),
                asset.tokenId,
                1,
                new bytes(0)
            );
        }

        endAt = block.timestamp + _auctionDuration * 1 seconds;
    }

    /**********************
         Interaction
    **********************/
    /**
     * @dev Allow a user to place a bid that must be higher than the highest bid
     * @param amount to bid by the bidder
     */
    function bid(uint256 amount) external {
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

    /**
     * @notice Highest bidder cannot withdraw
     * @dev Allows a user to withdraw their bid.
     */
    function withdraw() external {
        // Added from parameter as above
        require(_msgSender() != highestBidder, 'EnglishAuction: the highest bidder cannot withdraw!');

        uint256 bal = bids[_msgSender()];
        bids[_msgSender()] = 0;

        IERC20Upgradeable(acceptableToken).transfer(_msgSender(), bal);

        emit Withdraw(_msgSender(), bal);
    }

    /**
     * @dev Allows owner to claim bid.
     * The seller must call to transfer the ERC20 to themselves
     */
    function ownerClaim() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(block.timestamp >= endAt, 'EnglishAuction: not ended');
        require(!ownerClaimed, 'EnglishAuction: owner has already claimed');

        ownerClaimed = true;
        if (highestBidder != address(0)) {
            uint256 marketplaceCommission = (saleFee * bids[highestBidder]) / 100;
            address royaltyReceiver;
            uint256 royaltyAmount;
            // Marketplace commission
            IERC20Upgradeable(acceptableToken).transfer(saleFeeAddress, (saleFee * bids[highestBidder]) / 100);
            // Royalty
            if (IERC165Upgradeable(asset.contractAddr).supportsInterface(type(IERC2981Upgradeable).interfaceId)) {
                (royaltyReceiver, royaltyAmount) = IERC2981Upgradeable(asset.contractAddr).royaltyInfo(
                    asset.tokenId,
                    bids[highestBidder]
                );
                IERC20Upgradeable(acceptableToken).transfer(royaltyReceiver, royaltyAmount);
            }
            // Transfer remainder to seller
            IERC20Upgradeable(acceptableToken).transfer(
                seller,
                bids[highestBidder] - marketplaceCommission - royaltyAmount
            );
        } else {
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
        }
    }

    /**
     * @dev Allows auction winner to claim the asset they won and transfers ownership
     */
    function winnerClaim() external {
        require(block.timestamp >= endAt, 'EnglishAuction: not ended');
        require(!winnerClaimed, 'EnglishAuction: winner has already claimed');
        require(_msgSender() == highestBidder, 'EnglishAuction: you are not the winner, you cannot claim!'); //highestBidder at end is the winning address

        winnerClaimed = true;
        if (asset.token == AuctionLib.TokenType.erc721)
            IERC721Upgradeable(asset.contractAddr).safeTransferFrom(address(this), highestBidder, asset.tokenId);
        else {
            // Asset token type is 1155 as initialization did not revert
            IERC1155Upgradeable(asset.contractAddr).safeTransferFrom(
                address(this),
                highestBidder,
                asset.tokenId,
                1,
                new bytes(0)
            );
        }
    }

    /**********************
            Getters
    **********************/

    /**
     * @dev Returns the current highest bid
     */
    function getCurrentBid() external view returns (uint256) {
        //show the current price
        return bids[highestBidder];
    }

    /**
     * @dev Returns the remaining time in the auction
     */
    function getRemainingTime() external view returns (uint256) {
        if (block.timestamp >= endAt) return 0;
        return endAt - block.timestamp; //in seconds
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
