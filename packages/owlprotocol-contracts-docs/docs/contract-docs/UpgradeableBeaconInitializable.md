

## UpgradeableBeaconInitializable

_This contract is used in conjunction with one or more instances of {BeaconProxy} to determine their
implementation contract, which is where they will delegate all function calls.

An owner is able to change the implementation the beacon points to, thus upgrading the proxies that use this beacon._

### _implementation

```solidity
address _implementation
```

### Upgraded

```solidity
event Upgraded(address implementation)
```

_Emitted when the implementation returned by the beacon is changed._

### constructor

```solidity
constructor() public
```

_Sets the address of the initial implementation, and the deployer account as the owner who can upgrade the
beacon._

### initialize

```solidity
function initialize(address _admin, address implementation_) public
```

### implementation

```solidity
function implementation() public view virtual returns (address)
```

_Returns the current implementation address._

### upgradeTo

```solidity
function upgradeTo(address newImplementation) public virtual
```

_Upgrades the beacon to a new implementation.

Emits an {Upgraded} event.

Requirements:

- msg.sender must be the owner of the contract.
- &#x60;newImplementation&#x60; must be a contract._

### _setImplementation

```solidity
function _setImplementation(address newImplementation) private
```

_Sets the implementation contract address for this beacon

Requirements:

- &#x60;newImplementation&#x60; must be a contract._
