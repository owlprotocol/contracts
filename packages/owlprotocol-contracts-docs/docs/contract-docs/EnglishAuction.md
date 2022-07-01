

## EnglishAuction

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### Start

```solidity
event Start(uint256 startTime)
```

### Bid

```solidity
event Bid(address sender, uint256 amount)
```

### Withdraw

```solidity
event Withdraw(address bidder, uint256 amount)
```

### asset

```solidity
struct AuctionLib.Asset asset
```

### acceptableToken

```solidity
address acceptableToken
```

### seller

```solidity
address payable seller
```

### saleFeeAddress

```solidity
address payable saleFeeAddress
```

### started

```solidity
bool started
```

### ownerClaimed

```solidity
bool ownerClaimed
```

### winnerClaimed

```solidity
bool winnerClaimed
```

### endAt

```solidity
uint256 endAt
```

### auctionDuration

```solidity
uint256 auctionDuration
```

### startPrice

```solidity
uint256 startPrice
```

### resetTime

```solidity
uint256 resetTime
```

### saleFee

```solidity
uint256 saleFee
```

### highestBidder

```solidity
address highestBidder
```

### bids

```solidity
mapping(address &#x3D;&gt; uint256) bids
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _auctionDuration, uint256 _resetTime, uint256 _saleFee, address payable _saleFeeAddress) external
```

_Create auction instance_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _seller | address payable | address of seller for auction |
| _asset | struct AuctionLib.Asset | struct containing information of the asset to be listed |
| ERC20contractAddress | address | address of ERC20 token accepted as payment |
| _startPrice | uint256 | start bid on nft |
| _auctionDuration | uint256 | duration of auction (in seconds) |
| _resetTime | uint256 | time at which the auction resets when a bid is made within this time frame (in seconds) |
| _saleFee | uint256 | the percentage of the sale to be sent to the original owner as commission |
| _saleFeeAddress | address payable | the address to which the sale fee is sent |

### proxyInitialize

```solidity
function proxyInitialize(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _auctionDuration, uint256 _resetTime, uint256 _saleFee, address payable _saleFeeAddress) external
```

### __EnglishAuction_init

```solidity
function __EnglishAuction_init(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _auctionDuration, uint256 _resetTime, uint256 _saleFee, address payable _saleFeeAddress) internal
```

### __EnglishAuction_init_unchained

```solidity
function __EnglishAuction_init_unchained(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _auctionDuration, uint256 _resetTime, uint256 _saleFee, address payable _saleFeeAddress) internal
```

### start

```solidity
function start() external
```

Must be called by owner!

_Allows the owner to start the auction_

### bid

```solidity
function bid(uint256 amount) external
```

_Allow a user to place a bid_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | to bid |

### withdraw

```solidity
function withdraw() external
```

Highest bid cannot withdraw

_Allow a user to withdraw their bid_

### ownerClaim

```solidity
function ownerClaim() external
```

_Allows owner to claim bid. The seller must call to transfer the erc20 to themselves_

### winnerClaim

```solidity
function winnerClaim() external
```

_Allows auction winner to claim the asset they won._

### getCurrentBid

```solidity
function getCurrentBid() external view returns (uint256)
```

_Returns the current highest bid_

### getRemainingTime

```solidity
function getRemainingTime() external view returns (uint256)
```

_Returns the remaining time_

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

_Returns the address of the implementation contract._

### getImplementation

```solidity
function getImplementation() external view returns (address)
```

_Returns the address of the implementation contract._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_ERC165 Support_

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaceId | bytes4 | hash of the interface testing for |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool whether interface is supported |

