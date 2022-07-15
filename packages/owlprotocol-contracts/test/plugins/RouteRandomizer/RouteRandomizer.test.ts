import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { keccak256, toUtf8Bytes } = utils;
import { time, setCode, mineUpTo } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    RouteRandomizer,
    RouteRandomizer__factory,
    ERC1167Factory,
    CrafterMint,
    CrafterTransfer,
    Transformer,
    VRFBeacon,
    VRFBeacon__factory,
    VRFCoordinatorV2,
    FactoryERC721,
    UpgradeableBeaconInitializable__factory,
    UpgradeableBeaconInitializable,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
    ERC721Owl,
    ERC721OwlAttributes,
    ERC721OwlAttributes__factory,
} from '../../../typechain';
import { pick } from 'lodash';
import { deployedBytecode as mockDeployedBytecode } from '../../../artifacts/contracts/testing/VRFCoordinatorV2.sol/VRFCoordinatorV2.json';

import { createERC1155, createERC721, deployClone, encodeGenesUint256 } from '../../utils';
import { BigNumber, Signer } from 'ethers';
import { deploy } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { solidityPack } from 'ethers/lib/utils';

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

enum GeneTransformType {
    none,
    add,
    sub,
    mult,
    set,
}

describe('RouteRandomizer.sol', async () => {
    let VRFBeacon: VRFBeacon;
    let routeRandomizer: RouteRandomizer;
    let routeRandomizerImpl: RouteRandomizer;
    let routeRandomizerArgs: (string | number[] | string[])[];

    let signer1: SignerWithAddress;
    let burn: SignerWithAddress;
    let forwarder: SignerWithAddress;

    let crafterInput: FactoryERC721;
    let transformerInput: ERC721OwlAttributes;

    let crafterMintReward1: FactoryERC721;
    let crafterMintReward2: FactoryERC721;

    let outputTokenIds: number[];

    let coordinator: VRFCoordinatorV2;

    const vals = [1, 1, 1];
    const genes = [250, 252, 254];

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

        //crafter contracts
        const craftableAmount = 15;

        [crafterInput] = await createERC721(1, craftableAmount);
        [crafterMintReward1, crafterMintReward2] = await createERC721(2, 0);

        const crafterArgsCommon = [
            signer1.address,
            burn.address,
            craftableAmount,
            [
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.burned,
                    contractAddr: crafterInput.address,
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

        // creating 2 crafter mint instances

        const crafterMintFactory = await ethers.getContractFactory('CrafterMint');
        const crafterMintImpl = await crafterMintFactory.deploy();

        const { address: crafterMintAddr1 } = await deployClone(
            crafterMintImpl,
            [
                ...crafterArgsCommon,
                [{ ...crafterOutputCommon, contractAddr: crafterMintReward1.address }],
                forwarder.address,
            ],
            ERC1167Factory,
        );

        const { address: crafterMintAddr2 } = await deployClone(
            crafterMintImpl,
            [
                ...crafterArgsCommon,
                [{ ...crafterOutputCommon, contractAddr: crafterMintReward2.address }],
                forwarder.address,
            ],
            ERC1167Factory,
        );

        //deploying owl - transformer input
        const ERC721OwlAttributesFactory = (await ethers.getContractFactory(
            'ERC721OwlAttributes',
        )) as ERC721OwlAttributes__factory;
        const ERC721OwlAttributes = await ERC721OwlAttributesFactory.deploy();
        const { address } = await deployClone(
            ERC721OwlAttributes,
            [signer1.address, 'n', 's', 'u', forwarder.address],
            ERC1167Factory,
        );

        transformerInput = (await ethers.getContractAt('ERC721OwlAttributes', address)) as ERC721OwlAttributes;
        transformerInput.mint(signer1.address, encodeGenesUint256(vals, genes));

        // creating transformer instance
        const transformerFactory = await ethers.getContractFactory('Transformer');
        const transformerImpl = await transformerFactory.deploy();

        const { address: transformerAddress } = await deployClone(
            transformerImpl,
            [
                signer1.address,
                burn.address,
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.burned,
                        contractAddr: crafterInput.address, // takes the crafterInput NFT as an input ingredient
                        amounts: [],
                        tokenIds: [],
                    },
                ],
                [250, 252, 254],
                [
                    {
                        geneTransformType: GeneTransformType.add,
                        value: 1,
                    },
                    {
                        geneTransformType: GeneTransformType.add,
                        value: 2,
                    },
                    {
                        geneTransformType: GeneTransformType.add,
                        value: 3,
                    },
                ],
                transformerInput.address, // transforms this ERC721
                forwarder.address,
            ],
            ERC1167Factory,
        );

        //routeRandomizer contract
        const routeRandomizerFactory = (await ethers.getContractFactory('RouteRandomizer')) as RouteRandomizer__factory;
        routeRandomizerImpl = await routeRandomizerFactory.deploy();

        const craftSig = keccak256(toUtf8Bytes('craft(uint96,uint256[][])'));
        const transformSig = keccak256(toUtf8Bytes('transform(uint256,uint256[][])'));

        routeRandomizerArgs = [
            signer1.address,
            [crafterMintAddr1, crafterMintAddr2, transformerAddress],
            [craftSig, craftSig, transformSig],
            [33, 66, 100],
            VRFBeacon.address,
            forwarder.address,
        ];

        const { address: routeRandomizerInstAddr } = await deployClone(routeRandomizerImpl, routeRandomizerArgs);
        routeRandomizer = (await ethers.getContractAt('RouteRandomizer', routeRandomizerInstAddr)) as RouteRandomizer;

        await setCode(coordinatorAddr, mockDeployedBytecode);

        coordinator = (await ethers.getContractAt('VRFCoordinatorV2', coordinatorAddr)) as VRFCoordinatorV2;
        await coordinator.addConsumer(subId, VRFBeacon.address);

        const crafterMint1 = (await ethers.getContractAt('CrafterMint', crafterMintAddr1)) as CrafterMint;
        const crafterMint2 = (await ethers.getContractAt('CrafterMint', crafterMintAddr2)) as CrafterMint;
        const transformer = (await ethers.getContractAt('Transformer', transformerAddress)) as Transformer;

        await crafterInput.setApprovalForAll(crafterMintAddr1, true);
        await crafterInput.setApprovalForAll(crafterMintAddr2, true);
        await crafterInput.setApprovalForAll(transformerAddress, true);

        await transformerInput.grantDna(routeRandomizerInstAddr);
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
        const { upkeepNeeded, performData } = await routeRandomizer.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(true);
        const { randomness, queueIndex } = ethers.utils.defaultAbiCoder.decode(
            ['uint256 randomness', 'uint256 queueIndex'],
            performData,
        );

        expect(await VRFBeacon.getRandomness(epochBlock)).to.equal(randomness);
        expect(await routeRandomizer.queueIndex()).to.equal(queueIndex);

        //performUpkeep
        const tx = await routeRandomizer.performUpkeep(performData);
        const receipt = await tx.wait();
        return { randomness, receipt };
    }

    it('1 route randomization', async () => {
        const craftArgs = solidityPack(['uint256', 'uint256[][]'], [1, [[0]]]);
        const transformArgs = solidityPack(['uint256', 'uint256[][]'], [0, [[0]]]);
        const argsArr = [craftArgs, craftArgs, transformArgs];
        const { requestId, blockNumber } = pick(await routeRandomizer.callStatic.requestRouteRandomize(argsArr), [
            'requestId',
            'blockNumber',
        ]);
        await routeRandomizer.requestRouteRandomize(argsArr);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(requestId);

        const { upkeepNeeded } = await routeRandomizer.checkUpkeep('0x');
        expect(upkeepNeeded).to.equal(false);

        await coordinatorRespond(requestId, blockNumber);
        const { randomness, receipt } = await simulateKeeper(blockNumber);
    });
});

function getEpochBlockNumber(blockNumber: number) {
    return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
}
