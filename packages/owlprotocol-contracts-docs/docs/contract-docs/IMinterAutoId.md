

## IMinterAutoId

_Decentralized NFT Minter contract_

### mint

```solidity
function mint() external returns (uint256 nextTokenId)
```

_Create a new type of species and define attributes._

### safeMint

```solidity
function safeMint() external returns (uint256 nextTokenId)
```

_Create a new type of species and define attributes._

### setNextTokenId

```solidity
function setNextTokenId(uint256 nextTokenId_) external
```

_Used to set the starting nextTokenId value.
Used to save situtations where someone mints directly_

