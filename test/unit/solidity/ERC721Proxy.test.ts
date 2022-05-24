import { ethers, expect } from 'hardhat';
import {
    ERC721Proxy,
    ERC721Proxy__factory,
    ERC721MintableCode__factory,
    ERC721MintableCode,
    ERC721Mintable,
    ERC721Mintable__factory,
} from '../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('Deploying multiple instances of MinterSimply with MinterCoreFactory.sol', () => {
    let nftCodeFactory: ERC721MintableCode__factory;
    let nftCode: ERC721MintableCode;

    let proxyLauncherFactory: ERC721Proxy__factory;
    let proxyLauncherContr: ERC721Proxy;

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

        //launch contract for creating proxies
        proxyLauncherFactory = await ethers.getContractFactory('ERC721Proxy');
        proxyLauncherContr = await proxyLauncherFactory.connect(admin).deploy(nftCode.address);
    });

    it('create proxies', async () => {
        //create proxies
        const launchDucks = await proxyLauncherContr.connect(admin).createProxy('Duck Gang', 'DCKG', 'some uri');
        const { events: events1 } = await launchDucks.wait();
        const event1 = events1 ? events1.filter((e) => e.event === 'NewClone')[0] : undefined;
        ducksContrAddr = event1?.args?.proxyAddr;
        console.log('Proxy deployed to', ducksContrAddr);
        expect(event1).to.not.equal(undefined); //NewClone event emitted

        const launchRobots = await proxyLauncherContr.connect(admin).createProxy('Robot Gang', 'RBTG', 'some uri');
        const { events: events2 } = await launchRobots.wait();
        const event2 = events2 ? events2.filter((e) => e.event === 'NewClone')[0] : undefined;
        robotsContrAddr = event2?.args?.proxyAddr;
        console.log('Proxy deployed to', robotsContrAddr);
        expect(event2).to.not.equal(undefined); //NewClone event emitted
    });

    it('Mint from proxies', async () => {
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
