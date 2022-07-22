## OwlBase

Base for all OWLPROTOCOL contracts

### ROUTER_ROLE

```solidity
bytes32 ROUTER_ROLE
```

### __OwlBase_init

```solidity
function __OwlBase_init(address _admin, address _forwarder) internal
```

### __OwlBase_init_unchained

```solidity
function __OwlBase_init_unchained(address _admin, address _forwarder) internal
```

### isTrustedForwarder

```solidity
function isTrustedForwarder(address forwarder) public view returns (bool)
```

**REQUIRED FOR GSN**

Return trusted forwarder status.

### grantRouter

```solidity
function grantRouter(address to) public
```

Must have owner role

Grants ROUTER_ROLE to {a}

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

UUPS functions

### getImplementation

```solidity
function getImplementation() external view returns (address)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address ret)
```

the following 3 functions are all required for OpenGSN integration

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

### versionRecipient

```solidity
function versionRecipient() external pure virtual returns (string)
```

