import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import MerkleTree from 'merkletreejs';
import { keccak256, hexZeroPad } from 'ethers/lib/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    FactoryERC20,
    FactoryERC20__factory,
    FactoryERC721,
    FactoryERC721__factory,
    MinterSimpleMerkle__factory,
    MinterSimpleMerkle,
} from '../../../../typechain';
import { deployClone, deployProxy } from '../../utils';

describe('MinterSimpleMerkle.sol', function () {
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let burnAddress: SignerWithAddress;
    let accounts: SignerWithAddress[];

    let MinterSimpleMerkleFactory: MinterSimpleMerkle__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let MinterImplementation: MinterSimpleMerkle;
    let erc20: FactoryERC20;

    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    let minter: MinterSimpleMerkle;

    before(async () => {
        // Deploy contracts
        MinterSimpleMerkleFactory = (await ethers.getContractFactory(
            'MinterSimpleMerkle',
        )) as MinterSimpleMerkle__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

        [owner, user, burnAddress] = await ethers.getSigners();
        accounts = await ethers.getSigners();

        MinterImplementation = await MinterSimpleMerkleFactory.deploy();
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([MinterImplementation.deployed(), erc20.deployed()]);

        mintFeeToken = erc20.address;
        mintFeeAddress = burnAddress.address;
        mintFeeAmount = 10;
    });

    describe('MinterSimpleMerkle.mint(...)', async () => {
        let tree;
        let root: string;
        let proof: any[];
        let badProof: any[];
        let nft: FactoryERC721;

        // Fresh minter for each test
        beforeEach(async () => {
            nft = await FactoryERC721.deploy('NFT', 'NFT');

            const { address } = await deployClone(
                MinterImplementation,
                [
                    owner.address,
                    mintFeeToken,
                    mintFeeAddress,
                    mintFeeAmount,
                    nft.address,
                    '0x' + 'a'.repeat(64), // dummy proof
                    '0x' + 'b'.repeat(64), // dummy uri
                    '0x' + '0'.repeat(40), // dummy forwarder
                ],
                undefined,
                undefined,
                'initialize(address,address,address,uint256,address,bytes32,string,address)',
            );

            minter = (await ethers.getContractAt('MinterSimpleMerkle', address)) as MinterSimpleMerkle;
        });

        // Generate proofs
        before(() => {
            // Add 8 accounts (offset 1) to the merkle root
            const leaves = accounts.slice(1, 9).map((x) => hexZeroPad(x.address.toLowerCase(), 32));
            tree = new MerkleTree(leaves, keccak256, {
                hashLeaves: true,
                sortPairs: true,
            });
            root = tree.getRoot().toString('hex');
            const leaf = keccak256(leaves[0]);

            // Generate proof and make it a string
            proof = tree.getProof(leaf);

            // Verify proof
            assert(tree.verify(proof, leaf, root), 'valid proof returns false');

            const badLeaf = keccak256(accounts[0].address);
            //@ts-ignore
            badProof = tree.getProof(badLeaf);
            assert(!tree.verify(badProof, leaf, root));

            // Make values Solidity-friendly
            proof = proof.map((x) => '0x' + x.data.toString('hex'));
            root = '0x' + root;
        });

        it('Bad proof', async () => {
            // Mint denied (bad proof)
            await expect(minter.connect(user)['mint(address,bytes32[])'](user.address, badProof)).to.be.revertedWith(
                'Not member of merkleTree!',
            );
        });

        it('Wrong user', async () => {
            await expect(minter['mint(address,bytes32[])'](user.address, proof)).to.be.revertedWith(
                'Not member of merkleTree!',
            );
        });

        it('Successful mint', async () => {
            // Authorize transfer
            await erc20.transfer(user.address, '10');
            await erc20.connect(user).increaseAllowance(minter.address, '10');

            // Set root
            await minter.updateMerkleRoot(root, '0xaaaa');

            // Mint Specimen
            await minter.connect(user)['mint(address,bytes32[])'](user.address, proof);
        });

        it('Successful safeMint', async () => {
            // Authorize transfer
            await erc20.transfer(user.address, '10');
            await erc20.connect(user).increaseAllowance(minter.address, '10');

            // Set root
            await minter.updateMerkleRoot(root, '0xaaaa');

            // Mint Specimen
            await minter.connect(user)['safeMint(address,bytes32[])'](user.address, proof);
        });

        it('Inherited mint disabled', async () => {
            await expect(minter['mint(address)'](owner.address)).to.be.revertedWith('Must include merkleProof');
        });

        it('Inherited safeMint disabled', async () => {
            await expect(minter['safeMint(address)'](owner.address)).to.be.revertedWith('Must include merkleProof');
        });
    });

    it('Beacon proxy initialization', async () => {
        const args = [
            owner.address,
            mintFeeToken,
            mintFeeAddress,
            mintFeeAmount,
            ethers.constants.AddressZero,
            '0x' + 'a'.repeat(64), // dummy proof
            '0x' + 'b'.repeat(64), // dummy uri
            ethers.constants.AddressZero, // dummy forwarder
        ];

        const initSig = 'proxyInitialize(address,address,address,uint256,address,bytes32,string,address)';
        const contract = (await deployProxy(owner.address, MinterImplementation, args, initSig)) as MinterSimpleMerkle;
        // Authorize transfer
        await contract.setNextTokenId(100);
    });
});
