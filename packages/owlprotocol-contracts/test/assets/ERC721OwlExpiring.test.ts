import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721OwlExpiring,
    ERC721OwlExpiring__factory,
} from '../../typechain';
import { deployClone } from '../utils';

const salt = ethers.utils.formatBytes32String('1');
const expireTime = 500;

describe('ERC721Expiring.sol', () => {
    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let contrInst: ERC721OwlExpiring;
    beforeEach(async () => {
        [signer1, signer2] = await ethers.getSigners();
        const ERC721OwlExpiringFactory = (await ethers.getContractFactory(
            'ERC721OwlExpiring',
        )) as ERC721OwlExpiring__factory;
        const ERC721OwlExpiring = await ERC721OwlExpiringFactory.deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();
        const { address } = await deployClone(
            ERC721OwlExpiring,
            [signer1.address, 'n', 's', 'u'],
            ERC1167Factory,
            salt,
        );
        contrInst = (await ethers.getContractAt('ERC721OwlExpiring', address)) as ERC721OwlExpiring;
    });

    describe('ownerOf()', async () => {
        beforeEach(async () => {
            await expect(contrInst.ownerOf(1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
            await expect(contrInst['mint(address,uint256)'](signer1.address, 2)).to.be.revertedWith(
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
            // console.log((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp);
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
                'ERC721: operator query for nonexistent token',
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
});
