

## MinterCore

_Decentralized NFT Minter contract_

### mintFeeToken

```solidity
address mintFeeToken
```

### mintFeeAddress

```solidity
address mintFeeAddress
```

### mintFeeAmount

```solidity
uint256 mintFeeAmount
```

### nftContractAddr

```solidity
address nftContractAddr
```

### mintAllowedMerkle

```solidity
modifier mintAllowedMerkle(uint256 speciesId, bytes32 merkleRoot, bytes32[] merkleProof)
```

### __MinterCore_init

```solidity
function __MinterCore_init(address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr) internal
```

### __MinterCore_init_unchained

```solidity
function __MinterCore_init_unchained(address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr) internal
```

### _mintForFee

```solidity
function _mintForFee(address buyer, uint256 tokenId) internal
```

_Base minting function (not safeMint). Called
by implementation contracts._

| Name | Type | Description |
| ---- | ---- | ----------- |
| buyer | address | who&#x27;s paying the ERC20 fee / gets the ERC721 token |
| tokenId | uint256 | the token identifier to mint |

### _safeMintForFee

```solidity
function _safeMintForFee(address buyer, uint256 tokenId) internal
```

_Base minting function (safeMint). Called
by implementation contracts._

| Name | Type | Description |
| ---- | ---- | ----------- |
| buyer | address | who&#x27;s paying the ERC20 fee / gets the ERC721 token |
| tokenId | uint256 | the token identifier to mint |

