import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { VRFBeacon, VRFBeacon__factory } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IVRFCoordinatorV2 } from '../../typechain/IVRFCoordinatorV2';
import { pick } from 'lodash';
import { randomInt } from 'crypto';

const coordinatorAddr = '0x6168499c0cFfCaCD319c818142124B7A15E857ab';
const EPOCH_PERIOD = 10;
const subId = 8101;

describe('VRFRandom beacon', () => {
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
                        blockNumber: 11006010,
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
    });

    it('full test', async () => {
        const coordinator = (await ethers.getContractAt('IVRFCoordinatorV2', coordinatorAddr)) as IVRFCoordinatorV2;
        await coordinator.connect(signer1).addConsumer(subId, VRFBeacon.address);

        const blockNumber = await ethers.provider.getBlockNumber();
        expect(await VRFBeacon.epochBlock(blockNumber)).equals(getEpochBlockNumber(blockNumber));
        expect(await VRFBeacon.epochBlockLatest()).equals(getEpochBlockNumber(blockNumber));

        const reqId = await VRFBeacon.callStatic.requestRandomness(blockNumber);
        await VRFBeacon.requestRandomness(blockNumber);
        expect(await VRFBeacon.getRequestId(blockNumber)).to.equal(reqId);

        const blockNumber2 = await ethers.provider.getBlockNumber();
        //blockNumber2 = blockNumber + 1
        await expect(VRFBeacon.requestRandomness(blockNumber2)).to.be.revertedWith('VRFBeacon: Already requested!');

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [coordinatorAddr],
        });

        await network.provider.send('hardhat_setBalance', [coordinatorAddr, '0xff000000000000']);

        const coordinatorContr = await ethers.getSigner(coordinatorAddr);
        const tx = await VRFBeacon.connect(coordinatorContr).rawFulfillRandomWords(reqId, [randomInt(10000000000)]);
        const receipt = await tx.wait();
        const { requestId, randomNumber } = pick(receipt.events?.find((e) => e.event === 'Fulfilled')?.args, [
            'requestId',
            'randomNumber',
        ]);

        expect(requestId).to.equal(reqId);
        expect(await VRFBeacon.getRandomness(blockNumber)).to.equal(randomNumber);
        console.log(randomNumber.toNumber());
    });
});

function getEpochBlockNumber(blockNumber: number) {
    return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
}
