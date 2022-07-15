import { ethers, network } from 'hardhat';
const { utils } = ethers
const { keccak256, toUtf8Bytes } = utils
import { time, setCode, mineUpTo } from "@nomicfoundation/hardhat-network-helpers";
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
} from '../../../typechain';
import { pick } from 'lodash';
import { deployedBytecode as mockDeployedBytecode } from "../../../artifacts/contracts/testing/VRFCoordinatorV2.sol/VRFCoordinatorV2.json"

import { createERC1155, createERC721, deployClone } from '../../utils';
import { BigNumber, Signer } from 'ethers';

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

enum GeneTransformType {
    none,
    add,
    sub,
    mult,
    set,
}

describe('RouteRandomizer.sol', async () => {
    let VRFBeacon: VRFBeacon;
    let routeRandomizerImpl: RouteRandomizer;
    let routeRandomizerArgs: (string | number[] | string[])[];

    let signer1: SignerWithAddress;
    let burn: SignerWithAddress;
    let forwarder: SignerWithAddress;

    let crafterInput: FactoryERC721;
    let transformerInput: FactoryERC721;

    let crafterTransferReward: FactoryERC721;
    let crafterMintReward: FactoryERC721;

    let outputTokenIds: number[];

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

        const ERC1167FactoryFactory = await ethers.getContractFactory("ERC1167Factory");
        const ERC1167Factory = (await ERC1167FactoryFactory.deploy()) as ERC1167Factory

        //3 crafter contracts
        const craftableAmount = 15;

        [crafterInput, transformerInput] = await createERC721(3, craftableAmount);
        [crafterTransferReward] = await createERC721(1, craftableAmount);
        [crafterMintReward] = await createERC721(1, 0);

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

        // creating 2 crafter mint instances

        const crafterMintFactory = await ethers.getContractFactory("CrafterMint")
        const crafterMintImpl = await crafterMintFactory.deploy()

        const { address: crafterMintAddr1 } = await deployClone(crafterMintImpl, [
            ...crafterArgsCommon, [{ ...crafterOutputCommon, contractAddr: crafterMintReward.address }], forwarder.address
        ], ERC1167Factory);

        const { address: crafterMintAddr2 } = await deployClone(crafterMintImpl, [
            ...crafterArgsCommon, [{ ...crafterOutputCommon, contractAddr: crafterMintReward.address }], forwarder.address
        ], ERC1167Factory);

        // creating transformer instance 
        const transformerFactory = await ethers.getContractFactory('Transformer');
        const transformerImpl = await transformerFactory.deploy();

        const { address: transformerAddress } = await deployClone(transformerImpl, [
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
            forwarder.address
        ], ERC1167Factory);

        //routeRandomizer contract
        const routeRandomizerFactory = await ethers.getContractFactory("RouteRandomizer") as RouteRandomizer__factory;
        routeRandomizerImpl = await routeRandomizerFactory.deploy();

        const craftSig = keccak256(toUtf8Bytes("craft(uint96,uint256[][])"))
        const transformSig = keccak256(toUtf8Bytes("transform(uint256,uint256[][])"))

        routeRandomizerArgs = [
            signer1.address,
            [crafterMintAddr1, crafterMintAddr2, transformerAddress],
            [craftSig, craftSig, transformSig],
            [33, 66, 100],
            forwarder.address
        ]
    })

    it('1 route randomization', async () => {
    })
});