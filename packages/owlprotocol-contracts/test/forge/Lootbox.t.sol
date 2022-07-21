//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'forge-std/Test.sol';
import 'forge-std/console.sol';

import 'contracts/random/VRFBeacon.sol';
import 'contracts/proxy/ERC1167/ERC1167Factory.sol';
import 'contracts/plugins/Crafter/CrafterMint.sol';
import 'contracts/testing/FactoryERC721.sol';

import 'contracts/plugins/Routers/Lootbox.sol';

contract LootboxTest is Test {
    VRFBeacon beacon;
    ERC1167Factory cloneFac;
    CrafterMint c1;
    CrafterMint c2;
    CrafterMint c3;
    FactoryERC721 rewardNft;

    // VRF variables
    uint64 subId = 8101;
    address coordiantorAddr = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;
    bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;
    uint32 gasLimit = 50000;
    uint8 EPOCH_PERIOD = 10;

    // Test variables
    uint256 craftableAmount = 15;

    function setUp() external {
        // vm.createSelectFork('https://rinkeby.infura.io/v3/${INFURA_API_KEY}');
        string memory url = vm.rpcUrl('rinkeby');
        console.log(url);

        beacon = new VRFBeacon(subId, coordiantorAddr, keyHash, gasLimit, EPOCH_PERIOD);
        cloneFac = new ERC1167Factory();

        rewardNft = new FactoryERC721('name', 'symb');
    }

    function testOneLootbox() external {}
}
