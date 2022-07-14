import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { keccak256, toUtf8Bytes } = utils;
import { expect } from 'chai';
import {
    BeaconProxyInitializable,
    BeaconProxyInitializable__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721OwlExpiring,
    ERC721OwlExpiring__factory,
    UpgradeableBeaconInitializable,
    UpgradeableBeaconInitializable__factory,
} from '../../typechain';
import { deployClone, deployCloneWrap } from '../utils';
import { loadSignersSmart, TestingSigner, loadForwarder } from '@owlprotocol/contract-helpers-opengsn/src';

const salt = ethers.utils.formatBytes32String('1');
const expireTime = 500;

describe.skip('--- NOT WORKING --- --- --- ERC721Expiring.sol', () => {
    let signer1: TestingSigner;
    let signer2: TestingSigner;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let ERC721OwlExpiringImpl: ERC721OwlExpiring;
    let contrInst: ERC721OwlExpiring;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    beforeEach(async () => {
        //Setup Test Environment
        gsnForwarderAddress = await loadForwarder(ethers);

        [signer1, signer2] = await loadSignersSmart(ethers);

        const ERC721OwlExpiringFactory = (await ethers.getContractFactory(
            'ERC721OwlExpiring',
        )) as ERC721OwlExpiring__factory;
        ERC721OwlExpiringImpl = await ERC721OwlExpiringFactory.deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();
        contrInst = (
            await deployCloneWrap(
                ERC721OwlExpiringImpl,
                [signer1.address, 'n', 's', 'u', gsnForwarderAddress],
                ERC1167Factory,
                salt,
                'initialize(address,string,string,string,address)', // must use full signature
                signer1,
            )
        ).contract as ERC721OwlExpiring;
    });

    describe('ownerOf()', async () => {
        beforeEach(async () => {
            await expect(contrInst.ownerOf(1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
            await expect(contrInst['mint(address,uint256)'](signer1.address, 2)).to.be.revertedWith(
                'ERC721OwlExpiring: function disabled',
            );
            await expect(contrInst['safeMint(address,uint256)'](signer1.address, 2)).to.be.revertedWith(
                'ERC721OwlExpiring: function disabled',
            );

            await network.provider.send('evm_setAutomine', [false]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
        });

        it('before expire', async () => {
            expect(await contrInst.ownerOf(0)).to.equal(signer1.address);
            expect(await contrInst.ownerOf(1)).to.equal(signer1.address);
            expect(await contrInst.ownerOf(2)).to.equal(signer1.address);
            expect(await contrInst.ownerOf(3)).to.equal(signer2.address);
            expect(await contrInst.ownerOf(4)).to.equal(signer2.address);
        });

        it('after expire', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await expect(contrInst.ownerOf(0)).to.be.revertedWith('ERC721: owner query for nonexistent token');
            await expect(contrInst.ownerOf(1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
            await expect(contrInst.ownerOf(2)).to.be.revertedWith('ERC721: owner query for nonexistent token');
            await expect(contrInst.ownerOf(3)).to.be.revertedWith('ERC721: owner query for nonexistent token');
            await expect(contrInst.ownerOf(4)).to.be.revertedWith('ERC721: owner query for nonexistent token');
        });

        it('remint', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');

            expect(await contrInst.ownerOf(0)).to.equal(signer1.address);
            expect(await contrInst.ownerOf(1)).to.equal(signer1.address);
            expect(await contrInst.ownerOf(2)).to.equal(signer1.address);
            expect(await contrInst.ownerOf(3)).to.equal(signer2.address);
            expect(await contrInst.ownerOf(4)).to.equal(signer2.address);
        });

        afterEach(async () => {
            await network.provider.send('evm_setAutomine', [true]);
        });
    });

    describe('tokenURI()', async () => {
        beforeEach(async () => {
            await expect(contrInst.tokenURI(1)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');

            await network.provider.send('evm_setAutomine', [false]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
        });

        it('before expire', async () => {
            expect(await contrInst.tokenURI(0)).to.equal('u0');
            expect(await contrInst.tokenURI(1)).to.equal('u1');
            expect(await contrInst.tokenURI(2)).to.equal('u2');
            expect(await contrInst.tokenURI(3)).to.equal('u3');
            expect(await contrInst.tokenURI(4)).to.equal('u4');
        });

        it('after expire', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await expect(contrInst.tokenURI(0)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
            await expect(contrInst.tokenURI(1)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
            await expect(contrInst.tokenURI(2)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
            await expect(contrInst.tokenURI(3)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
            await expect(contrInst.tokenURI(4)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
        });

        it('remint', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');

            expect(await contrInst.tokenURI(0)).to.equal('u0');
            expect(await contrInst.tokenURI(1)).to.equal('u1');
            expect(await contrInst.tokenURI(2)).to.equal('u2');
            expect(await contrInst.tokenURI(3)).to.equal('u3');
            expect(await contrInst.tokenURI(4)).to.equal('u4');
        });

        afterEach(async () => {
            await network.provider.send('evm_setAutomine', [true]);
        });
    });

    describe('approve()', async () => {
        beforeEach(async () => {
            await expect(contrInst.approve(signer2.address, 1)).to.be.revertedWith(
                'ERC721: owner query for nonexistent token',
            );

            await network.provider.send('evm_setAutomine', [false]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
        });

        it('before expire', async () => {
            await network.provider.send('evm_setAutomine', [true]);

            await expect(contrInst.connect(signer1).approve(signer1.address, 0)).to.be.revertedWith(
                'ERC721: approval to current owner',
            );
            await expect(contrInst.connect(signer2).approve(signer2.address, 0)).to.be.revertedWith(
                'ERC721: approve caller is not owner nor approved for all',
            );

            await contrInst.approve(signer2.address, 0);
            await contrInst.approve(signer2.address, 1);
            await contrInst.approve(signer2.address, 2);
            await contrInst.connect(signer2).approve(signer1.address, 3);
            await contrInst.connect(signer2).approve(signer1.address, 4);

            await contrInst.transferFrom(signer1.address, signer2.address, 0);
            await contrInst.transferFrom(signer1.address, signer2.address, 1);
            await contrInst.transferFrom(signer1.address, signer2.address, 2);
            await contrInst.transferFrom(signer2.address, signer1.address, 3);
            await contrInst.transferFrom(signer2.address, signer1.address, 4);
        });

        it('after expire', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            await expect(contrInst.getApproved(0)).to.be.revertedWith('ERC721: approved query for nonexistent token');
            await expect(contrInst.getApproved(1)).to.be.revertedWith('ERC721: approved query for nonexistent token');
            await expect(contrInst.getApproved(2)).to.be.revertedWith('ERC721: approved query for nonexistent token');
            await expect(contrInst.getApproved(3)).to.be.revertedWith('ERC721: approved query for nonexistent token');
            await expect(contrInst.getApproved(4)).to.be.revertedWith('ERC721: approved query for nonexistent token');

            await expect(contrInst.approve(signer2.address, 0)).to.be.revertedWith(
                'ERC721: owner query for nonexistent token',
            );
            await expect(contrInst.approve(signer2.address, 1)).to.be.revertedWith(
                'ERC721: owner query for nonexistent token',
            );
            await expect(contrInst.approve(signer2.address, 2)).to.be.revertedWith(
                'ERC721: owner query for nonexistent token',
            );
            await expect(contrInst.connect(signer2).approve(signer1.address, 3)).to.be.revertedWith(
                'ERC721: owner query for nonexistent token',
            );
            await expect(contrInst.connect(signer2).approve(signer1.address, 4)).to.be.revertedWith(
                'ERC721: owner query for nonexistent token',
            );
        });

        it('remint', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            await contrInst.approve(signer2.address, 0);
            await contrInst.approve(signer2.address, 1);
            await contrInst.approve(signer2.address, 2);
            await contrInst.connect(signer2).approve(signer1.address, 3);
            await contrInst.connect(signer2).approve(signer1.address, 4);

            await contrInst.transferFrom(signer1.address, signer2.address, 0);
            await contrInst.transferFrom(signer1.address, signer2.address, 1);
            await contrInst.transferFrom(signer1.address, signer2.address, 2);
            await contrInst.transferFrom(signer2.address, signer1.address, 3);
            await contrInst.transferFrom(signer2.address, signer1.address, 4);
        });

        afterEach(async () => {
            await network.provider.send('evm_setAutomine', [true]);
        });
    });

    describe('transferFrom()', async () => {
        beforeEach(async () => {
            await expect(contrInst.transferFrom(signer1.address, signer2.address, 1)).to.be.revertedWith(
                'ERC721: invalid token ID',
            );

            await network.provider.send('evm_setAutomine', [false]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
        });

        it('before expire', async () => {
            await network.provider.send('evm_setAutomine', [true]);

            await contrInst.transferFrom(signer1.address, signer2.address, 0);
            await contrInst.transferFrom(signer1.address, signer2.address, 1);
            await contrInst.transferFrom(signer1.address, signer2.address, 2);
            await contrInst.connect(signer2).transferFrom(signer2.address, signer1.address, 3);
            await contrInst.connect(signer2).transferFrom(signer2.address, signer1.address, 4);
        });

        it('after expire', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            await expect(contrInst.transferFrom(signer1.address, signer2.address, 0)).to.be.revertedWith(
                'ERC721: transfer query for nonexistent token',
            );
            await expect(contrInst.transferFrom(signer1.address, signer2.address, 1)).to.be.revertedWith(
                'ERC721: transfer query for nonexistent token',
            );
            await expect(contrInst.transferFrom(signer1.address, signer2.address, 2)).to.be.revertedWith(
                'ERC721: transfer query for nonexistent token',
            );
            await expect(
                contrInst.connect(signer2).transferFrom(signer2.address, signer1.address, 3),
            ).to.be.revertedWith('ERC721: transfer query for nonexistent token');
            await expect(
                contrInst.connect(signer2).transferFrom(signer2.address, signer1.address, 4),
            ).to.be.revertedWith('ERC721: transfer query for nonexistent token');
        });

        it('remint', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            contrInst['mint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['mint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            await contrInst.transferFrom(signer1.address, signer2.address, 0);
            await contrInst.transferFrom(signer1.address, signer2.address, 1);
            await contrInst.transferFrom(signer1.address, signer2.address, 2);
            await contrInst.connect(signer2).transferFrom(signer2.address, signer1.address, 3);
            await contrInst.connect(signer2).transferFrom(signer2.address, signer1.address, 4);
        });

        afterEach(async () => {
            await network.provider.send('evm_setAutomine', [true]);
        });
    });

    describe('safeTransferFrom()', async () => {
        beforeEach(async () => {
            await expect(
                contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 1),
            ).to.be.revertedWith('ERC721: invalid token ID');

            await network.provider.send('evm_setAutomine', [false]);

            contrInst['safeMint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
        });

        it('before expire', async () => {
            await network.provider.send('evm_setAutomine', [true]);

            await contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 0);
            await contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 1);
            await contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 2);
            await contrInst
                .connect(signer2)
            ['safeTransferFrom(address,address,uint256)'](signer2.address, signer1.address, 3);
            await contrInst
                .connect(signer2)
            ['safeTransferFrom(address,address,uint256)'](signer2.address, signer1.address, 4);
        });

        it('after expire', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            await expect(
                contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 0),
            ).to.be.revertedWith('ERC721: transfer query for nonexistent token');
            await expect(
                contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 1),
            ).to.be.revertedWith('ERC721: transfer query for nonexistent token');
            await expect(
                contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 2),
            ).to.be.revertedWith('ERC721: transfer query for nonexistent token');
            await expect(
                contrInst
                    .connect(signer2)
                ['safeTransferFrom(address,address,uint256)'](signer2.address, signer1.address, 3),
            ).to.be.revertedWith('ERC721: transfer query for nonexistent token');
            await expect(
                contrInst
                    .connect(signer2)
                ['safeTransferFrom(address,address,uint256)'](signer2.address, signer1.address, 4),
            ).to.be.revertedWith('ERC721: transfer query for nonexistent token');
        });

        it('remint', async () => {
            await network.provider.send('evm_increaseTime', [501]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            contrInst['safeMint(address,uint256,uint256)'](signer1.address, 0, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer1.address, 1, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer1.address, 2, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer2.address, 3, expireTime);
            contrInst['safeMint(address,uint256,uint256)'](signer2.address, 4, expireTime);

            await network.provider.send('evm_increaseTime', [0]);
            await network.provider.send('evm_mine');
            await network.provider.send('evm_setAutomine', [true]);

            await contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 0);
            await contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 1);
            await contrInst['safeTransferFrom(address,address,uint256)'](signer1.address, signer2.address, 2);
            await contrInst
                .connect(signer2)
            ['safeTransferFrom(address,address,uint256)'](signer2.address, signer1.address, 3);
            await contrInst
                .connect(signer2)
            ['safeTransferFrom(address,address,uint256)'](signer2.address, signer1.address, 4);
        });

        afterEach(async () => {
            await network.provider.send('evm_setAutomine', [true]);
        });
    });

    it('grantExpiry() and extendExpiry()', async () => {
        const increaseTime = 100;
        const tokenId = 0;

        await contrInst['mint(address,uint256,uint256)'](signer1.address, tokenId, expireTime);

        const currExpiry = await contrInst.getExpiry(tokenId);
        await contrInst.connect(signer1).extendExpiry(tokenId, increaseTime);

        expect(await contrInst.getExpiry(tokenId)).to.equal(currExpiry.toNumber() + increaseTime);

        //no permissions
        await expect(contrInst.connect(signer2).extendExpiry(tokenId, increaseTime)).to.be.revertedWith(
            `AccessControl: account ${signer2.address.toLowerCase()} is missing role ${keccak256(
                toUtf8Bytes('EXPIRY_ROLE'),
            )}`,
        );

        //grant permissions
        await contrInst.connect(signer1).grantExpiry(signer2.address);

        const currExpiry2 = await contrInst.getExpiry(tokenId);
        await contrInst.connect(signer2).extendExpiry(tokenId, increaseTime);

        expect(await contrInst.getExpiry(tokenId)).to.equal(currExpiry2.toNumber() + increaseTime);
    });

    it('beacon proxy initialization', async () => {
        const name = 'name';
        const symbol = 'symbol';
        const uri = 'uri';

        const beaconFactory = (await ethers.getContractFactory(
            'UpgradeableBeaconInitializable',
        )) as UpgradeableBeaconInitializable__factory;
        const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

        const beaconProxyFactory = (await ethers.getContractFactory(
            'BeaconProxyInitializable',
        )) as BeaconProxyInitializable__factory;
        const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

        const { address: beaconAddr } = await deployClone(beaconImpl, [signer1.address, ERC721OwlExpiringImpl.address]);
        const data = contrInst.interface.encodeFunctionData('proxyInitialize', [
            signer1.address,
            name,
            symbol,
            uri,
            '0x' + '0'.repeat(40),
        ]);
        const { address: beaconProxyAddr } = await deployClone(beaconProxyImpl, [signer1.address, beaconAddr, data]);
        contrInst = (await ethers.getContractAt('ERC721OwlExpiring', beaconProxyAddr)) as ERC721OwlExpiring;

        expect(await contrInst.name()).to.equal(name);
        expect(await contrInst.symbol()).to.equal(symbol);
        expect(await contrInst.baseURI()).to.equal(uri);
    });
});
