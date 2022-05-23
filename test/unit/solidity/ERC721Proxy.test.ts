import { ethers } from 'hardhat';
// import { expect } from 'chai';
import { ERC721Proxy, ERC721Proxy__factory, ERC721MintableCode__factory, ERC721MintableCode } from '../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('Deploying multiple instances of MinterSimply with MinterCoreFactory.sol', () => {
    let nftContrFactory: ERC721MintableCode__factory;
    let nftCode: ERC721MintableCode;

    let proxyLauncherFactory: ERC721Proxy__factory;
    let proxyLauncherContr: ERC721Proxy;

    let accounts;
    let admin: SignerWithAddress;

    before(async () => {
        accounts = await ethers.getSigners();
        [admin] = accounts;

        //deploy ERC721 code
        nftContrFactory = await ethers.getContractFactory('ERC721MintableCode');
        nftCode = await nftContrFactory.connect(admin).deploy();
        await nftCode.deployed();

        //launch contract for creating proxies
        proxyLauncherFactory = await ethers.getContractFactory('ERC721Proxy');
        proxyLauncherContr = await proxyLauncherFactory.connect(admin).deploy(nftCode.address);

        //create proxies
        const launchDucks = await proxyLauncherContr.connect(admin).createProxy('Duck Gang', 'DCKG', 'some uri');
        const { events: events1 } = await launchDucks.wait();
        const event1 = events1 ? events1.filter((e) => e.event === 'NewClone')[0] : undefined;
        console.log('Proxy deployed to', event1?.args?.proxyAddr);

        const launchRobots = await proxyLauncherContr.connect(admin).createProxy('Robot Gang', 'RBTG', 'some uri');
        const { events: events2 } = await launchRobots.wait();
        const event2 = events2 ? events2.filter((e) => e.event === 'NewClone')[0] : undefined;
        console.log('Proxy deployed to', event2?.args?.proxyAddr);
    });

    // it('Mint from proxies', async () => {});
});
