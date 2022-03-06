import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configureGanache from '../../../utils/configureGanache';
import setProvider from '../../../utils/setProvider';
import MinterSimple from '../../../truffle/MinterSimple';
import FactoryERC20Truffle from '../../../truffle/FactoryERC20';
import FactoryERC721Truffle from '../../../truffle/FactoryERC721';

import { parseSpecies } from '../../../nft-launcher-lib/Minter';

chai.use(chaiAsPromised);
const { assert, expect } = chai;

describe('MinterCore tests', function () {
    let accounts: string[];
    let owner: string;
    let developer: string;

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([MinterSimple], config.provider, accounts[0]);
        setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
        setProvider([FactoryERC721Truffle], config.provider, accounts[0]);

        owner = accounts[0];
        developer = accounts[2];
    });

    it('MinterCore species management / minting', async () => {
        // MinterSimple can be used as a substitute for
        // MinterCore, as MinterSimple just exposes the
        // internal minting functions.
        const minter = await MinterSimple.new();
        const nft = await FactoryERC721Truffle.new('NFT', 'NFT');
        const erc20 = await FactoryERC20Truffle.new('0', 'ERC', 'ERC');
        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer;
        const mintFeeAmount = 10;

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Event testing
        let event = await minter.getPastEvents('CreateSpecies');
        assert.equal(event[0].returnValues.speciesId, 1, 'CreateSpecies event created');

        // Parse species
        const species = parseSpecies(await minter.getSpecies('1'));
        assert.equal(species.contractAddr, speciesAddress, 'species address mismatch!');
        assert.equal(species.owner, owner, 'species owner issue!');
        assert.equal(species.mintFeeAddress, mintFeeAddress);
        assert(species.mintFeeAmount.eqn(mintFeeAmount));
        assert.equal(species.mintFeeToken, mintFeeToken);

        // Species doens't exist
        let call = minter.mint('2', '1');
        expect(call).eventually.to.rejectedWith(Error);

        // Authorize transfer
        await erc20.increaseAllowance(minter.address, '20');

        // Mint Specimen
        await minter.mint('1', '1');

        // SafeMint Specimen
        await minter.safeMint('1', '2');

        // Funds transferred
        assert((await erc20.balanceOf(developer)).eqn(20), 'balance not transferred!');

        // Not enough funds
        call = minter.safeMint('1', '3');
        expect(call).eventually.to.rejectedWith(Error);

        // Mint Event
        event = await minter.getPastEvents('MintSpecies');
        assert.equal(event[0].returnValues.tokenId, 2, 'Specimen minted!');
    });
});
