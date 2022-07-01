

## Bundle

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### Lock

```solidity
event Lock(struct BundleLib.Asset[] assetsLocked)
```

### Unlock

```solidity
event Unlock()
```

### lootBoxMinterAddress

```solidity
address lootBoxMinterAddress
```

### client

```solidity
address payable client
```

### admin

```solidity
address admin
```

### nextLootBoxId

```solidity
uint256 nextLootBoxId
```

### lootBoxStorage

```solidity
mapping(uint256 &#x3D;&gt; struct BundleLib.Asset[]) lootBoxStorage
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _admin, address payable _client, address _lootBoxMinterAddress) external
```

_Create auction instance_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _admin | address | the admin/owner of the contract |
| _client | address payable | the caller of the lock and unlock functions |
| _lootBoxMinterAddress | address |  |

### proxyInitialize

```solidity
function proxyInitialize(address _admin, address payable _client, address _lootBoxMinterAddress) external
```

### __Bundle_init

```solidity
function __Bundle_init(address _admin, address payable _client, address _lootBoxMinterAddress) internal
```

### __Bundle_init_unchained

```solidity
function __Bundle_init_unchained(address _admin, address payable _client, address _lootBoxMinterAddress) internal
```

### lock

```solidity
function lock(struct BundleLib.Asset[] assetsToLock) external payable
```

### unlock

```solidity
function unlock(uint256 lootBoxId) external
```

### setLootboxAddress

```solidity
function setLootboxAddress(address _lootBoxMinterAddress) external
```

### getLootboxStorage

```solidity
function getLootboxStorage(uint256 tokenId) external view returns (struct BundleLib.Asset[] _storage)
```

Getters

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

Upgradeable functions

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

