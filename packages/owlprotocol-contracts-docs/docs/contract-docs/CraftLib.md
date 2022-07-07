## PluginsLib

_Basic crafting structures used through NFTCrafting contracts._

### ConsumableType

```solidity
enum ConsumableType {
  unaffected,
  burned,
  locked,
  NTime
}
```

### TokenType

```solidity
enum TokenType {
  erc20,
  erc721,
  erc1155
}
```

### Ingredient

```solidity
struct Ingredient {
  enum PluginsLib.TokenType token;
  enum PluginsLib.ConsumableType consumableType;
  address contractAddr;
  uint256[] amounts;
  uint256[] tokenIds;
}
```
