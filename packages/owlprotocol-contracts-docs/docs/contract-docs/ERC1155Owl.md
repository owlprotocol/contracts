

## ERC1155Owl

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### URI_ROLE

```solidity
bytes32 URI_ROLE
```

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _admin, string uri_) external
```

### proxyInitialize

```solidity
function proxyInitialize(address _admin, string uri_) external
```

### __ERC1155Owl_init

```solidity
function __ERC1155Owl_init(address _admin, string uri_) internal
```

### __ERC1155Owl_init_unchained

```solidity
function __ERC1155Owl_init_unchained(address _admin) internal
```

### grantMinter

```solidity
function grantMinter(address to) public
```

Must have DEFAULT_ADMIN_ROLE

_Grants MINTER_ROLE to {a}_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |

### grantUriRole

```solidity
function grantUriRole(address to) public
```

Must have DEFAULT_ADMIN_ROLE

_Grants URI_ROLE to {a}_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |

### mint

```solidity
function mint(address to, uint256 id, uint256 amount, bytes data) public
```

Must have MINTER_ROLE

_Allows MINTER_ROLE to mint NFTs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |
| id | uint256 | tokenId value |
| amount | uint256 | to mint |
| data | bytes | for hooks |

### mintBatch

```solidity
function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) public
```

Must have MINTER_ROLE

_Allows caller to mint NFTs (safeMint)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |
| ids | uint256[] | id values |
| amounts | uint256[] | to mint |
| data | bytes | for hooks |

### setURI

```solidity
function setURI(string newuri) public
```

Must have URI_ROLE role!

_Allows setting the uri_

| Name | Type | Description |
| ---- | ---- | ----------- |
| newuri | string | set the baseURI value. |

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

