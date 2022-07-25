//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'forge-std/Test.sol';
import 'forge-std/console.sol';

import 'contracts/random/VRFBeacon.sol';
import 'contracts/proxy/ERC1167/ERC1167Factory.sol';
import 'contracts/plugins/Crafter/CrafterMint.sol';
import 'contracts/testing/FactoryERC721.sol';
import 'contracts/testing/VRFCoordinatorV2.sol';
import 'contracts/plugins/Routers/Lootbox.sol';

contract LootboxTest is Test {
    VRFBeacon beacon;
    ERC1167Factory cloneFac;
    CrafterMint crafterMintImpl;
    CrafterMint c1;
    CrafterMint c2;
    CrafterMint c3;
    FactoryERC721 lootboxNFT;
    FactoryERC721 rewardNFT1;
    FactoryERC721 rewardNFT2;
    FactoryERC721 rewardNFT3;
    Lootbox lootboxInst;
    VRFCoordinatorV2 coordinator;

    address burn = vm.addr(2);
    address forwarder = vm.addr(3);
    bytes32 salt = bytes32('1');

    // VRF variables
    uint64 subId;
    address coordinatorAddr = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;
    bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;
    uint32 gasLimit = 50000;
    uint8 EPOCH_PERIOD = 10;

    // Test variables
    uint256 constant CRAFTABLE_AMOUNT = 15;
    uint256 constant AMOUNT_CRAFTERS = 3;

    function setUp() external {
        string memory url = vm.rpcUrl('rinkeby');
        vm.createSelectFork(url);

        coordinator = new VRFCoordinatorV2(address(0), address(0), address(0));
        vm.etch(coordinatorAddr, address(coordinator).code);

        subId = coordinator.createSubscription();
        coordinator.addConsumer(subId, address(beacon));

        beacon = new VRFBeacon(subId, coordinatorAddr, keyHash, gasLimit, EPOCH_PERIOD);
        cloneFac = new ERC1167Factory();

        rewardNFT1 = new FactoryERC721('name', 'symb');
        rewardNFT2 = new FactoryERC721('name', 'symb');
        rewardNFT3 = new FactoryERC721('name', 'symb');

        lootboxNFT = new FactoryERC721('name', 'symb');
        lootboxNFT.mint(address(this), 0);

        // Deploying crafter instances
        crafterMintImpl = new CrafterMint();
        uint256[] memory emptyArr = new uint256[](0);
        uint256[] memory crafterOutputIds = new uint256[](CRAFTABLE_AMOUNT);
        for (uint256 i = 0; i < CRAFTABLE_AMOUNT; i++) {
            crafterOutputIds[i] = i;
        }

        PluginsCore.Ingredient[] memory crafterInputs = new PluginsCore.Ingredient[](1);
        crafterInputs[0] = PluginsCore.Ingredient(
            PluginsCore.TokenType.erc721,
            PluginsCore.ConsumableType.burned,
            address(lootboxNFT),
            emptyArr,
            emptyArr
        );

        PluginsCore.Ingredient[] memory crafterOutputs1 = new PluginsCore.Ingredient[](1);
        crafterOutputs1[0] = PluginsCore.Ingredient(
            PluginsCore.TokenType.erc721,
            PluginsCore.ConsumableType.unaffected,
            address(rewardNFT1),
            emptyArr,
            crafterOutputIds
        );

        PluginsCore.Ingredient[] memory crafterOutputs2 = new PluginsCore.Ingredient[](1);
        crafterOutputs2[0] = PluginsCore.Ingredient(
            PluginsCore.TokenType.erc721,
            PluginsCore.ConsumableType.unaffected,
            address(rewardNFT2),
            emptyArr,
            crafterOutputIds
        );

        PluginsCore.Ingredient[] memory crafterOutputs3 = new PluginsCore.Ingredient[](1);
        crafterOutputs3[0] = PluginsCore.Ingredient(
            PluginsCore.TokenType.erc721,
            PluginsCore.ConsumableType.unaffected,
            address(rewardNFT3),
            emptyArr,
            crafterOutputIds
        );

        string
            memory crafterSigString = 'initialize(address,address,uint96,(uint8,uint8,address,uint256[],uint256[])[],(uint8,uint8,address,uint256[],uint256[])[],address)';

        bytes memory data1 = abi.encodeWithSignature(
            crafterSigString,
            address(this),
            burn,
            CRAFTABLE_AMOUNT,
            crafterInputs, // Must be fixed-length dynamic array
            crafterOutputs1, // Must be fixed-length dynamic array
            forwarder
        );

        bytes memory data2 = abi.encodeWithSignature(
            crafterSigString,
            address(this),
            burn,
            CRAFTABLE_AMOUNT,
            crafterInputs, // Must be fixed-length dynamic array
            crafterOutputs2, // Must be fixed-length dynamic array
            forwarder
        );

        bytes memory data3 = abi.encodeWithSignature(
            crafterSigString,
            address(this),
            burn,
            CRAFTABLE_AMOUNT,
            crafterInputs, // Must be fixed-length dynamic array
            crafterOutputs3, // Must be fixed-length dynamic array
            forwarder
        );

        // Deploying lootbox instances
        Lootbox lootboxImpl = new Lootbox();

        CrafterMint[] memory crafters = new CrafterMint[](AMOUNT_CRAFTERS);

        c1 = CrafterMint(cloneFac.cloneDeterministic(address(crafterMintImpl), salt, data1));
        c2 = CrafterMint(cloneFac.cloneDeterministic(address(crafterMintImpl), salt, data2));
        c3 = CrafterMint(cloneFac.cloneDeterministic(address(crafterMintImpl), salt, data3));

        crafters[0] = c1;
        crafters[1] = c2;
        crafters[2] = c3;

        uint256[] memory probs = new uint256[](AMOUNT_CRAFTERS);
        probs[0] = 10;
        probs[1] = 20;
        probs[2] = 100;

        string memory lootboxSigString = 'initialize(address,address[],uint8[],address,address)';
        bytes memory dataLootbox = abi.encodeWithSignature(
            lootboxSigString,
            address(this),
            crafters, // Must be fixed-length dynamic array
            probs, // Must be fixed-length dynamic array
            beacon,
            forwarder
        );

        lootboxInst = Lootbox(cloneFac.cloneDeterministic(address(lootboxImpl), salt, dataLootbox));

        c1.grantRouter(address(lootboxInst));
        c2.grantRouter(address(lootboxInst));
        c3.grantRouter(address(lootboxInst));
    }

    function testOneLootbox() external {
        console.log('setUp() finished');
    }
}
