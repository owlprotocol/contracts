import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
    OZClonesFactory__factory,
    OZClonesFactory,
    ERC721MintableCode__factory,
    ERC721MintableCode,
    ERC721Mintable,
    ERC721Mintable__factory,
} from '../../../typechain';
import { abi } from '../../../artifacts/contracts/ERC721/ERC721MintableCode.sol/ERC721MintableCode.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const SALT1 = ethers.utils.hexZeroPad(ethers.utils.hexlify(2532), 32);
const SALT2 = ethers.utils.hexZeroPad(ethers.utils.hexlify(51155), 32);

describe('OZCloneFactory.sol', () => {
    let nftCodeFactory: ERC721MintableCode__factory;
    let nftCode: ERC721MintableCode; //logic contract

    let ozClonesFactory: OZClonesFactory__factory;
    let ozClones: OZClonesFactory;

    let accounts;
    let admin: SignerWithAddress;
    let minter1: SignerWithAddress;
    let minter2: SignerWithAddress;

    let nftContrFactory: ERC721Mintable__factory;
    let ducksContr: ERC721Mintable;
    let robotsContr: ERC721Mintable;
    let ducksContrAddr: string;
    let robotsContrAddr: string;

    before(async () => {
        accounts = await ethers.getSigners();
        [admin, minter1, minter2] = accounts;
        nftContrFactory = await ethers.getContractFactory('ERC721Mintable');

        //deploy ERC721 code
        nftCodeFactory = await ethers.getContractFactory('ERC721MintableCode');
        nftCode = await nftCodeFactory.connect(admin).deploy();
        await nftCode.deployed();

        //deploy universal proxy creator
        ozClonesFactory = await ethers.getContractFactory('OZClonesFactory');
        ozClones = await ozClonesFactory.deploy();
        await ozClones.deployed();
    });

    it('create proxies', async () => {
        const i = new ethers.utils.Interface(abi);

        const duckSig = i.encodeFunctionData('initialize', ['Duck Gang', 'DCKG', 'some uri', admin.address]);
        const duckDeploy = await ozClones.cloneDeterministic(nftCode.address, SALT1, duckSig);
        const { events: events1 } = await duckDeploy.wait();
        const event1 = events1 ? events1.filter((e) => e.event === 'NewClone')[0] : undefined;
        ducksContrAddr = event1?.args?.instance;
        console.log('Duck proxy deployed to', ducksContrAddr);
        expect(event1).to.not.equal(undefined); //NewClone event emitted
        expect(ducksContrAddr).to.equal(await ozClones.predictDeterministicAddress(nftCode.address, SALT1));

        const robotSig = i.encodeFunctionData('initialize', ['Robot Hang', 'RBTG', 'some uri', admin.address]);
        const robotFail = ozClones.cloneDeterministic(nftCode.address, SALT1, robotSig);
        await expect(robotFail).to.be.revertedWith('ERC1167: create2 failed');

        const robotDeploy = await ozClones.cloneDeterministic(nftCode.address, SALT2, robotSig);
        const { events: events2 } = await robotDeploy.wait();
        const event2 = events2 ? events2.filter((e) => e.event === 'NewClone')[0] : undefined;
        robotsContrAddr = event2?.args?.instance;
        console.log('Robot proxy deployed to', robotsContrAddr);
        expect(event2).to.not.equal(undefined); //NewClone event emitted
        expect(robotsContrAddr).to.equal(await ozClones.predictDeterministicAddress(nftCode.address, SALT2));
    });

    it('mint from proxies', async () => {
        ducksContr = await nftContrFactory.attach(ducksContrAddr);
        robotsContr = await nftContrFactory.attach(robotsContrAddr);

        const mintDuck = await ducksContr.connect(admin).mint(minter1.address, 13);
        const mintRobot = await robotsContr.connect(admin).mint(minter2.address, 18);
        await mintDuck.wait();
        await mintRobot.wait();

        expect(await ducksContr.ownerOf(13)).to.equal(minter1.address);
        expect(await robotsContr.ownerOf(18)).to.equal(minter2.address);
        await expect(ducksContr.connect(minter1).mint(minter1.address, 19)).to.be.revertedWith(
            `AccessControl: account ${minter1.address.toLowerCase()} is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`,
        );
    });
});
