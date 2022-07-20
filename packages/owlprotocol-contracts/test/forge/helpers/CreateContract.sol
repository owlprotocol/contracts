//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../../../contracts/plugins/PluginsCore.sol';

import '../../../contracts/plugins/Crafter/CrafterMint.sol';

abstract contract CreateContract {
    function createCrafterMint(
        address _admin,
        address _burnAddress,
        uint96 _craftableAmount,
        PluginsCore.Ingredient[] calldata _inputs,
        PluginsCore.Ingredient[] calldata _outputs,
        address _forwarder
    ) internal returns (CrafterMint) {}
}
