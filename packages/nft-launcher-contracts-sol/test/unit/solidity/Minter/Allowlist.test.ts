import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import MerkleTree from 'merkletreejs';
import { keccak256, hexZeroPad } from 'ethers/lib/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    FactoryERC20__factory,
    FactoryERC721__factory,
    MinterSimpleMerkle__factory,
    MinterSimple__factory,
    MintGuardAllowlist__factory,
    MintGuardLimitedMints__factory,
    MintGuardMerkle__factory,
} from '../../../../typechain';

describe('IMintGuard.sol', function () {
    let accounts: SignerWithAddress[];
    let owner: SignerWithAddress;
    let developer: SignerWithAddress;

    let MinterSimple: MinterSimple__factory;
    let MinterSimpleMerkle: MinterSimpleMerkle__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;
    let MintGuardAllowlist: MintGuardAllowlist__factory;
    let MintGuardMerkle: MintGuardMerkle__factory;
    let MintGuardLimitedMints: MintGuardLimitedMints__factory;

    before(async () => {
        MinterSimple = await ethers.getContractFactory('MinterSimple');
        MinterSimpleMerkle = await ethers.getContractFactory('MinterSimpleMerkle');
        FactoryERC20 = await ethers.getContractFactory('FactoryERC20');
        FactoryERC721 = await ethers.getContractFactory('FactoryERC721');
        MintGuardAllowlist = await ethers.getContractFactory('MintGuardAllowlist');
        MintGuardMerkle = await ethers.getContractFactory('MintGuardMerkle');
        MintGuardLimitedMints = await ethers.getContractFactory('MintGuardLimitedMints');

        accounts = await ethers.getSigners();
        owner = accounts[0];
        developer = accounts[1];
    });

    it('MintGuardAllowlist.sol', async () => {
        const minter = await MinterSimple.deploy();
        const nft = await FactoryERC721.deploy('NFT', 'NFT');
        const erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        const mintGuard = await MintGuardAllowlist.deploy();
        // Wait for contracts to deploy
        await Promise.all([minter, nft, erc20, mintGuard].map((x) => x.deployed()));

        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer.address;
        const mintFeeAmount = 10;

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer
        await erc20.increaseAllowance(minter.address, '20');

        // Mint guard
        await minter.setMintGuard('1', mintGuard.address);

        // Mint denied
        await expect(minter.mint('1', '1')).to.be.revertedWith('Mint denied!');

        // Allow minting for owner
        await mintGuard.addAllowedUser(minter.address, '1', owner.address);

        // Mint Specimen
        await minter.mint('1', '1');

        // Non species owner cannot add to allowlist
        await expect(
            mintGuard.connect(developer).addAllowedUser(minter.address, '1', developer.address),
        ).to.revertedWith('Not the owner!');
    });

    it('MintGuardLimitedMints.sol', async () => {
        const minter = await MinterSimple.deploy();
        const nft = await FactoryERC721.deploy('NFT', 'NFT');
        const erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        const mintGuard = await MintGuardLimitedMints.deploy();
        // Wait for contracts to deploy
        await Promise.all([minter, nft, erc20, mintGuard].map((x) => x.deployed()));

        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer.address;
        const mintFeeAmount = 10;

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer
        await erc20.increaseAllowance(minter.address, '30');

        // Mint guard
        await minter.setMintGuard('1', mintGuard.address);

        // Mint denied
        await expect(minter.mint('1', '1')).to.be.revertedWith('Mint denied!');

        // Allow minting for owner
        await mintGuard.setUserMints(minter.address, '1', owner.address, 2);

        // Mint Specimen
        await minter.mint('1', '1');

        // Mint 2nd Specimen
        await minter.mint('1', '2');

        // Third call should fail
        await expect(minter.mint('1', '3')).to.be.revertedWith('Mint denied!');
    });

    it('MintGuardMerkle.sol', async () => {
        // Generate Merkle Proofs
        // Add 8 accounts (offset 1) to the merkle root
        const leaves = accounts.slice(1, 9).map((x) => hexZeroPad(x.address.toLowerCase(), 32));
        const tree = new MerkleTree(leaves, keccak256, {
            hashLeaves: true,
            sortPairs: true,
        });
        let root = tree.getRoot().toString('hex');
        const leaf = keccak256(leaves[0]);
        let proof = tree.getProof(leaf);
        assert(tree.verify(proof, leaf, root), 'valid proof returns false');

        const badLeaf = keccak256(accounts[0].address);
        //@ts-ignore
        const badProof = tree.getProof(badLeaf);
        assert(!tree.verify(badProof, leaf, root));

        // Test Minting
        const minter = await MinterSimpleMerkle.deploy();
        const nft = await FactoryERC721.deploy('NFT', 'NFT');
        const erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        const mintGuard = await MintGuardMerkle.deploy();
        // Wait for contracts to deploy
        await Promise.all([minter, nft, erc20, mintGuard].map((x) => x.deployed()));

        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer.address;
        const mintFeeAmount = 10;

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer
        await erc20.transfer(developer.address, '20');
        await erc20.connect(developer).increaseAllowance(minter.address, '20');

        // Mint guard
        await minter.setMintGuard('1', mintGuard.address);

        // Mint denied (wrong root)
        proof = proof.map((x) => '0x' + x.data.toString('hex'));
        await expect(minter.mint('1', '1', '0x' + 'a'.repeat(64), proof)).to.be.revertedWith('No permission set!');

        // Allow minting for owner
        root = '0x' + root;
        await mintGuard.addAllowedRoot(minter.address, '1', root);

        // Mint denied (wrong user)
        await expect(minter.mint('1', '1', root, proof)).to.be.revertedWith('Mint denied!');

        // Mint Specimen
        await minter.connect(developer).mint('1', '1', root, proof);

        // Non species owner cannot add to whitelist
        await expect(
            mintGuard.connect(developer).addAllowedRoot(minter.address, '1', keccak256(developer.address)),
        ).to.be.revertedWith('Not the owner!');
    });
});
