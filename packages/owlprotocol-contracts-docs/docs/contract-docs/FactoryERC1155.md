

## FactoryERC1155

_**INTERNAL TOOL**
Used to factory ERC721 NFTs for unit testing_

### lastTokenId

```solidity
uint256 lastTokenId
```

### defaultTokenMint

```solidity
uint256 defaultTokenMint
```

### constructor

```solidity
constructor(string uri, uint256[] initialMint) public
```

_Creates ERC721 token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| uri | string | associate |
| initialMint | uint256[] |  |

### mintTokens

```solidity
function mintTokens(uint256[] amounts) public
```

_Creates and gives a token to whoever calls the method_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amounts | uint256[] | array of token amounts to mint for each tokenID |

### mint

```solidity
function mint(address to, uint256 tokenId, uint256 amount) public
```

_Mints a token and assigns it to &#x60;to&#x60;.
doesn&#x27;t require permissions._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | add |
| tokenId | uint256 | token |
| amount | uint256 |  |

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

