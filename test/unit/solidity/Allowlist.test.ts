import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configureGanache from '../../../src/utils/configureGanache';
import setProvider from '../../../src/utils/setProvider';
import MinterSimple from '../../../factory/truffle/MinterSimple';
import FactoryERC20Truffle from '../../../factory/truffle/FactoryERC20';
import FactoryERC721Truffle from '../../../factory/truffle/FactoryERC721';
import MintGuardAllowlistTruffle from '../../../factory/truffle/MintGuardAllowlist';
import MerkleTree from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';

chai.use(chaiAsPromised);
const { assert } = chai;

describe.only('MintGuard tests', function () {
    let accounts: string[];
    let owner: string;
    let developer: string;

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([MinterSimple], config.provider, accounts[0]);
        setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
        setProvider([FactoryERC721Truffle], config.provider, accounts[0]);
        setProvider([MintGuardAllowlistTruffle], config.provider, accounts[0]);

        owner = accounts[0];
        developer = accounts[1];
    });

    it('MintGuardAllowlist.sol', async () => {
        const minter = await MinterSimple.new();
        const nft = await FactoryERC721Truffle.new('NFT', 'NFT');
        const erc20 = await FactoryERC20Truffle.new('0', 'ERC', 'ERC');
        const mintGuard = await MintGuardAllowlistTruffle.new();

        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer;
        const mintFeeAmount = 10;

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer
        await erc20.increaseAllowance(minter.address, '20');

        // Mint guard
        await minter.setMintGuard('1', mintGuard.address);

        // Mint denied
        let call = minter.mint('1', '1');
        expect(call).eventually.to.rejectedWith(Error);

        // Allow minting for owner
        await mintGuard.addAllowedUser(minter.address, '1', owner);

        // Mint Specimen
        await minter.mint('1', '1');

        // Non species owner cannot add to whitelist
        call = mintGuard.addAllowedUser(minter.address, '1', developer, { from: developer });
        // await call;
        expect(call).eventually.to.rejectedWith(Error);
    });

    it('Merkletree Allowlist', async () => {
        const leaves = ['a', 'b', 'c'].map((x) => SHA256(x));
        const tree = new MerkleTree(leaves, SHA256);
        const root = tree.getRoot().toString('hex');
        const leaf = String(SHA256('a'));
        const proof = tree.getProof(leaf);
        assert(tree.verify(proof, leaf, root), 'valid proof returns false');

        const badLeaf = SHA256('x');
        //@ts-ignore
        const badProof = tree.getProof(badLeaf);
        assert(!tree.verify(badProof, leaf, root));

        // console.log(`Tree: ${tree.toString()}`);
    });
});
