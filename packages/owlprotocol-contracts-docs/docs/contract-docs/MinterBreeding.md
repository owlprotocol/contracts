

## MinterBreeding

_Decentralized NFT Minter contract_

### defaultGenesNum

```solidity
uint8 defaultGenesNum
```

### defaultRequiredParents

```solidity
uint8 defaultRequiredParents
```

### defaultBreedingCooldownSeconds

```solidity
uint256 defaultBreedingCooldownSeconds
```

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### BreedingRules

```solidity
struct BreedingRules {
  uint8 requiredParents;
  uint16 generationCooldownMultiplier;
  uint8[] genes;
  uint256 breedCooldownSeconds;
  uint256[] mutationRates;
}
```

### lastBredTime

```solidity
mapping(uint256 &#x3D;&gt; uint256) lastBredTime
```

### _breedingRules

```solidity
struct MinterBreeding.BreedingRules _breedingRules
```

### SetBreedingRules

```solidity
event SetBreedingRules(uint8 requiredParents, uint256 breedCooldownSeconds, uint8[] genes, uint256[] mutationRates)
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr, struct MinterBreeding.BreedingRules breedingRules_) external
```

### proxyIntiialize

```solidity
function proxyIntiialize(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr, struct MinterBreeding.BreedingRules breedingRules_) external
```

### __MinterBreeding_init

```solidity
function __MinterBreeding_init(address _admin, address _mintFeeToken, address _mintFeeAddress, uint256 _mintFeeAmount, address _nftContractAddr, struct MinterBreeding.BreedingRules breedingRules_) internal
```

### __MinterBreeding_init_unchained

```solidity
function __MinterBreeding_init_unchained(address _admin, struct MinterBreeding.BreedingRules breedingRules_) internal
```

### breed

```solidity
function breed(uint256[] parents) public returns (uint256 tokenId)
```

_Create a new type of species and define attributes._

### safeBreed

```solidity
function safeBreed(uint256[] parents) public returns (uint256 tokenId)
```

_Create a new type of species and define attributes._

### setBreedingRules

```solidity
function setBreedingRules(uint8 requiredParents, uint16 generationCooldownMultiplier, uint256 breedCooldownSeconds, uint8[] genes, uint256[] mutationRates) public
```

_Create a new type of species and define attributes._

### getBreedingRules

```solidity
function getBreedingRules() public view returns (uint8 requiredParents, uint256 breedCooldownSeconds, uint8[] genes, uint256[] mutationRates)
```

_Returns the current breeding rules used for a species_

### _breedSpecies

```solidity
function _breedSpecies(uint256[] parents, address caller) internal returns (uint256 tokenId)
```

_Internal function to do the heavy lifting for breeding_

| Name | Type | Description |
| ---- | ---- | ----------- |
| parents | uint256[] | parents to use for breeding |
| caller | address | owner of parent NFTs (this will be verified) |

### _getBreedingRules

```solidity
function _getBreedingRules() internal view returns (uint8 requiredParents, uint256 breedCooldownSeconds, uint8[] genes, uint256[] mutationRates)
```

_Internal function to do the heavy lifting for breeding_

| Name | Type | Description |
| ---- | ---- | ----------- |
| requiredParents | uint8 | number of parents required (defaults to 2) |
| breedCooldownSeconds | uint256 | number of seconds to cooldown (defaults to 7 days) |
| genes | uint8[] | 256-bit gene split locations (defaults to 8 32-bit genes) |
| mutationRates | uint256[] | mutation rate locations (defaults to none) |

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

