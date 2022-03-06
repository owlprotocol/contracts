import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configureGanache from '../../../utils/configureGanache';
import setProvider from '../../../utils/setProvider';
import MinterSimple from '../../../truffle/MinterSimple';
import FactoryERC20Truffle from '../../../truffle/FactoryERC20';
import FactoryERC721Truffle from '../../../truffle/FactoryERC721';

chai.use(chaiAsPromised);
const { assert } = chai;

describe('MinterSimple tests', function () {
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

    it('MinterSimple testing', async () => {
        const minter = await MinterSimple.new();
        const nft = await FactoryERC721Truffle.new('NFT', 'NFT');
        const erc20 = await FactoryERC20Truffle.new('0', 'ERC', 'ERC');
        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer;
        const mintFeeAmount = 10;

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer
        await erc20.increaseAllowance(minter.address, '20');

        // Mint Specimen
        await minter.mint('1', '1');

        // SafeMint Specimen
        await minter.safeMint('1', '2');

        // Event testing
        const event = await minter.getPastEvents('MintSpecies');
        assert.equal(event[0].returnValues.speciesId, 1, 'Species minted');
        assert.equal(event[0].returnValues.to, owner, 'nft owner');
        assert.equal(event[0].returnValues.tokenId, '2', 'tokenId minted');
    });
});
