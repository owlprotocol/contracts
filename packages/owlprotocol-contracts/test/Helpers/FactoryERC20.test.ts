//@ts-nocheck
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert } from 'chai';
import { ethers } from 'hardhat';
import { FactoryERC20__factory } from '../../typechain';

let FactoryERC20: FactoryERC20__factory;

describe('FactoryERC20.sol', function () {
    let owner: SignerWithAddress;
    let user: SignerWithAddress;

    const mintAmount = 0;
    const coinName = 'TESTCOIN';
    const coinTicker = 'TST';

    before(async () => {
        FactoryERC20 = await ethers.getContractFactory('FactoryERC20');

        [owner, user] = await ethers.getSigners();
    });

    it('FactoryERC20.mint(...)', async () => {
        // Create contract object
        const testERC20 = await FactoryERC20.deploy(mintAmount, coinName, coinTicker);
        await testERC20.deployed();

        const balOwner = await testERC20.balanceOf(owner.address);
        const balUser = await testERC20.balanceOf(user.address);

        assert.notEqual(String(balOwner), String(0), 'Owner minting failed!');
        assert.equal(String(balUser), String(0), 'User minting failed!');
    });

    it('Helper function generation', async () => {
        const contracts = await createERC20(3);
        assert.equal(contracts.length, 3, 'factory created contracts');

        for (let i = 0; i < contracts.length; i++) {
            assert(!(await contracts[i].balanceOf(owner.address)).eq(0));
        }
    });
});

// Creates + returns dummy ERC20 tokens for use in testing
export async function createERC20(tokens = 1) {
    const mintAmount = 0; // 0 => mints 1million to owner
    const coinName = 'TESTCOIN';
    const coinTicker = 'TST';
    const FactoryERC20 = await ethers.getContractFactory('FactoryERC20');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        contracts.push(FactoryERC20.deploy(mintAmount, coinName, coinTicker));
    }
    const deployedContracts = await Promise.all(contracts);
    // Assert all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));
    return deployedContracts;
}
