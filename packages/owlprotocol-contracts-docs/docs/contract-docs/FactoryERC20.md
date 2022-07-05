

## FactoryERC20

_**INTERNAL TOOL**
Used to factory ERC20 coins for unit testing_

### constructor

```solidity
constructor(uint256 mintAmount, string coinName, string coinTicker) public
```

_Creates ERC20 token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| mintAmount | uint256 | how much should be minted and given to &#x60;msg.sender&#x60;. Pass &#x60;mintAmount&#x3D;0&#x60; to create &#x60;1_000_000_000_000_000_000_000_000_000&#x60; coins. |
| coinName | string | name used to identify coin |
| coinTicker | string | ticker used to identify coin |

### mint

```solidity
function mint(address to, uint256 amount) external
```

