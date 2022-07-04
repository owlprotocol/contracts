

## ERC721OwlAttributes

### DNA_ROLE

```solidity
bytes32 DNA_ROLE
```

### dnas

```solidity
mapping(uint256 &#x3D;&gt; uint256) dnas
```

### nextId

```solidity
uint256 nextId
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
function initialize(address _admin, string _name, string _symbol, string baseURI_) external virtual
```

### proxyInitialize

```solidity
function proxyInitialize(address _admin, string _name, string _symbol, string baseURI_) external virtual
```

### __ERC721OwlAttributes_init

```solidity
function __ERC721OwlAttributes_init(address _admin, string _name, string _symbol, string baseURI_) internal
```

### __ERC721OwlAttributes_init_unchained

```solidity
function __ERC721OwlAttributes_init_unchained() internal
```

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string uri)
```

_returns uri for token metadata_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | tokenId metadata to fetch |

| Name | Type | Description |
| ---- | ---- | ----------- |
| uri | string | at which metadata is housed |

### mint

```solidity
function mint(address to, uint256 dna) public virtual
```

Must have MINTER_ROLE

_Allows MINTER_ROLE to mint NFTs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |
| dna | uint256 | of next tokenId |

### safeMint

```solidity
function safeMint(address to, uint256 dna) public virtual
```

Must have MINTER_ROLE

_Allows caller to mint NFTs (safeMint)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |
| dna | uint256 | of next tokenId |

### udpateDna

```solidity
function udpateDna(uint256 tokenId, uint256 dna) external
```

Must have DNA_ROLE

_Allows changing the dna of a tokenId_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | whose dna to change |
| dna | uint256 | new dna for the provided tokenId |

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

