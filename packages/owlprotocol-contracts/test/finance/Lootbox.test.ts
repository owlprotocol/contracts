import { ethers, network } from 'hardhat';
const { utils, constants } = ethers;
const { AddressZero } = constants
const { parseUnits, keccak256, hexlify, hexZeroPad } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    Lootbox,
    Lootbox__factory,
    ERC20,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721,
    ERC1155,
    CrafterTransfer,
    CrafterTransfer__factory,
    CrafterMint,
    CrafterMint__factory,
    VRFBeacon,
    VRFBeacon__factory,
    VRFCoordinatorV2,
} from '../../typechain';
import { pick } from 'lodash';
import { deployedBytecode as mockDeployedBytecode } from "../../artifacts/contracts/testing/VRFCoordinatorV2.sol/VRFCoordinatorV2.json"

import { createERC20, createERC721, createERC1155, deployClone, predictDeployClone, getTime } from '../utils';
import { BigNumber } from 'ethers';
import { ERC721Owl__factory } from '../../typechain';
import { ERC721Owl } from '../../typechain';

const coordinatorAddr = '0x6168499c0cFfCaCD319c818142124B7A15E857ab';
const EPOCH_PERIOD = 10;
const subId = 8101;

enum TokenType {
    erc20,
    erc721,
    erc1155
}

enum ConsumableType {
    unaffected,
    burned,
    NTime
}

describe('Lootbox.sol', () => {
    let VRFBeacon: VRFBeacon;
    let lootbox: Lootbox;

    let signer1: SignerWithAddress;
    let burn: SignerWithAddress;
    let forwarder: SignerWithAddress


    beforeEach(async () => {
        [signer1, burn, forwarder] = await ethers.getSigners();

        //rinkeby fork
        await network.provider.request({
            method: 'hardhat_reset',
            params: [
                {
                    forking: {
                        jsonRpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
                        blockNumber: 11011599,
                    },
                },
            ],
        });


        const VRFBeaconFactory = (await ethers.getContractFactory('VRFBeacon')) as VRFBeacon__factory;
        VRFBeacon = (await VRFBeaconFactory.deploy(
            subId,
            coordinatorAddr,
            '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
            50000, //gas limit
            EPOCH_PERIOD,
        )) as VRFBeacon;

        const ERC1167FactoryFactory = await ethers.getContractFactory("ERC1167Factory")
        const ERC1167Factory = (await ERC1167FactoryFactory.deploy()) as ERC1167Factory

        //3 crafter contracts
        const craftableAmount = 15

        const [lootboxNFT] = await createERC721(1, craftableAmount)
        const [reward1, reward2, reward3] = await createERC721(3, 0)

        const crafterArgsCommon = [
            signer1.address,
            burn.address,
            craftableAmount,
            [
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.burned,
                    contractAddr: lootboxNFT.address,
                    amounts: [],
                    tokenIds: [],
                }
            ]
        ]

        const crafterOutputCommon = {
            token: TokenType.erc721,
            consumableType: ConsumableType.unaffected,
            amounts: [],
            tokenIds: Array.from(Array(craftableAmount).keys())
        }

        const crafterMintFactory = await ethers.getContractFactory("CrafterMint")
        const crafterMintImpl = await crafterMintFactory.deploy()

        const { address: crafterMintAddr1 } = await deployClone(crafterMintImpl, [
            ...crafterArgsCommon,
            [{ ...crafterOutputCommon, contractAddr: reward1.address, },],
            forwarder.address, // forwarder addr
        ], ERC1167Factory)

        const { address: crafterMintAddr2 } = await deployClone(crafterMintImpl, [
            ...crafterArgsCommon, [{ ...crafterOutputCommon, contractAddr: reward2.address }], forwarder.address
        ], ERC1167Factory)

        const { address: crafterMintAddr3 } = await deployClone(crafterMintImpl, [
            ...crafterArgsCommon, [{ ...crafterOutputCommon, contractAddr: reward3.address }], forwarder.address
        ], ERC1167Factory)

        // lootbox contract
        const lootboxFactory = (await ethers.getContractFactory("Lootbox")) as Lootbox__factory
        const lootboxImpl = await lootboxFactory.deploy()

        const { address: lootboxInstAddr } = await deployClone(lootboxImpl, [
            signer1.address,
            [crafterMintAddr1, crafterMintAddr2, crafterMintAddr3],
            [10, 20, 100],
            VRFBeacon.address,
            forwarder.address])

        lootbox = (await ethers.getContractAt("Lootbox", lootboxInstAddr)) as Lootbox;

        await network.provider.send("hardhat_setCode", [
            coordinatorAddr,
            mockDeployedBytecode,
        ]);

        const coordinator = (await ethers.getContractAt('VRFCoordinatorV2', coordinatorAddr)) as VRFCoordinatorV2;
        await coordinator.connect(signer1).addConsumer(subId, VRFBeacon.address);

        const lootboxToUnlock = 3;

        const { requestId, blockNumber } = pick(await lootbox.callStatic.requestUnlock(lootboxToUnlock), ['requestId', 'blockNumber']);
        await lootbox.requestUnlock(lootboxToUnlock);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        const tx = await coordinator.fulfillRandomWords(requestId, VRFBeacon.address)
        const { events } = await tx.wait();
        const fulfilledEvent = events ? events[0] : undefined;

        if (fulfilledEvent === undefined) return;

        const { requestId: requestIdFulfilled, randomNumber } = pick(VRFBeacon.interface.decodeEventLog("Fulfilled", fulfilledEvent.data, fulfilledEvent.topics), ['requestId', 'randomNumber'])

        expect(requestIdFulfilled).to.equal(requestIdFulfilled);
        expect(await VRFBeacon.getRandomness(blockNumber)).to.equal(randomNumber);

        // console.log(randomNumber)
    });

    it('1 Lootbox', async () => {

    });

});

function getEpochBlockNumber(blockNumber: number) {
    return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
}




