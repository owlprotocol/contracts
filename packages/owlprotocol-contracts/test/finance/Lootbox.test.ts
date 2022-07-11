import { ethers } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
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
} from '../../typechain';

import { createERC20, createERC721, createERC1155, deployClone } from '../utils';
import { BigNumber } from 'ethers';
import { ERC721Owl__factory } from '../../typechain';
import { ERC721Owl } from '../../typechain';
import { deploy } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { pick } from 'lodash';
import { parse } from 'path';
import { zeroAddress } from 'ethereumjs-util';

enum ConsumableType {
    unaffected,
    burned,
    locked,
}
enum TokenType {
    erc20,
    erc721,
    erc1155,
}

const salt = ethers.utils.formatBytes32String('1');

describe('Lootbox.sol', function () {
    //Extra time
    this.timeout(10000);
    let client: SignerWithAddress;
    let admin: SignerWithAddress;

    let lootboxImplementationFactory: Lootbox__factory;
    let lootboxImplementation: Lootbox;
    let lootboxImplementationAddress: string;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let crafterTransferFactory: CrafterTransfer__factory;
    let crafterTransfer: CrafterTransfer;
    let crafterTransferAddress: string;

    let crafterMintFactory: CrafterMint__factory;
    let crafterMint: CrafterMint;
    let crafterMintAddress: string;

    let ERC721Factory: ERC721Owl__factory;
    let ERC721: ERC721Owl;

    let lootbox: ERC721Owl;
    let lootboxAddress: string;

    before(async () => {
        //launch Auction + implementation
        lootboxImplementationFactory = (await ethers.getContractFactory('Lootbox')) as Lootbox__factory;
        lootboxImplementation = await lootboxImplementationFactory.deploy();

        crafterTransferFactory = (await ethers.getContractFactory('CrafterTransfer')) as CrafterTransfer__factory;
        crafterTransfer = await crafterTransferFactory.deploy();

        crafterMintFactory = (await ethers.getContractFactory('CrafterMint')) as CrafterMint__factory;
        crafterMint = await crafterMintFactory.deploy();

        ERC721Factory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721 = await ERC721Factory.deploy();

        await Promise.all([ERC1167Factory.deployed(), lootboxImplementation.deployed()]);

        //get users
        [client, admin] = await ethers.getSigners();
    });

    describe('Tests', () => {
        //define setup
        let testERC721: ERC721;
        let testERC20: ERC20;
        let testERC1155: ERC1155;

        beforeEach(async () => {
            //Get Lootbox
            lootboxAddress = await deployClone(ERC721, [admin.address, 'name', 'symb', 'uri'], ERC1167Factory);
            lootbox = (await ethers.getContractAt('ERC721Owl', lootboxAddress)) as ERC721Owl;

            //Deploy test ERC20, ERC721, and ERC1155 for use in CrafterTransfer
            [testERC20] = await createERC20(1);
            [testERC721] = await createERC721(1, 5);
            [testERC1155] = await createERC1155(1);

            //Get Crafter Contract Instances
            crafterTransferAddress = await deployClone(crafterTransfer, []);

            //Get lootboxImplementation instance
            lootboxImplementationAddress = await deployClone(
                lootboxImplementation,
                [
                    //admin address
                    //array of crafterContract addresses
                    //array of probabilities
                    admin.address,
                ],
                ERC1167Factory,
            );

            lootboxImplementation = (await ethers.getContractAt('Lootbox', lootboxImplementationAddress)) as Lootbox;

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

        it('simple bundle - 1 asset', async () => {});

        it('lock multiple lootboxes with different assets', async () => {});

        it('lock three different assets together', async () => {});
    });
});
