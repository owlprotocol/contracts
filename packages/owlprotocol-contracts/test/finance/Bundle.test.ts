import { ethers, network } from 'hardhat';
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

import { createERC20, createERC721, createERC1155 } from '../utils';
import { BigNumber } from 'ethers';
import { pick } from 'lodash';
import { ERC721Owl__factory } from '../../typechain';
import { ERC721Owl } from '../../typechain';

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

const salt = ethers.utils.formatBytes32String('1');

describe('Bundle.sol', function () {
    //Extra time
    this.timeout(100000);
    let client: SignerWithAddress;
    let admin: SignerWithAddress;

    let BundleFactory: Bundle__factory;
    let BundleImplementation: Bundle;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let MinterAutoIdFactory: MinterAutoId__factory;
    let MinterAutoId: MinterAutoId;

    let ERC721Factory: ERC721Owl__factory;
    let ERC721: ERC721Owl;

    before(async () => {
        //launch Auction + implementation
        BundleFactory = (await ethers.getContractFactory('Bundle')) as Bundle__factory;
        BundleImplementation = await BundleFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        MinterAutoIdFactory = (await ethers.getContractFactory('MinterAutoId')) as MinterAutoId__factory;
        MinterAutoId = await MinterAutoIdFactory.deploy();

        ERC721Factory = (await ethers.getContractFactory('ERC721')) as ERC721Owl__factory;
        ERC721 = await ERC721Factory.deploy();

        await Promise.all([ERC1167Factory.deployed(), BundleImplementation.deployed()]);

        //get users (seller + bidder?)
        [client, admin] = await ethers.getSigners();
    });

    describe('No fee tests', () => {
        //define setup
        let lootbox: ERC721;
        let testERC721: ERC721;
        let testERC20: ERC20;
        let testERC1155: ERC1155;
        let BundleAddress: string;
        let MinterAutoIdAddress: string;
        let bundle: Bundle;
        let minterAutoId: MinterAutoId;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [testERC20] = await createERC20(1);
            [testERC721] = await createERC721(1, 2);
            [testERC1155] = await createERC1155(1);

            const ERC721Data = ERC721Owl.interface.encodeFunctionData('initialize', [admin.address]);

            //Bundle Data
            const MinterAutoIdData = MinterAutoId.interface.encodeFunctionData('initialize', [
                //admin address
                //client address
                admin.address,
                testERC721.address,
                admin.address,
                0,
                lootbox.address,
            ]);

            //Predict address
            MinterAutoIdAddress = await ERC1167Factory.predictDeterministicAddress(
                MinterAutoId.address,
                salt,
                MinterAutoIdData,
            );

            //deploy bundle
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(MinterAutoId.address, salt, MinterAutoIdData);
            minterAutoId = (await ethers.getContractAt('MinterAutoId', MinterAutoIdAddress)) as MinterAutoId;

            //Bundle Data
            const BundleData = BundleImplementation.interface.encodeFunctionData('initialize', [
                //admin address
                //client address
                admin.address,
                client.address,
                MinterAutoIdAddress,
            ]);

            //Predict address
            BundleAddress = await ERC1167Factory.predictDeterministicAddress(
                BundleImplementation.address,
                salt,
                BundleData,
            );

            //Set Approval ERC721 for sale
            await testERC20.connect(client).approve(BundleAddress, parseUnits('100.0', 18));
            await testERC721.connect(client).approve(BundleAddress, 1);
            await testERC1155.connect(client).setApprovalForAll(BundleAddress, true);

            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);

            //deploy bundle
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(BundleImplementation.address, salt, BundleData);
            bundle = (await ethers.getContractAt('Bundle', BundleAddress)) as Bundle;

            //assert initial token amounts

            expect(await lootbox.balanceOf(client.address)).to.equal(1);
            expect(await testERC20.balanceOf(client.address)).to.equal(totalERC20Minted);
            expect(await testERC721.balanceOf(client.address)).to.equal(1);
            //expect(await testERC1155.balanceOf(client.address)).to.equal(1);
            //storage tests
        });

        it('simple bundle - 1 bidder', async () => {
            console.log('yee');

            await bundle.lock([
                {
                    token: TokenType.erc721,
                    contractAddr: testERC721.address,
                    tokenId: 1,
                    amount: 1,
                },
            ]);

            console.log('hi');

            const storage = await bundle.getLootboxStorage(1);
            console.log('hey');

            expect(storage.length).to.equal(1);

            // expect(pick(storage[0], ['token', 'contractAddr', 'tokenId', 'amount'])).to.deep.equal({
            //     token: TokenType.erc721,
            //     contractAddr: testERC721.address,
            //     tokenId: 1,
            //     amount: 1,
            // });
        });

        // it('simple bundle - no bidder, bundle ends', async () => {
        //     //await bundle.withdraw();
        //     await bundle.start();

        //     expect(await testNFT.balanceOf(bundle.address)).to.equal(1);
        //     expect(await testNFT.balanceOf(seller.address)).to.equal(0);

        //     await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
        //     await network.provider.send('evm_mine');
        //     await bundle.claim();

        //     expect(await testNFT.balanceOf(seller.address)).to.equal(1);
        //     expect(await testNFT.balanceOf(bundle.address)).to.equal(0);
        // });

        // it('error: bid after bundle ends', async () => {
        //     const tx = await bundle.start();
        //     await tx.wait();

        //     await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
        //     await network.provider.send('evm_mine');

        //     await expect(bundle.connect(buyer).buy()).to.be.revertedWith('Bundle: ended');
        // });
    });
});
