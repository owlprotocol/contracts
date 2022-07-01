

## AuctionLib

_Basic auction structures used through auction contracts._

### TokenType

```solidity
enum TokenType {
  erc721,
  erc1155
}
```

### Asset

```solidity
struct Asset {
  enum AuctionLib.TokenType token;
  address contractAddr;
  uint256 tokenId;
}
```

