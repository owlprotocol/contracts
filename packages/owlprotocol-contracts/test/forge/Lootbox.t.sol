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
    CrafterMint c1;
    CrafterMint c2;
    CrafterMint c3;
    FactoryERC721 lootboxNFT;
    FactoryERC721 rewardNFT1;
    FactoryERC721 rewardNFT2;
    FactoryERC721 rewardNFT3;
    Lootbox lootboxInst;
    VRFCoordinatorV2 coordinator;

    address signer = address(1);
    address burn = address(2);
    address forwarder = address(3);

    // VRF variables
    uint64 subId = 8101;
    address coordinatorAddr = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;
    bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;
    uint32 gasLimit = 50000;
    uint8 EPOCH_PERIOD = 10;

    // Test variables
    uint256 craftableAmount = 15;

    function setUp() external {
        // vm.createSelectFork('https://rinkeby.infura.io/v3/${INFURA_API_KEY}');
        string memory url = vm.rpcUrl('rinkeby');
        console.log(url);

        beacon = new VRFBeacon(subId, coordinatorAddr, keyHash, gasLimit, EPOCH_PERIOD);
        cloneFac = new ERC1167Factory();

        rewardNFT1 = new FactoryERC721('name', 'symb');
        rewardNFT2 = new FactoryERC721('name', 'symb');
        rewardNFT3 = new FactoryERC721('name', 'symb');

        lootboxNFT = new FactoryERC721('name', 'symb');
        lootboxNFT.mint(signer, 0);

        // Deploying crafter instances
        CrafterMint crafterMintImpl = new CrafterMint();
        uint256[] memory temp = new uint256[](0);

        PluginsCore.Ingredient[1] memory crafterInputs = [
            PluginsCore.Ingredient(
                PluginsCore.TokenType.erc721,
                PluginsCore.ConsumableType.burned,
                address(lootboxNFT),
                temp,
                temp
            )
        ];
        PluginsCore.Ingredient[1] memory crafterOutputs1 = [
            PluginsCore.Ingredient(
                PluginsCore.TokenType.erc721,
                PluginsCore.ConsumableType.unaffected,
                address(rewardNFT1),
                temp,
                temp
            )
        ];
        PluginsCore.Ingredient[1] memory crafterOutputs2 = [
            PluginsCore.Ingredient(
                PluginsCore.TokenType.erc721,
                PluginsCore.ConsumableType.unaffected,
                address(rewardNFT2),
                temp,
                temp
            )
        ];
        PluginsCore.Ingredient[1] memory crafterOutputs3 = [
            PluginsCore.Ingredient(
                PluginsCore.TokenType.erc721,
                PluginsCore.ConsumableType.unaffected,
                address(rewardNFT3),
                temp,
                temp
            )
        ];

        string
            memory crafterSigString = 'initialize(address,address,uint96,(uint8,uint8,address,uint256[],uint256[])[],(uint8,uint8,address,uint256[],uint256[])[],address)';

        bytes memory data1 = abi.encodeWithSignature(
            crafterSigString,
            signer,
            burn,
            craftableAmount,
            crafterInputs,
            crafterOutputs1,
            forwarder
        );
        bytes memory data2 = abi.encodeWithSignature(
            crafterSigString,
            signer,
            burn,
            craftableAmount,
            crafterInputs,
            crafterOutputs2,
            forwarder
        );
        bytes memory data3 = abi.encodeWithSignature(
            crafterSigString,
            signer,
            burn,
            craftableAmount,
            crafterInputs,
            crafterOutputs3,
            forwarder
        );

        bytes32 salt = bytes32('1');

        c1 = CrafterMint(cloneFac.cloneDeterministic(address(crafterMintImpl), salt, data1));
        c2 = CrafterMint(cloneFac.cloneDeterministic(address(crafterMintImpl), salt, data2));
        c3 = CrafterMint(cloneFac.cloneDeterministic(address(crafterMintImpl), salt, data3));

        // Deploying lootbox instances
        Lootbox lootboxImpl = new Lootbox();

        string memory lootboxSigString = 'initialize(address,address[],uint8[],address,address)';
        bytes memory dataLootbox = abi.encodeWithSignature(
            lootboxSigString,
            signer,
            [c1, c2, c3],
            [10, 20, 100],
            beacon,
            forwarder
        );

        lootboxInst = Lootbox(cloneFac.cloneDeterministic(address(lootboxImpl), salt, dataLootbox));

        coordinator = new VRFCoordinatorV2(address(0), address(0), address(0));
        vm.etch(coordinatorAddr, address(coordinator).code);

        vm.prank(signer);
        coordinator.addConsumer(subId, address(beacon));

        c1.grantRouter(address(lootboxInst));
        c2.grantRouter(address(lootboxInst));
        c3.grantRouter(address(lootboxInst));
    }

    function testOneLootbox() external {}
}
