//@ts-nocheck
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert } from 'chai';
import { ethers } from 'hardhat';
import { FactoryERC1155__factory } from '../../typechain';

let FactoryERC1155: FactoryERC1155__factory;

describe('FactoryERC1155.sol', function () {
    let owner: SignerWithAddress;
    let user: SignerWithAddress;

    const mintAmount: string[] = [];
    const coinName = 'TESTCOIN';

    before(async () => {
        FactoryERC1155 = await ethers.getContractFactory('FactoryERC1155');

        [owner, user] = await ethers.getSigners();
    });

    it('FactoryERC1155.mint(...)', async () => {
        // Create contract object
        const testERC20 = await FactoryERC1155.deploy(coinName, mintAmount);
        await testERC20.deployed();

        const balOwner = await testERC20.balanceOf(owner.address, 1);
        const balUser = await testERC20.balanceOf(user.address, 1);

        assert.notEqual(String(balOwner), String(0), 'Owner minting failed!');
        assert.equal(String(balUser), String(0), 'User minting failed!');
    });

    it('Helper function generation', async () => {
        const contracts = await createERC1155(3);
        assert.equal(contracts.length, 3, 'factory created contracts');

        for (let i = 0; i < contracts.length; i++) {
            assert(!(await contracts[i].balanceOf(owner.address, 1)).eq(0));
        }
    });
});

