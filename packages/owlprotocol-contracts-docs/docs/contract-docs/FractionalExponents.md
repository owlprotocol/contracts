## FractionalExponents

### ONE

```solidity
uint256 ONE
```

### MAX_WEIGHT

```solidity
uint32 MAX_WEIGHT
```

### MIN_PRECISION

```solidity
uint8 MIN_PRECISION
```

### MAX_PRECISION

```solidity
uint8 MAX_PRECISION
```

### FIXED_1

```solidity
uint256 FIXED_1
```

### FIXED_2

```solidity
uint256 FIXED_2
```

### MAX_NUM

```solidity
uint256 MAX_NUM
```

### LN2_NUMERATOR

```solidity
uint256 LN2_NUMERATOR
```

### LN2_DENOMINATOR

```solidity
uint256 LN2_DENOMINATOR
```

### OPT_LOG_MAX_VAL

```solidity
uint256 OPT_LOG_MAX_VAL
```

### OPT_EXP_MAX_VAL

```solidity
uint256 OPT_EXP_MAX_VAL
```

### maxExpArray

```solidity
uint256[128] maxExpArray
```

### BancorFormula

```solidity
function BancorFormula() public
```

### power

```solidity
function power(uint256 _baseN, uint256 _baseD, uint32 _expN, uint32 _expD) public view returns (uint256, uint8)
```

General Description:
            Determine a value of precision.
            Calculate an integer approximation of (_baseN / _baseD) ^ (_expN / _expD) * 2 ^ precision.
            Return the result along with the precision used.
        Detailed Description:
            Instead of calculating "base ^ exp", we calculate "e ^ (log(base) * exp)".
            The value of "log(base)" is represented with an integer slightly smaller than "log(base) * 2 ^ precision".
            The larger "precision" is, the more accurately this value represents the real value.
            However, the larger "precision" is, the more bits are required in order to store this value.
            And the exponentiation function, which takes "x" and calculates "e ^ x", is limited to a maximum exponent (maximum value of "x").
            This maximum exponent depends on the "precision" used, and it is given by "maxExpArray[precision] >> (MAX_PRECISION - precision)".
            Hence we need to determine the highest precision which can be used for the given input, before calling the exponentiation function.
            This allows us to compute "base ^ exp" with maximum accuracy and without exceeding 256 bits in any of the intermediate computations.
            This functions assumes that "_expN < 2 ^ 256 / log(MAX_NUM - 1)", otherwise the multiplication should be replaced with a "safeMul".

### generalLog

```solidity
function generalLog(uint256 x) internal pure returns (uint256)
```

Compute log(x / FIXED_1) * FIXED_1.
        This functions assumes that "x >= FIXED_1", because the output would be negative otherwise.

### floorLog2

```solidity
function floorLog2(uint256 _n) internal pure returns (uint8)
```

Compute the largest integer smaller than or equal to the binary logarithm of the input.

### findPositionInMaxExpArray

```solidity
function findPositionInMaxExpArray(uint256 _x) internal view returns (uint8)
```

The global "maxExpArray" is sorted in descending order, and therefore the following statements are equivalent:
        - This function finds the position of [the smallest value in "maxExpArray" larger than or equal to "x"]
        - This function finds the highest position of [a value in "maxExpArray" larger than or equal to "x"]

### generalExp

```solidity
function generalExp(uint256 _x, uint8 _precision) internal pure returns (uint256)
```

This function can be auto-generated by the script 'PrintFunctionGeneralExp.py'.
        It approximates "e ^ x" via maclaurin summation: "(x^0)/0! + (x^1)/1! + ... + (x^n)/n!".
        It returns "e ^ (x / 2 ^ precision) * 2 ^ precision", that is, the result is upshifted for accuracy.
        The global "maxExpArray" maps each "precision" to "((maximumExponent + 1) << (MAX_PRECISION - precision)) - 1".
        The maximum permitted value for "x" is therefore given by "maxExpArray[precision] >> (MAX_PRECISION - precision)".

### optimalLog

```solidity
function optimalLog(uint256 x) internal pure returns (uint256)
```

Return log(x / FIXED_1) * FIXED_1
        Input range: FIXED_1 <= x <= LOG_EXP_MAX_VAL - 1

### optimalExp

```solidity
function optimalExp(uint256 x) internal pure returns (uint256)
```

Return e ^ (x / FIXED_1) * FIXED_1
        Input range: 0 <= x <= OPT_EXP_MAX_VAL - 1

