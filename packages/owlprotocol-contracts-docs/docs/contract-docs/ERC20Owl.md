

## ERC20Owl

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

### baseURI

```solidity
string baseURI
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _admin, string _name, string _symbol) external
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

### mint

```solidity
function mint(address to, uint256 amount) public
```

Must have MINTER_ROLE

_Allows MINTER_ROLE to mint NFTs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |
| amount | uint256 | amount to mint |

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

