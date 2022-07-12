import { ethers, network } from 'hardhat';
const { utils } = ethers;
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

describe('Lootbox.sol', () => {
    let VRFBeacon: VRFBeacon;
    let signer1: SignerWithAddress;
    beforeEach(async () => {
        [signer1] = await ethers.getSigners();

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

        await network.provider.send("hardhat_setCode", [
            coordinatorAddr,
            mockDeployedBytecode,
        ]);

        const coordinator = (await ethers.getContractAt('VRFCoordinatorV2', coordinatorAddr)) as VRFCoordinatorV2;
        await coordinator.connect(signer1).addConsumer(subId, VRFBeacon.address);

        const blockNumber = await ethers.provider.getBlockNumber();
        expect(await VRFBeacon.epochBlock(blockNumber)).equals(getEpochBlockNumber(blockNumber));
        expect(await VRFBeacon.epochBlockLatest()).equals(getEpochBlockNumber(blockNumber));

        const reqId = await VRFBeacon.callStatic.requestRandomness(blockNumber);
        await VRFBeacon.requestRandomness(blockNumber);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(reqId);

        const blockNumber2 = await ethers.provider.getBlockNumber();
        // blockNumber2 = blockNumber + 1
        // await expect(VRFBeacon.requestRandomness(blockNumber2)).to.be.revertedWith('VRFBeacon: Already requested!');

        const tx = await coordinator.fulfillRandomWords(reqId, VRFBeacon.address)
        const { events } = await tx.wait();
        const fulfilledEvent = events ? events[0] : undefined;

        if (fulfilledEvent === undefined) return;

        const { requestId, randomNumber } = pick(VRFBeacon.interface.decodeEventLog("Fulfilled", fulfilledEvent.data, fulfilledEvent.topics), ['requestId', 'randomNumber'])

        expect(requestId).to.equal(reqId);
        expect(await VRFBeacon.getRandomness(blockNumber)).to.equal(randomNumber);

        console.log(randomNumber)
    });

    it('1 Lootbox', async () => {

    });

});

function getEpochBlockNumber(blockNumber: number) {
    return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
}




