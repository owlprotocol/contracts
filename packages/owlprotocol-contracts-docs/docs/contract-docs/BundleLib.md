

## BundleLib

_Basic auction structures used through auction contracts._

### TokenType

```solidity
enum TokenType {
  erc20,
  erc721,
  erc1155
}
```

### Asset

```solidity
struct Asset {
  enum BundleLib.TokenType token;
  address contractAddr;
  uint256 tokenId;
  uint256 amount;
}
```

