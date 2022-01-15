import configureGanache from '../../utils/configureGanache';
import setProvider from '../../utils/setProvider';
import FactoryERC721Truffle from '../../truffle/FactoryERC721';
import { toBN } from 'web3-utils';
import { assert } from 'chai';

describe('TestERC721', function () {
    let accounts: string[];
    let owner: string;
    let user: string;

    const nftName = 'TESTNFT';
    const nftSymbol = 'TSTN';

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([FactoryERC721Truffle], config.provider, accounts[0]);

        owner = accounts[0];
        user = accounts[1];
    });

    it('TestERC721 Contract Minting', async () => {
        // Create contract object
        const testERC721 = await FactoryERC721Truffle.new(nftName, nftSymbol);

        // Give one to owner
        await testERC721.giveTokens(3, { from: owner });
        let tokenBal = await testERC721.balanceOf(owner);
        assert(tokenBal.eq(toBN(3)), 'Owner token minting failed!');

        // Make sure owner is the only one
        tokenBal = await testERC721.balanceOf(user);
        assert(tokenBal.eq(toBN(0)), 'Anonymous user has NFT!');
    });
});
