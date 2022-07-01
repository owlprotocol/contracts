

## CraftLib

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
  enum CraftLib.TokenType token;
  enum CraftLib.ConsumableType consumableType;
  address contractAddr;
  uint256[] amounts;
  uint256[] tokenIds;
}
```

