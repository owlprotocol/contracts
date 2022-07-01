

## SourceRandom

_Sources different levels of randomness_

### getRandomDebug

```solidity
function getRandomDebug() internal view returns (uint256)
```

Not truly random. Use for debugging only

_Returns a random uint256 sourced from the current time_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 random value |

### getSeededRandom

```solidity
function getSeededRandom(uint256 seed, uint256 nonce) internal pure returns (uint256)
```

_Returns a random uint256 sourced from a seed_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 random value |

