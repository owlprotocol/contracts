import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configureGanache from '../../../src/utils/configureGanache';
import setProvider from '../../../src/utils/setProvider';
import MinterSimple from '../../../factory/truffle/MinterSimple';
import FactoryERC20Truffle from '../../../factory/truffle/FactoryERC20';
import FactoryERC721Truffle from '../../../factory/truffle/FactoryERC721';
import MintGuardAllowlistTruffle from '../../../factory/truffle/MintGuardAllowlist';
import MintGuardMerkleTruffle from '../../../factory/truffle/MintGuardMerkle';
import MinterSimpleMerkleTruffle from '../../../factory/truffle/MinterSimpleMerkle';
import MerkleTree from 'merkletreejs';
import { keccak256, hexZeroPad } from 'ethers/lib/utils';

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
        setProvider([MinterSimpleMerkleTruffle], config.provider, accounts[0]);
        setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
        setProvider([FactoryERC721Truffle], config.provider, accounts[0]);
        setProvider([MintGuardAllowlistTruffle], config.provider, accounts[0]);
        setProvider([MintGuardMerkleTruffle], config.provider, accounts[0]);

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

    it('MintGuardMerkle.sol', async () => {
        // Generate Merkle Proofs
        // Add 8 accounts (offset 1) to the merkle root
        const leaves = accounts.slice(1, 9).map((x) => hexZeroPad(x.toLowerCase(), 32));
        const tree = new MerkleTree(leaves, keccak256, {
            hashLeaves: true,
            sortPairs: true,
        });
        let root = tree.getRoot().toString('hex');
        const leaf = keccak256(leaves[0]);
        let proof = tree.getProof(leaf);
        assert(tree.verify(proof, leaf, root), 'valid proof returns false');

        const badLeaf = keccak256(accounts[0]);
        //@ts-ignore
        const badProof = tree.getProof(badLeaf);
        assert(!tree.verify(badProof, leaf, root));

        // Test Minting
        const minter = await MinterSimpleMerkleTruffle.new();
        const nft = await FactoryERC721Truffle.new('NFT', 'NFT');
        const erc20 = await FactoryERC20Truffle.new('0', 'ERC', 'ERC');
        const mintGuard = await MintGuardMerkleTruffle.new();

        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer;
        const mintFeeAmount = 10;

        console.log(`User: ${leaves[0]} | ${keccak256(leaves[0])}`);
        console.log(`keccak256: ${JSON.stringify(await minter.hashKeccakUser({ from: developer }))}`);

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer
        await erc20.transfer(developer, '20');
        await erc20.increaseAllowance(minter.address, '20', { from: developer });

        // Mint guard
        await minter.setMintGuard('1', mintGuard.address);

        // Mint denied
        proof = proof.map((x) => '0x' + x.data.toString('hex'));
        let call = minter.mint('1', '1', '0xabcd', proof);
        expect(call).eventually.to.rejectedWith(Error);

        // Allow minting for owner
        root = '0x' + root;
        await mintGuard.addAllowedRoot(minter.address, '1', root);

        // // Mint Specimen
        console.log(`Leaves: ${JSON.stringify(proof)}`);
        await minter.mint('1', '1', root, proof, { from: developer });

        // Non species owner cannot add to whitelist
        call = mintGuard.addAllowedRoot(minter.address, '1', developer, { from: developer });
        // await call;
        expect(call).eventually.to.rejectedWith(Error);
    });
});
