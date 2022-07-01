

## MinterRandom

_Decentralized NFT Minter contract_

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### _numMinted

```solidity
uint256 _numMinted
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

### __MinterRandom_init

```solidity
function __MinterRandom_init(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr) internal
```

### __MinterRandom_init_unchained

```solidity
function __MinterRandom_init_unchained(address _admin) internal
```

### mint

```solidity
function mint(address buyer) public
```

_Create a new type of species and define attributes._

### safeMint

```solidity
function safeMint(address buyer) public
```

_Create a new type of species and define attributes._

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

