

## DutchAuction

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

### Claim

```solidity
event Claim(address seller, address contractAddr, uint256 tokenId)
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

### auctionDuration

```solidity
uint256 auctionDuration
```

### startPrice

```solidity
uint256 startPrice
```

### endPrice

```solidity
uint256 endPrice
```

### startTime

```solidity
uint256 startTime
```

### saleFee

```solidity
uint256 saleFee
```

### isNonLinear

```solidity
bool isNonLinear
```

### isBought

```solidity
bool isBought
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _endPrice, uint256 _auctionDuration, bool _isNonLinear, uint256 _saleFee, address payable _saleFeeAddress) external
```

_Create auction instance_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _seller | address payable | address of seller for auction |
| _asset | struct AuctionLib.Asset | struct containing information of the asset to be listed |
| ERC20contractAddress | address | address of ERC20 token accepted as payment |
| _startPrice | uint256 | highest starting price to start the auction |
| _endPrice | uint256 | lowest price that seller is willing to accept |
| _auctionDuration | uint256 | duration of auction (in seconds) |
| _isNonLinear | bool | set true if the seller wants to set a nonlinear decrease in price |
| _saleFee | uint256 | the percentage of the sale to be sent to the original owner as commission |
| _saleFeeAddress | address payable | the address to which the sale fee is sent |

### proxyInitialize

```solidity
function proxyInitialize(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _endPrice, uint256 _auctionDuration, bool _isNonLinear, uint256 _saleFee, address payable _saleFeeAddress) external
```

### __DutchAuction_init

```solidity
function __DutchAuction_init(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _endPrice, uint256 _auctionDuration, bool _isNonLinear, uint256 _saleFee, address payable _saleFeeAddress) internal
```

### __DutchAuction_init_unchained

```solidity
function __DutchAuction_init_unchained(address payable _seller, struct AuctionLib.Asset _asset, address ERC20contractAddress, uint256 _startPrice, uint256 _endPrice, uint256 _auctionDuration, bool _isNonLinear, uint256 _saleFee, address payable _saleFeeAddress) internal
```

### getCurrentPrice

```solidity
function getCurrentPrice() public view returns (uint256)
```

_Returns the current price of the asset_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 price of the asset |

### bid

```solidity
function bid() external
```

The required ERC20 tokens must be pre-approved before calling!

_Allows a user to bid at the current price_

### claim

```solidity
function claim() external
```

_Allows the owner to claim back the asset if nobody bids and auction expires_

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

Must be called by owner!

_Authorizes the contract upgrade. Called before upgrades are authorized._

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

