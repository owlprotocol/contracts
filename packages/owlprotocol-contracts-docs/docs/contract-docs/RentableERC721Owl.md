

## RentableERC721Owl

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### URI_ROLE

```solidity
bytes32 URI_ROLE
```

### RENTER_ROLE

```solidity
bytes32 RENTER_ROLE
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
function initialize(address _admin, string _name, string _symbol, string baseURI_) external
```

### proxyInitialize

```solidity
function proxyInitialize(address _admin, string _name, string _symbol, string baseURI_) external
```

### __RentableERC721Owl_init

```solidity
function __RentableERC721Owl_init(address _admin, string _name, string _symbol, string baseURI_) internal
```

### __RentableERC721Owl_init_unchained

```solidity
function __RentableERC721Owl_init_unchained(address _admin, string baseURI_) internal
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

### grantRenter

```solidity
function grantRenter(address to) public
```

Must have DEFAULT_ADMIN_ROLE

_Grants RENTER_ROLE to {a}_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |

### mint

```solidity
function mint(address to, uint256 tokenId, uint256 expireTime) public
```

Must have MINTER_ROLE

_Allows MINTER_ROLE to mint NFTs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |
| tokenId | uint256 | tokenId value |
| expireTime | uint256 |  |

### safeMint

```solidity
function safeMint(address to, uint256 tokenId) public
```

Must have MINTER_ROLE

_Allows caller to mint NFTs (safeMint)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |
| tokenId | uint256 | tokenId value |

### setBaseURI

```solidity
function setBaseURI(string baseURI_) public
```

Must have URI_ROLE role!

_Allows setting the baseURI_

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseURI_ | string | set the baseURI value. |

### _baseURI

```solidity
function _baseURI() internal view returns (string)
```

_Overrides OZ internal baseURI getter._

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

### burn

```solidity
function burn(uint256 tokenId) public virtual
```

### extendRental

```solidity
function extendRental(uint256 tokenId, uint256 extendAmount) external
```

### ownerOf

```solidity
function ownerOf(uint256 tokenId) public view virtual returns (address)
```

_See {IERC721-ownerOf}._

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

