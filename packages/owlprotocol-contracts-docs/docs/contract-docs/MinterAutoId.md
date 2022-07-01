

## MinterAutoId

_Decentralized NFT Minter contract_

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### nextTokenId

```solidity
uint256 nextTokenId
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr) external
```

### proxyInitialize

```solidity
function proxyInitialize(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr) external
```

### __MinterAutoId_init

```solidity
function __MinterAutoId_init(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr) internal
```

### __MinterAutoId_init_unchained

```solidity
function __MinterAutoId_init_unchained(address _admin) internal
```

### mint

```solidity
function mint(address buyer) public returns (uint256)
```

_Create a new type of species and define attributes._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | nextTokenId |

### safeMint

```solidity
function safeMint(address buyer) public returns (uint256)
```

_Create a new type of species and define attributes._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | nextTokenId |

### setNextTokenId

```solidity
function setNextTokenId(uint256 nextTokenId_) public
```

_Used to set the starting nextTokenId value.
Used to save situtations where someone mints directly
and we get out of sync._

| Name | Type | Description |
| ---- | ---- | ----------- |
| nextTokenId_ | uint256 | next token id to be minted |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

### getImplementation

```solidity
function getImplementation() external view returns (address)
```

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

