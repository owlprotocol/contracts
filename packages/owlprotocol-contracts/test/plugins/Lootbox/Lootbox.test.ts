import { ethers, network } from 'hardhat';
import { time, setCode, mineUpTo } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    Lootbox,
    Lootbox__factory,
    ERC1167Factory,
    CrafterMint,
    VRFBeacon,
    VRFBeacon__factory,
    VRFCoordinatorV2,
    FactoryERC721,
    UpgradeableBeaconInitializable__factory,
    UpgradeableBeaconInitializable,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
} from '../../../typechain';
import { pick } from 'lodash';
import { deployedBytecode as mockDeployedBytecode } from '../../../artifacts/contracts/testing/VRFCoordinatorV2.sol/VRFCoordinatorV2.json';

import { createERC721, deployClone } from '../../utils';
import { BigNumber } from 'ethers';

const coordinatorAddr = '0x6168499c0cFfCaCD319c818142124B7A15E857ab';
const EPOCH_PERIOD = 10;
const subId = 8101;

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

enum ConsumableType {
    unaffected,
    burned,
    NTime,
}

describe('Lootbox.sol', () => {
    let VRFBeacon: VRFBeacon;
    let lootbox: Lootbox;
    let lootboxImpl: Lootbox;
    let lootboxArgs: (string | number[] | string[])[];

    let signer1: SignerWithAddress;
    let burn: SignerWithAddress;
    let forwarder: SignerWithAddress;

    let outputTokenIds: number[];

    let lootboxNFT: FactoryERC721;
    let reward1: FactoryERC721;
    let reward2: FactoryERC721;
    let reward3: FactoryERC721;

    const lootboxToUnlock1 = 3;
    const lootboxToUnlock2 = 7;
    const lootboxToUnlock3 = 9;

    let coordinator: VRFCoordinatorV2;

    beforeEach(async () => {
        [signer1, burn, forwarder] = await ethers.getSigners();

        //rinkeby fork
        await network.provider.request({
            method: 'hardhat_reset',
            params: [
                {
                    forking: {
                        jsonRpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
                        blockNumber: 11017810,
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

        const ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
        const ERC1167Factory = (await ERC1167FactoryFactory.deploy()) as ERC1167Factory;

        //3 crafter contracts
        const craftableAmount = 15;

        [lootboxNFT] = await createERC721(1, craftableAmount);
        [reward1, reward2, reward3] = await createERC721(3, 0);

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
                },
            ],
        ];

        outputTokenIds = Array.from(Array(craftableAmount).keys());
        const crafterOutputCommon = {
            token: TokenType.erc721,
            consumableType: ConsumableType.unaffected,
            amounts: [],
            tokenIds: outputTokenIds,
        };

        const crafterMintFactory = await ethers.getContractFactory('CrafterMint');
        const crafterMintImpl = await crafterMintFactory.deploy();

        const { address: crafterMintAddr1 } = await deployClone(
            crafterMintImpl,
            [
                ...crafterArgsCommon,
                [{ ...crafterOutputCommon, contractAddr: reward1.address }],
                forwarder.address, // forwarder addr
            ],
            ERC1167Factory,
        );

        const { address: crafterMintAddr2 } = await deployClone(
            crafterMintImpl,
            [...crafterArgsCommon, [{ ...crafterOutputCommon, contractAddr: reward2.address }], forwarder.address],
            ERC1167Factory,
        );

        const { address: crafterMintAddr3 } = await deployClone(
            crafterMintImpl,
            [...crafterArgsCommon, [{ ...crafterOutputCommon, contractAddr: reward3.address }], forwarder.address],
            ERC1167Factory,
        );

        // lootbox contract
        const lootboxFactory = (await ethers.getContractFactory('Lootbox')) as Lootbox__factory;
        lootboxImpl = await lootboxFactory.deploy();

        lootboxArgs = [
            signer1.address,
            [crafterMintAddr1, crafterMintAddr2, crafterMintAddr3],
            [10, 20, 100],
            VRFBeacon.address,
            forwarder.address,
        ];

        const { address: lootboxInstAddr } = await deployClone(lootboxImpl, [...lootboxArgs]);

        await expect(
            deployClone(lootboxImpl, [
                signer1.address,
                [crafterMintAddr1, crafterMintAddr2, crafterMintAddr3],
                [10, 20, 100, 120],
                VRFBeacon.address,
                forwarder.address,
            ]),
        ).to.be.revertedWith('Lootbox.sol: lengths of probabilities and crafterContracts arrays do not match!');

        lootbox = (await ethers.getContractAt('Lootbox', lootboxInstAddr)) as Lootbox;

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
    });

    async function coordinatorRespond(reqId: BigNumber, blockNum: BigNumber) {
        //simulating coordiantor response
        const tx = await coordinator.fulfillRandomWords(reqId, VRFBeacon.address);
        const { events } = await tx.wait();
        const fulfilledEvent = events ? events[0] : undefined;

        if (fulfilledEvent === undefined) return;

        const { requestId: requestIdFulfilled, randomNumber } = pick(
            VRFBeacon.interface.decodeEventLog('Fulfilled', fulfilledEvent.data, fulfilledEvent.topics),
            ['requestId', 'randomNumber'],
        );

        expect(requestIdFulfilled).to.equal(reqId);
        expect(await VRFBeacon.getRandomness(blockNum)).to.equal(randomNumber);
    }

    async function simulateKeeper(epochBlock: BigNumber) {
        //simulating keeper
        //checkUpkeep
        const { upkeepNeeded, performData } = await lootbox.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(true);
        const { randomness, queueIndex } = ethers.utils.defaultAbiCoder.decode(
            ['uint256 randomness', 'uint256 queueIndex'],
            performData,
        );

        expect(await VRFBeacon.getRandomness(epochBlock)).to.equal(randomness);
        expect(await lootbox.queueIndex()).to.equal(queueIndex);

        //performUpkeep
        const tx = await lootbox.performUpkeep(performData);
        const receipt = await tx.wait();
        return { randomness, receipt };
    }

    async function stateChecks(tokenId: number, epochBlock: BigNumber) {
        const { randomness: randomness, receipt: receipt } = await simulateKeeper(epochBlock);
        const { events } = receipt;
        const transferEvent = events ? events[2] : undefined;

        if (transferEvent === undefined) return;

        const { tokenId: tokenIdMinted } = pick(
            lootboxNFT.interface.decodeEventLog('Transfer', transferEvent.data, transferEvent.topics),
            ['tokenId'],
        );

        const randContract = await lootbox.getRandomContract(tokenId, randomness);

        if (randContract.eq(0)) {
            expect(await reward1.ownerOf(tokenIdMinted)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(tokenId)).to.equal(burn.address);
        } else if (randContract.eq(1)) {
            expect(await reward2.ownerOf(tokenIdMinted)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(tokenId)).to.equal(burn.address);
        } else if (randContract.eq(2)) {
            expect(await reward3.ownerOf(tokenIdMinted)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(tokenId)).to.equal(burn.address);
        }
    }

    it('1 Lootbox', async () => {
        const { requestId, blockNumber } = pick(await lootbox.callStatic.requestUnlock(lootboxToUnlock1), [
            'requestId',
            'blockNumber',
        ]);
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        const { upkeepNeeded } = await lootbox.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(false);

        await mineUpTo(getEpochBlockNumber(await time.latestBlock()));
        await coordinatorRespond(requestId, blockNumber);

        const { randomness, receipt } = await simulateKeeper(blockNumber);
        const { events } = receipt;
        const transferEvent = events ? events[2] : undefined;

        if (transferEvent === undefined) return;

        const { tokenId: tokenIdMinted } = pick(
            lootboxNFT.interface.decodeEventLog('Transfer', transferEvent.data, transferEvent.topics),
            ['tokenId'],
        );

        const randContract = await lootbox.getRandomContract(lootboxToUnlock1, randomness);
        if (randContract.eq(0)) {
            expect(await reward1.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(1)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(2)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.ownerOf(tokenIdMinted)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        }
        // after completion
        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(false);
    });

    it('2 Lootboxes, same EPOCH_PERIOD', async () => {
        const { requestId, blockNumber } = pick(await lootbox.callStatic.requestUnlock(lootboxToUnlock1), [
            'requestId',
            'blockNumber',
        ]);
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        const { upkeepNeeded } = await lootbox.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(false);

        await lootbox.callStatic.requestUnlock(lootboxToUnlock2), ['requestId', 'blockNumber'];
        await lootbox.requestUnlock(lootboxToUnlock2);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        //check that both requestUnlocks are in the same epoch on VRFBeacon
        expect(await lootbox.getEpochBlock(lootboxToUnlock1)).to.equal(await lootbox.getEpochBlock(lootboxToUnlock2));

        await mineUpTo(getEpochBlockNumber(blockNumber.toNumber()));
        await coordinatorRespond(requestId, blockNumber);

        //state checks
        const { randomness: randomness, receipt: receipt } = await simulateKeeper(blockNumber);
        const { events } = receipt;
        const transferEvent = events ? events[2] : undefined;

        if (transferEvent === undefined) return;

        const { tokenId: tokenIdMinted } = pick(
            lootboxNFT.interface.decodeEventLog('Transfer', transferEvent.data, transferEvent.topics),
            ['tokenId'],
        );

        const randContract = await lootbox.getRandomContract(lootboxToUnlock1, randomness);

        if (randContract.eq(0)) {
            expect(await reward1.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(1)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(2)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.ownerOf(tokenIdMinted)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        }

        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(true);
        await stateChecks(lootboxToUnlock2, blockNumber);
        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(false);
    });

    it('3 Lootboxes, all in same epoch', async () => {
        const { requestId, blockNumber } = pick(await lootbox.callStatic.requestUnlock(lootboxToUnlock1), [
            'requestId',
            'blockNumber',
        ]);
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        const { upkeepNeeded } = await lootbox.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(false);

        await lootbox.callStatic.requestUnlock(lootboxToUnlock2), ['requestId', 'blockNumber'];
        await lootbox.requestUnlock(lootboxToUnlock2);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        await lootbox.callStatic.requestUnlock(lootboxToUnlock3), ['requestId', 'blockNumber'];
        await lootbox.requestUnlock(lootboxToUnlock3);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        //check that all requestUnlocks are in the same epoch on VRFBeacon
        expect(await lootbox.getEpochBlock(lootboxToUnlock1)).to.equal(await lootbox.getEpochBlock(lootboxToUnlock2));
        expect(await lootbox.getEpochBlock(lootboxToUnlock2)).to.equal(await lootbox.getEpochBlock(lootboxToUnlock3));

        await mineUpTo(getEpochBlockNumber(blockNumber.toNumber()));
        await coordinatorRespond(requestId, blockNumber);

        //state checks
        const { randomness: randomness, receipt: receipt } = await simulateKeeper(blockNumber);
        const { events } = receipt;
        const transferEvent = events ? events[2] : undefined;

        if (transferEvent === undefined) return;

        const { tokenId: tokenIdMinted } = pick(
            lootboxNFT.interface.decodeEventLog('Transfer', transferEvent.data, transferEvent.topics),
            ['tokenId'],
        );

        const randContract = await lootbox.getRandomContract(lootboxToUnlock1, randomness);

        if (randContract.eq(0)) {
            expect(await reward1.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(1)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(2)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.ownerOf(tokenIdMinted)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        }

        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(true);
        await stateChecks(lootboxToUnlock2, blockNumber);
        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(true);
        await stateChecks(lootboxToUnlock3, blockNumber);
        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(false);
    });

    it('3 Lootboxes, two in same epoch, one in different', async () => {
        const { requestId: reqId1, blockNumber: blockNumber1 } = pick(
            await lootbox.callStatic.requestUnlock(lootboxToUnlock1),
            ['requestId', 'blockNumber'],
        );
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber1)).to.equal(reqId1);

        const { upkeepNeeded } = await lootbox.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(false);

        await lootbox.callStatic.requestUnlock(lootboxToUnlock2);
        await lootbox.requestUnlock(lootboxToUnlock2);
        expect(await VRFBeacon.getRequestId(blockNumber1)).to.equal(reqId1);

        //check that both requestUnlocks are in the same epoch on VRFBeacon
        expect(await lootbox.getEpochBlock(lootboxToUnlock1)).to.equal(await lootbox.getEpochBlock(lootboxToUnlock2));

        await mineUpTo(getEpochBlockNumber(blockNumber1.toNumber()));

        const { blockNumber: blockNumber2, requestId: reqId2 } = pick(
            await lootbox.callStatic.requestUnlock(lootboxToUnlock3),
            ['requestId', 'blockNumber'],
        );
        await lootbox.requestUnlock(lootboxToUnlock3);

        await coordinatorRespond(reqId1, blockNumber1);
        await mineUpTo(getEpochBlockNumber(blockNumber2.toNumber()));
        await coordinatorRespond(reqId2, blockNumber2);

        //state checks
        const { randomness: randomness, receipt: receipt } = await simulateKeeper(blockNumber1);
        const { events } = receipt;
        const transferEvent = events ? events[2] : undefined;

        if (transferEvent === undefined) return;

        const { tokenId: tokenIdMinted } = pick(
            lootboxNFT.interface.decodeEventLog('Transfer', transferEvent.data, transferEvent.topics),
            ['tokenId'],
        );

        const randContract = await lootbox.getRandomContract(lootboxToUnlock1, randomness);

        if (randContract.eq(0)) {
            expect(await reward1.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(1)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.ownerOf(tokenIdMinted)).to.equal(signer1.address);
            expect(await reward3.exists(tokenIdMinted)).to.equal(false);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        } else if (randContract.eq(2)) {
            expect(await reward1.exists(tokenIdMinted)).to.equal(false);
            expect(await reward2.exists(tokenIdMinted)).to.equal(false);
            expect(await reward3.ownerOf(tokenIdMinted)).to.equal(signer1.address);

            expect(await lootboxNFT.ownerOf(lootboxToUnlock1)).to.equal(burn.address);
        }

        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(true);
        await stateChecks(lootboxToUnlock2, blockNumber1);
        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(true);
        await stateChecks(lootboxToUnlock3, blockNumber2);
        expect((await lootbox.checkUpkeep('0x')).upkeepNeeded).to.equal(false);
    });

    it('Request unlock multiple times', async () => {
        const { requestId: reqId1, blockNumber: blockNumber1 } = pick(
            await lootbox.callStatic.requestUnlock(lootboxToUnlock1),
            ['requestId', 'blockNumber'],
        );
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber1)).to.equal(reqId1);

        const { requestId: reqId2, blockNumber: blockNumber2 } = await lootbox.callStatic.requestUnlock(
            lootboxToUnlock1,
        );
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber2)).to.equal(reqId2);

        expect(reqId1).to.equal(reqId2);
    });

    it('Multiple performUpkeep() calls with same queueIndex should fail', async () => {
        const { requestId, blockNumber } = pick(await lootbox.callStatic.requestUnlock(lootboxToUnlock1), [
            'requestId',
            'blockNumber',
        ]);
        await lootbox.requestUnlock(lootboxToUnlock1);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        let { upkeepNeeded, performData } = await lootbox.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(false);

        await mineUpTo(getEpochBlockNumber(await time.latestBlock()));
        await coordinatorRespond(requestId, blockNumber);

        //simulating keeper
        //checkUpkeep
        ({ upkeepNeeded, performData } = await lootbox.checkUpkeep('0x'));
        expect(upkeepNeeded).to.equal(true);
        const { randomness, queueIndex } = ethers.utils.defaultAbiCoder.decode(
            ['uint256 randomness', 'uint256 queueIndex'],
            performData,
        );

        expect(await VRFBeacon.getRandomness(blockNumber)).to.equal(randomness);
        expect(await lootbox.queueIndex()).to.equal(queueIndex);

        //performUpkeep (real)
        await lootbox.performUpkeep(performData);

        //performUpkeep with same performData (should fail)
        await expect(lootbox.performUpkeep(performData)).to.be.revertedWith('Lootbox: queueIndex already processed');
    });

    it('beacon proxy initialization', async () => {
        const beaconFactory = (await ethers.getContractFactory(
            'UpgradeableBeaconInitializable',
        )) as UpgradeableBeaconInitializable__factory;
        const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

        const beaconProxyFactory = (await ethers.getContractFactory(
            'BeaconProxyInitializable',
        )) as BeaconProxyInitializable__factory;
        const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

        const { address: beaconAddr } = await deployClone(beaconImpl, [
            signer1.address,
            lootboxImpl.address,
            forwarder.address,
        ]);
        //@ts-ignore
        const data = lootboxImpl.interface.encodeFunctionData('proxyInitialize', [...lootboxArgs]);
        const { address: beaconProxyAddr } = await deployClone(beaconProxyImpl, [
            signer1.address,
            beaconAddr,
            data,
            forwarder.address,
        ]);
        const contrInst = (await ethers.getContractAt('Lootbox', beaconProxyAddr)) as Lootbox;

        await contrInst.requestUnlock(0);
    });
});

function getEpochBlockNumber(blockNumber: number) {
    return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
}
