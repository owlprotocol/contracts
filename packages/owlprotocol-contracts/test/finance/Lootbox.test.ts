import { ethers, network } from 'hardhat';
import { time, setCode, mineUpTo } from "@nomicfoundation/hardhat-network-helpers";
const { utils, constants } = ethers;
const { AddressZero } = constants
const { parseUnits, keccak256, hexlify, hexZeroPad } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    Lootbox,
    Lootbox__factory,
    FactoryERC20,
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
    FactoryERC721,
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

    let outputTokenIds: number[];

    let lootboxNFT: FactoryERC721;
    let reward1: FactoryERC721;
    let reward2: FactoryERC721;
    let reward3: FactoryERC721;

    const lootboxToUnlock1 = 3;
    const lootboxToUnlock2 = 7;
    const lootboxToUnlock3 = 9;

    let coordinator: VRFCoordinatorV2;
    let requestId: BigNumber;
    let blockNumber: BigNumber

    beforeEach(async () => {
        [signer1, burn, forwarder] = await ethers.getSigners();

        //rinkeby fork
        await network.provider.request({
            method: 'hardhat_reset',
            params: [
                {
                    forking: {
                        jsonRpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
                        blockNumber: 11017060,
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
        const craftableAmount = 15;

        [lootboxNFT] = await createERC721(1, craftableAmount);
        [reward1, reward2, reward3] = await createERC721(3, 0)

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

        outputTokenIds = Array.from(Array(craftableAmount).keys());
        const crafterOutputCommon = {
            token: TokenType.erc721,
            consumableType: ConsumableType.unaffected,
            amounts: [],
            tokenIds: outputTokenIds
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

        await setCode(coordinatorAddr, mockDeployedBytecode);

        coordinator = (await ethers.getContractAt('VRFCoordinatorV2', coordinatorAddr)) as VRFCoordinatorV2;
        await coordinator.connect(signer1).addConsumer(subId, VRFBeacon.address);

        const crafterMint1 = (await ethers.getContractAt('CrafterMint', crafterMintAddr1)) as CrafterMint;
        const crafterMint2 = (await ethers.getContractAt('CrafterMint', crafterMintAddr2)) as CrafterMint;
        const crafterMint3 = (await ethers.getContractAt('CrafterMint', crafterMintAddr3)) as CrafterMint;

        await lootboxNFT.setApprovalForAll(crafterMintAddr1, true);
        await lootboxNFT.setApprovalForAll(crafterMintAddr2, true);
        await lootboxNFT.setApprovalForAll(crafterMintAddr3, true);

        await crafterMint1.grantRouter(lootbox.address);
        await crafterMint2.grantRouter(lootbox.address);
        await crafterMint3.grantRouter(lootbox.address);

        ({ requestId, blockNumber } = pick(await lootbox.callStatic.requestUnlock(lootboxToUnlock1), ['requestId', 'blockNumber']));
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

    });

    async function coordinatorRespond() {
        //simulating coordiantor response
        const tx = await coordinator.fulfillRandomWords(requestId, VRFBeacon.address)
        const { events } = await tx.wait();
        const fulfilledEvent = events ? events[0] : undefined;

        if (fulfilledEvent === undefined) return;

        const { requestId: requestIdFulfilled, randomNumber } = pick(VRFBeacon.interface.decodeEventLog("Fulfilled", fulfilledEvent.data, fulfilledEvent.topics), ['requestId', 'randomNumber'])

        expect(requestIdFulfilled).to.equal(requestId);
        expect(await VRFBeacon.getRandomness(blockNumber)).to.equal(randomNumber);
    }

    async function simulateKeeper() {
        //simulating keeper
        //checkUpkeep
        const { upkeepNeeded, performData } = await lootbox.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(true);
        const { randomness, queueIndex } = ethers.utils.defaultAbiCoder.decode(['uint256 randomness', 'uint256 queueIndex'], performData);
        expect(await VRFBeacon.getRandomness(await lootbox.getEpochBlock(lootboxToUnlock1))).to.equal(randomness)
        expect(await lootbox.queueIndex()).to.equal(queueIndex);

        //performUpkeep
        await lootbox.performUpkeep(performData);
        return { randomness }
    }

    it('1 Lootbox', async () => {

        await mineUpTo(getEpochBlockNumber(await time.latestBlock()));
        await coordinatorRespond();

        const { randomness } = await simulateKeeper();

        const tokenToMint = outputTokenIds[outputTokenIds.length - 1]

        const randContract = await lootbox.getRandomContract(lootboxToUnlock1, randomness);
        if (randContract.eq(0)) {
            expect(await reward1.ownerOf(tokenToMint)).to.equal(signer1.address);
            expect(await reward2.exists(tokenToMint)).to.equal(false);
            expect(await reward3.exists(tokenToMint)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(1)) {
            expect(await reward1.exists(tokenToMint)).to.equal(false);
            expect(await reward2.ownerOf(tokenToMint)).to.equal(signer1.address);
            expect(await reward3.exists(tokenToMint)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(2)) {
            expect(await reward1.exists(tokenToMint)).to.equal(false);
            expect(await reward2.exists(tokenToMint)).to.equal(false);
            expect(await reward3.ownerOf(tokenToMint)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        }
        // after completion
        expect((await lootbox.checkUpkeep("0x")).upkeepNeeded).to.equal(false)

    });

    it('2 Lootboxes, same EPOCH_PERIOD', async () => {

        ({ requestId, blockNumber } = pick(await lootbox.callStatic.requestUnlock(lootboxToUnlock2), ['requestId', 'blockNumber']));
        await lootbox.requestUnlock(lootboxToUnlock2);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        //check that both requestUnlocks are in the same epoch on VRFBeacon 
        expect(await lootbox.getEpochBlock(lootboxToUnlock1)).to.equal(await lootbox.getEpochBlock(lootboxToUnlock2));

        await mineUpTo(getEpochBlockNumber(blockNumber.toNumber()));
        await coordinatorRespond();

        const { randomness } = await simulateKeeper();

        const randContract1 = await lootbox.getRandomContract(lootboxToUnlock1, randomness);
        const randContract2 = await lootbox.getRandomContract(lootboxToUnlock2, randomness);

        const tokenToMint = outputTokenIds[outputTokenIds.length - 1]

        if (randContract1.eq(0)) {
            expect(await reward1.ownerOf(tokenToMint)).to.equal(signer1.address);
            expect(await reward2.exists(tokenToMint)).to.equal(false);
            expect(await reward3.exists(tokenToMint)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract1.eq(1)) {
            expect(await reward1.exists(tokenToMint)).to.equal(false);
            expect(await reward2.ownerOf(tokenToMint)).to.equal(signer1.address);
            expect(await reward3.exists(tokenToMint)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract1.eq(2)) {
            expect(await reward1.exists(tokenToMint)).to.equal(false);
            expect(await reward2.exists(tokenToMint)).to.equal(false);
            expect(await reward3.ownerOf(tokenToMint)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        }

        const tokenToMint2 = outputTokenIds[outputTokenIds.length - 2]

        if (randContract2.eq(0)) {
            if (randContract1.eq(0))
                expect(await reward1.ownerOf(tokenToMint2)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock2)).to.equal(burn.address);
        } else if (randContract2.eq(1)) {
            if (randContract1.eq(1))
                expect(await reward2.ownerOf(tokenToMint2)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock2)).to.equal(burn.address);
        } else if (randContract2.eq(2)) {
            if (randContract1.eq(2))
                expect(await reward3.ownerOf(tokenToMint2)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock2)).to.equal(burn.address);
        }
        // after completion
        // expect((await lootbox.checkUpkeep("0x")).upkeepNeeded).to.equal(false)
    })

});

function getEpochBlockNumber(blockNumber: number) {
    return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
}




