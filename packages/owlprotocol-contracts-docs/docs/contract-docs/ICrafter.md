

## ICrafter

_Pluggable Crafting Contract.
Each contract is it&#x27;s own recipe definition.
Players can interact with the contract to have
recipie outputs either minted or transferred 
from a deposit._

### initialize

```solidity
function initialize(address _admin, address _burnAddress, uint96 _craftableAmount, struct CraftLib.Ingredient[] _inputs, struct CraftLib.Ingredient[] _outputs) external
```

Create recipe

_Configures crafting recipe with inputs/outputs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _admin | address | Admin address to intialize ownership |
| _burnAddress | address | Burn address for burn inputs |
| _craftableAmount | uint96 |  |
| _inputs | struct CraftLib.Ingredient[] | inputs for recipe |
| _outputs | struct CraftLib.Ingredient[] | outputs for recipe |

### deposit

```solidity
function deposit(uint96 depositAmount, uint256[][] _outputsERC721Ids) external
```

Must be recipe creator

_Used to deposit recipe outputs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositAmount | uint96 | How many times the recipe should be craftable |
| _outputsERC721Ids | uint256[][] | 2D-array of ERC721 tokens used in crafting |

### withdraw

```solidity
function withdraw(uint96 withdrawAmount) external
```

Must be recipe creator

_Used to withdraw recipe outputs. Reverse logic as deposit()._

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawAmount | uint96 | How many times the craft outputs should be withdrawn |

### craft

```solidity
function craft(uint96 craftAmount, uint256[][] _inputERC721Ids) external
```

Craft {craftAmount}

_Used to craft. Consumes inputs and transfers outputs._

| Name | Type | Description |
| ---- | ---- | ----------- |
| craftAmount | uint96 | How many times to craft |
| _inputERC721Ids | uint256[][] | Array of pre-approved NFTs for crafting usage. |

