import { ethers } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    Bundle,
    Bundle__factory,
    ERC20,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721,
    ERC1155,
    MinterAutoId,
    MinterAutoId__factory,
} from '../../typechain';

import { createERC20, createERC721, createERC1155, deployClone } from '../utils';
import { BigNumber } from 'ethers';
import { ERC721Owl__factory } from '../../typechain';
import { ERC721Owl } from '../../typechain';
import { deploy } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { pick } from 'lodash';
import { parse } from 'path';

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

const salt = ethers.utils.formatBytes32String('1');

describe.skip('Bundle.sol', function () {
    //Extra time
    this.timeout(100000);
    let client: SignerWithAddress;
    let admin: SignerWithAddress;

    let bundleFactory: Bundle__factory;
    let bundleImplementation: Bundle;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let minterAutoIdFactory: MinterAutoId__factory;
    let minterAutoId: MinterAutoId;

    let ERC721Factory: ERC721Owl__factory;
    let ERC721: ERC721Owl;

    let minterAutoIdAddress: string;

    let lootbox: ERC721Owl;

    before(async () => {
        //launch Auction + implementation
        bundleFactory = (await ethers.getContractFactory('Bundle')) as Bundle__factory;
        bundleImplementation = await bundleFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        minterAutoIdFactory = (await ethers.getContractFactory('MinterAutoId')) as MinterAutoId__factory;
        minterAutoId = await minterAutoIdFactory.deploy();

        ERC721Factory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721 = await ERC721Factory.deploy();

        await Promise.all([ERC1167Factory.deployed(), bundleImplementation.deployed()]);

        //get users
        [client, admin] = await ethers.getSigners();

        //deploying lootbox and minterAutoId instances before all tests (want it to remain constant across tests)
        const lootboxAddress = await deployClone(ERC721, [admin.address, 'name', 'symb', 'uri'], ERC1167Factory);
        lootbox = (await ethers.getContractAt('ERC721Owl', lootboxAddress.address)) as ERC721Owl;

        minterAutoIdAddress = await deployClone(
            minterAutoId,
            [
                //admin address
                //client address
                admin.address,
                lootbox.address,
                admin.address,
                0,
                lootboxAddress,
            ],
            ERC1167Factory,
        );
    });

    describe('Tests', () => {
        //define setup
        let testERC721: ERC721;
        let testERC20: ERC20;
        let testERC1155: ERC1155;
        let bundleAddress: string;
        let bundle: Bundle;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [testERC20] = await createERC20(1);
            [testERC721] = await createERC721(1, 2);
            [testERC1155] = await createERC1155(1);

            //Bundle Data
            bundleAddress = await deployClone(
                bundleImplementation,
                [
                    //admin address
                    //client address
                    admin.address,
                    client.address,
                    minterAutoIdAddress,
                ],
                ERC1167Factory,
            );

            bundle = (await ethers.getContractAt('Bundle', bundleAddress)) as Bundle;

            //Set Approval ERC721 for sale
            await testERC20.connect(client).approve(bundleAddress, parseUnits('100.0', 18));
            await testERC721.connect(client).approve(bundleAddress, 1);
            await testERC721.connect(client).approve(bundleAddress, 2);
            await testERC1155.connect(client).setApprovalForAll(bundleAddress, true);
            await lootbox.connect(admin).grantMinter(minterAutoIdAddress);

            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);

            //assert initial token amounts
            expect(await testERC20.balanceOf(client.address)).to.equal(totalERC20Minted);
            expect(await testERC721.ownerOf(1)).to.equal(client.address);
            expect(await testERC721.ownerOf(2)).to.equal(client.address);
            //expect(await testERC1155.balanceOf(client.address)).to.equal(1);
            //storage tests
        });

        it('simple bundle - 1 asset', async () => {
            await bundle.lock([
                {
                    token: TokenType.erc721,
                    contractAddr: testERC721.address,
                    tokenId: 1,
                    amount: 1,
                },
            ]);

            //storage tests after lock
            expect(await testERC721.ownerOf(1)).to.equal(bundle.address);
            expect(await testERC721.ownerOf(2)).to.equal(client.address);
            expect(await lootbox.ownerOf(0)).to.equal(client.address);

            expect((await bundle.connect(admin).getLootboxStorage(0)).length).to.equal(1); //auto mint id starts token ids at 0! create functions start at token id 1
            expect(
                pick((await bundle.connect(admin).getLootboxStorage(0))[0], [
                    'token',
                    'contractAddr',
                    'tokenId',
                    'amount',
                ]),
            ).to.deep.equal({
                token: TokenType.erc721,
                contractAddr: testERC721.address,
                tokenId: BigNumber.from(1),
                amount: BigNumber.from(1),
            });

            await bundle.unlock(0);

            //storage tests after unlock
            expect((await bundle.connect(admin).getLootboxStorage(0)).length).to.equal(0);
            expect(await testERC721.ownerOf(1)).to.equal(client.address);
            expect(await lootbox.ownerOf(0)).to.equal(client.address);
        });

        it('lock multiple lootboxes with different assets', async () => {
            await bundle.lock([
                {
                    token: TokenType.erc721,
                    contractAddr: testERC721.address,
                    tokenId: 1,
                    amount: 1,
                },
            ]);

            await bundle.lock([
                {
                    token: TokenType.erc20,
                    contractAddr: testERC20.address,
                    tokenId: 1,
                    amount: 100,
                },
            ]);
            await bundle.lock([
                {
                    token: TokenType.erc1155,
                    contractAddr: testERC1155.address,
                    tokenId: 1,
                    amount: 100,
                },
            ]);

            //storage tests after lock
            expect(await testERC721.ownerOf(1)).to.equal(bundle.address);
            expect(await testERC20.balanceOf(bundle.address)).to.equal(100);
            expect(await testERC1155.balanceOf(bundle.address, 1)).to.equal(100);
            expect(await lootbox.ownerOf(0)).to.equal(client.address);
            expect(await lootbox.ownerOf(1)).to.equal(client.address);
            expect(await lootbox.ownerOf(2)).to.equal(client.address);
            expect(await lootbox.ownerOf(3)).to.equal(client.address);

            await bundle.unlock(1);

            //storage tests after unlock box 1
            expect((await bundle.connect(admin).getLootboxStorage(1)).length).to.equal(0);
            expect(await testERC721.ownerOf(1)).to.equal(client.address);
            expect(await lootbox.ownerOf(1)).to.equal(client.address);

            await bundle.unlock(2);

            //storage tests after unlock box 2
            let mintedERC20Balance: BigNumber = parseUnits('1.0', 27);
            expect((await bundle.connect(admin).getLootboxStorage(2)).length).to.equal(0);
            expect(await testERC20.balanceOf(client.address)).to.equal(mintedERC20Balance);
            expect(await lootbox.ownerOf(2)).to.equal(client.address);

            await bundle.unlock(3);

            //storage tests after unlock box 3
            let mintedERC1155Balance: BigNumber = parseUnits('1.0', 2);
            expect(await testERC1155.balanceOf(bundle.address, 1)).to.equal(0);
            expect((await bundle.connect(admin).getLootboxStorage(3)).length).to.equal(0);
            expect(await testERC1155.balanceOf(client.address, 1)).to.equal(mintedERC1155Balance);
            expect(await lootbox.ownerOf(3)).to.equal(client.address);
        });

        it('set lootbox address', async () => {
            let newLootbox: ERC721Owl;

            const newLootboxAddress = await deployClone(ERC721, [admin.address, 'name', 'symb', 'uri'], ERC1167Factory);
            newLootbox = (await ethers.getContractAt('ERC721Owl', newLootboxAddress)) as ERC721Owl;

            const newMinterAutoIdAddress = await deployClone(
                minterAutoId,
                [
                    //admin address
                    //client address
                    bundleAddress,
                    newLootboxAddress,
                    admin.address,
                    0,
                    newLootboxAddress,
                ],
                ERC1167Factory,
            );

            const newMinterAutoId = (await ethers.getContractAt(
                'MinterAutoId',
                newMinterAutoIdAddress,
            )) as MinterAutoId;

            console.log('one', await newMinterAutoId.owner());

            await bundle.lock([
                {
                    token: TokenType.erc721,
                    contractAddr: testERC721.address,
                    tokenId: 1,
                    amount: 1,
                },
            ]);
            console.log('two', await newMinterAutoId.owner());

            await bundle.connect(admin).setLootboxAddress(newMinterAutoIdAddress);
            await newLootbox.connect(admin).grantMinter(newMinterAutoIdAddress);
            await bundle.lock([
                {
                    token: TokenType.erc1155,
                    contractAddr: testERC1155.address,
                    tokenId: 1,
                    amount: 50,
                },
            ]);

            //storage tests after lock
            expect(await testERC721.ownerOf(1)).to.equal(bundle.address);
            expect(await testERC1155.balanceOf(bundle.address, 1)).to.equal(50);
            expect(await lootbox.ownerOf(4)).to.equal(client.address);
            expect(await newLootbox.ownerOf(5)).to.equal(client.address);

            await bundle.unlock(4);

            //storage tests after unlocking lootbox 4
            expect(await testERC721.ownerOf(1)).to.equal(client.address);
            expect((await bundle.connect(admin).getLootboxStorage(4)).length).to.equal(0);
            expect(await lootbox.ownerOf(4)).to.equal(client.address);

            await bundle.unlock(5);
            //storage tests after unlocking newLootbox 5
            let mintedERC1155Balance: BigNumber = parseUnits('1.0', 2);
            expect(await testERC1155.balanceOf(bundle.address, 1)).to.equal(0);
            expect((await bundle.connect(admin).getLootboxStorage(5)).length).to.equal(0);
            expect(await testERC1155.balanceOf(client.address, 1)).to.equal(mintedERC1155Balance);
            expect(await newLootbox.ownerOf(5)).to.equal(client.address);
        });

        it('lock three different assets together', async () => {
            await bundle.lock([
                {
                    token: TokenType.erc20,
                    contractAddr: testERC20.address,
                    tokenId: 1,
                    amount: 100,
                },
                {
                    token: TokenType.erc721,
                    contractAddr: testERC721.address,
                    tokenId: 1,
                    amount: 1,
                },
                {
                    token: TokenType.erc1155,
                    contractAddr: testERC1155.address,
                    tokenId: 1,
                    amount: 50,
                },
            ]);

            //storage tests after lock
            expect(await testERC20.balanceOf(bundle.address)).to.equal(100);
            expect(await testERC721.ownerOf(1)).to.equal(bundle.address);
            expect(await testERC1155.balanceOf(bundle.address, 1)).to.equal(50);
            expect(await lootbox.ownerOf(6)).to.equal(client.address);

            await bundle.unlock(6);

            let mintedERC20Balance: BigNumber = parseUnits('1.0', 27);
            let mintedERC1155Balance: BigNumber = parseUnits('1.0', 2);

            //storage tests after unlocking lootbox 6
            expect(await testERC20.balanceOf(client.address)).to.equal(mintedERC20Balance);
            expect(await testERC721.ownerOf(1)).to.equal(client.address);
            expect(await testERC1155.balanceOf(client.address, 1)).to.equal(mintedERC1155Balance);
            expect((await bundle.connect(admin).getLootboxStorage(6)).length).to.equal(0);
            expect(await lootbox.ownerOf(6)).to.equal(client.address);
        });
    });
});
