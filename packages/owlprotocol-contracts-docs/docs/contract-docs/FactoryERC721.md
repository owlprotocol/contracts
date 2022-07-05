

## FactoryERC721

_**INTERNAL TOOL**
Used to factory ERC721 NFTs for unit testing_

### lastTokenId

```solidity
uint256 lastTokenId
```

### constructor

```solidity
constructor(string nftName, string nftSymbol) public
```

_Creates ERC721 token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftName | string | name used to identify nft |
| nftSymbol | string | ticker used to identify nft |

### mintTokens

```solidity
function mintTokens(uint256 count) public
```

_Creates and gives a token to whoever calls the method_

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | number of tokens to generate and give |

### mint

```solidity
function mint(address to, uint256 tokenId) public
```

_Mints a token and assigns it to &#x60;to&#x60;.
doesn&#x27;t require permissions._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | add |
| tokenId | uint256 | token |

### safeMint

```solidity
function safeMint(address to, uint256 tokenId) public
```

_Mints a token and assigns it to &#x60;to&#x60;.
doesn&#x27;t require permissions._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | add |
| tokenId | uint256 | token |

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

