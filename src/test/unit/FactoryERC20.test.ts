import configureGanache from '../../utils/configureGanache';
import setProvider from '../../utils/setProvider';
import FactoryERC20Truffle from '../../truffle/FactoryERC20';
import { toBN } from 'web3-utils';
import { assert } from 'chai';

describe('FactoryERC20', function () {
    let accounts: string[];
    const mintAmount = 0;
    const coinName = 'TESTCOIN';
    const coinTicker = 'TST';

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
    });

    it('FactoryERC20 Contract Minting', async () => {
        // Create contract object
        const testERC20 = await FactoryERC20Truffle.new(mintAmount, coinName, coinTicker);

        const balOwner = await testERC20.balanceOf(accounts[0]);
        const balUser = await testERC20.balanceOf(accounts[1]);

        assert.notEqual(String(balOwner), String(toBN(0)), 'Owner minting failed!');
        assert.equal(String(balUser), String(toBN(0)), 'User minting failed!');
    });

    it('FactoryERC20 Generation Test', async () => {
        const contracts = await createERC20(3);
        assert.equal(contracts.length, 3, 'factory created contracts');
    });
});

export async function createERC20(tokens = 1) {
    const mintAmount = 0;
    const coinName = 'TESTCOIN';
    const coinTicker = 'TST';

    const deployedContracts = [];
    for (let i = 0; i < tokens; i++) {
        deployedContracts.push(await FactoryERC20Truffle.new(mintAmount, coinName, coinTicker));
    }

    return deployedContracts;
}
