

## CrafterTransfer

_Pluggable Crafting Contract._

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### CreateRecipe

```solidity
event CreateRecipe(address creator, struct CraftLib.Ingredient[] inputs, struct CraftLib.Ingredient[] outputs)
```

### RecipeUpdate

```solidity
event RecipeUpdate(uint256 craftableAmount)
```

### RecipeCraft

```solidity
event RecipeCraft(uint256 craftedAmount, uint256 craftableAmount, address user)
```

### burnAddress

```solidity
address burnAddress
```

### craftableAmount

```solidity
uint96 craftableAmount
```

### inputs

```solidity
struct CraftLib.Ingredient[] inputs
```

### outputs

```solidity
struct CraftLib.Ingredient[] outputs
```

### nUse

```solidity
mapping(uint256 &#x3D;&gt; uint256) nUse
```

### usedERC721Inputs

```solidity
mapping(address &#x3D;&gt; mapping(uint256 &#x3D;&gt; uint256)) usedERC721Inputs
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _admin, address _burnAddress, uint96 _craftableAmount, struct CraftLib.Ingredient[] _inputs, struct CraftLib.Ingredient[] _outputs) external
```

Create recipe

_Configures crafting recipe with inputs/outputs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _admin | address |  |
| _burnAddress | address | Burn address for burn inputs |
| _craftableAmount | uint96 |  |
| _inputs | struct CraftLib.Ingredient[] | inputs for recipe |
| _outputs | struct CraftLib.Ingredient[] | outputs for recipe |

### proxyInitialize

```solidity
function proxyInitialize(address _admin, address _burnAddress, uint96 _craftableAmount, struct CraftLib.Ingredient[] _inputs, struct CraftLib.Ingredient[] _outputs) external
```

### __CrafterTransfer_init

```solidity
function __CrafterTransfer_init(address _admin, address _burnAddress, uint96 _craftableAmount, struct CraftLib.Ingredient[] _inputs, struct CraftLib.Ingredient[] _outputs) internal
```

### __CrafterTransfer_init_unchained

```solidity
function __CrafterTransfer_init_unchained(address _admin, address _burnAddress, uint96 _craftableAmount, struct CraftLib.Ingredient[] _inputs, struct CraftLib.Ingredient[] _outputs) internal
```

### getInputs

```solidity
function getInputs() public view returns (struct CraftLib.Ingredient[] _inputs)
```

_Returns all inputs (without &#x60;amounts&#x60; or &#x60;tokenIds&#x60;)_

### getOutputs

```solidity
function getOutputs() public view returns (struct CraftLib.Ingredient[] _outputs)
```

_Returns all outputs (without &#x60;amounts&#x60; or &#x60;tokenIds&#x60;)_

### getInputIngredient

```solidity
function getInputIngredient(uint256 index) public view returns (enum CraftLib.TokenType token, enum CraftLib.ConsumableType consumableType, address contractAddr, uint256[] amounts, uint256[] tokenIds)
```

_Returns all details for a specific ingredient (including amounts/tokenIds)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | ingredient index to return details for |

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | enum CraftLib.TokenType | token type |
| consumableType | enum CraftLib.ConsumableType | consumable type |
| contractAddr | address | token contract address |
| amounts | uint256[] | amount of each token |
| tokenIds | uint256[] | token ids |

### getOutputIngredient

```solidity
function getOutputIngredient(uint256 index) public view returns (enum CraftLib.TokenType token, enum CraftLib.ConsumableType consumableType, address contractAddr, uint256[] amounts, uint256[] tokenIds)
```

_Returns all details for a specific ingredient (including amounts/tokenIds)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | ingredient index to return details for |

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | enum CraftLib.TokenType | token type |
| consumableType | enum CraftLib.ConsumableType | consumable type |
| contractAddr | address | token contract address |
| amounts | uint256[] | amount of each token |
| tokenIds | uint256[] | token ids |

### deposit

```solidity
function deposit(uint96 depositAmount, uint256[][] _outputsERC721Ids) public
```

Must be recipe creator. Automatically sends from &#x60;msg.sender&#x60;

_Used to deposit recipe outputs._

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositAmount | uint96 | How many times the recipe should be craftable |
| _outputsERC721Ids | uint256[][] | 2D-array of ERC721 tokens used in crafting |

### _deposit

```solidity
function _deposit(uint96 depositAmount, uint256[][] _outputsERC721Ids, address from) internal
```

Must be recipe creator

_Used to deposit recipe outputs_

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositAmount | uint96 | How many times the recipe should be craftable |
| _outputsERC721Ids | uint256[][] | 2D-array of ERC721 tokens used in crafting |
| from | address | address to transfer tokens from |

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
function craft(uint96 craftAmount, uint256[][] _inputERC721Ids) public
```

Craft {craftAmount}

_Used to craft. Consumes inputs and transfers outputs._

| Name | Type | Description |
| ---- | ---- | ----------- |
| craftAmount | uint96 | How many times to craft |
| _inputERC721Ids | uint256[][] | Array of pre-approved NFTs for crafting usage. |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

### getImplementation

```solidity
function getImplementation() external view returns (address)
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_ERC165 Support_

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaceId | bytes4 | hash of the interface testing for |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool whether interface is supported |

