

## Rent

### version

```solidity
string version
```

### ERC165TAG

```solidity
bytes4 ERC165TAG
```

### Create

```solidity
event Create(uint256 rentId, address owner, address renter, uint256 nftId, uint256 timePeriods, uint256 pricePerPeriod, uint256 expireTimePerPeriod)
```

### Pay

```solidity
event Pay(uint256 rentId, uint256 amountPaid)
```

### End

```solidity
event End(uint256 rentId, uint256 amountPaid)
```

### Claim

```solidity
event Claim(address owner, uint256 amountClaimed)
```

### RentalTerms

```solidity
struct RentalTerms {
  uint256 nftId;
  address owner;
  address renter;
  bool ended;
  uint256 timePeriods;
  uint256 pricePerPeriod;
  uint256 expireTimePerPeriod;
}
```

### acceptableToken

```solidity
address acceptableToken
```

### shadowAddr

```solidity
address shadowAddr
```

### contractAddr

```solidity
address contractAddr
```

### numRentals

```solidity
uint256 numRentals
```

### rentTermsId

```solidity
mapping(uint256 &#x3D;&gt; struct Rent.RentalTerms) rentTermsId
```

### timePeriodsPaid

```solidity
mapping(uint256 &#x3D;&gt; uint256) timePeriodsPaid
```

### balances

```solidity
mapping(address &#x3D;&gt; uint256) balances
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _admin, address _acceptableToken, address _contractAddr, address _shadowAddr) external
```

_Create Renting instance_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _admin | address | launcher (us) |
| _acceptableToken | address | accepted ERC20 token for payment |
| _contractAddr | address | contract address for NFT |
| _shadowAddr | address | address where shadow NFT is minted |

### proxyInitialize

```solidity
function proxyInitialize(address _admin, address _acceptableToken, address _contractAddr, address _shadowAddr) external
```

### __Rent_init

```solidity
function __Rent_init(address _admin, address _acceptableToken, address _contractAddr, address _shadowAddr) internal
```

### __Rent_init_unchained

```solidity
function __Rent_init_unchained(address _admin, address _acceptableToken, address _contractAddr, address _shadowAddr) internal
```

### createRental

```solidity
function createRental(struct Rent.RentalTerms rentalTerm) external
```

### startRent

```solidity
function startRent(uint256 rentId) external payable
```

### payRent

```solidity
function payRent(uint256 rentId, uint256 timePeriodsToPay) public payable
```

### endRental

```solidity
function endRental(uint256 rentalId) external payable
```

### ownerClaim

```solidity
function ownerClaim() external payable
```

### getRental

```solidity
function getRental(uint256 rentId) external view returns (struct Rent.RentalTerms)
```

Getters

### getNumRentals

```solidity
function getNumRentals() external view returns (uint256)
```

### getTimePeriodsPaid

```solidity
function getTimePeriodsPaid(uint256 rentalId) external view returns (uint256)
```

### getTimePeriodsLeftToPay

```solidity
function getTimePeriodsLeftToPay(uint256 rentalId) external view returns (uint256)
```

### getBalance

```solidity
function getBalance(address owner) external view returns (uint256)
```

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

Upgradeable functions

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

