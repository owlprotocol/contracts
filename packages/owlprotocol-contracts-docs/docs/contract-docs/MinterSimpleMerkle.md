

## MinterSimpleMerkle

_Decentralized NFT Minter contract_

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

### __MinterSimpleMerkle_init

```solidity
function __MinterSimpleMerkle_init(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr) internal
```

### __MinterSimpleMerkle_init_unchained

```solidity
function __MinterSimpleMerkle_init_unchained(address _admin) internal
```

### mint

```solidity
function mint(uint256 tokenId, bytes32 merkleRoot, bytes32[] merkleProof) public
```

_Create a new type of species and define attributes._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | minted token id |
| merkleRoot | bytes32 |  |
| merkleProof | bytes32[] |  |

### safeMint

```solidity
function safeMint(uint256 tokenId, bytes32 merkleRoot, bytes32[] merkleProof) public
```

_Create a new type of species and define attributes._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | minted token id |
| merkleRoot | bytes32 |  |
| merkleProof | bytes32[] |  |

### hashKeccakUser

```solidity
function hashKeccakUser() public view returns (bytes32)
```

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

### getImplementation

```solidity
function getImplementation() external view returns (address)
```

