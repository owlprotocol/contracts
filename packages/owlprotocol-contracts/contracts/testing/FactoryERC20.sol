//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '../OwlBase.sol';

/**
 * @dev **INTERNAL TOOL**
 * Used to factory ERC20 coins for unit testing
 */
contract FactoryERC20 is OwlBase, ERC20 {
    /**
     * @dev Creates ERC20 token
     * @param mintAmount how much should be minted and given to `msg.sender`.
     * Pass `mintAmount=0` to create `1_000_000_000_000_000_000_000_000_000` coins.
     * @param coinName name used to identify coin
     * @param coinTicker ticker used to identify coin
     */
    constructor(
        uint256 mintAmount,
        string memory coinName,
        string memory coinTicker
    ) ERC20(coinName, coinTicker) {
        if (mintAmount == 0) mintAmount = 1_000_000_000_000_000_000_000_000_000;
        _mint(_msgSender(), mintAmount);
    }

    // Used for testing ONLY
    function setTrustedForwarder(address forwarder) public {
        grantRouter(forwarder);
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
    function _msgSender() internal view override(OwlBase, Context) returns (address sender) {
        sender = OwlBase._msgSender();
    }

    function _msgData() internal view override(OwlBase, Context) returns (bytes calldata) {
        return OwlBase._msgData();
    }

    function versionRecipient() external pure override returns (string memory) {
        return '2.2.6';
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
