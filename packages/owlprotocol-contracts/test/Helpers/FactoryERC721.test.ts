import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert } from 'chai';
import { ethers } from 'hardhat';
import { FactoryERC721__factory } from '../../typechain';

let FactoryERC721: FactoryERC721__factory;

describe('FactoryERC721.sol', function () {
    let owner: SignerWithAddress;
    let user: SignerWithAddress;

    const nftName = 'TESTNFT';
    const nftSymbol = 'TSTN';

    before(async () => {
        FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

        [owner, user] = await ethers.getSigners();
    });

    it('FactoryERC721.mintTokens(...)', async () => {
        // Create contract object
        const testERC721 = await FactoryERC721.deploy(nftName, nftSymbol);
        await testERC721.deployed();

        // Give one to owner
        await testERC721.mintTokens(3);
        let tokenBal = await testERC721.balanceOf(owner.address);
        assert(tokenBal.eq(3), 'Owner token minting failed!');

        // Make sure owner is the only one
        tokenBal = await testERC721.balanceOf(user.address);
        assert(tokenBal.eq(0), 'Anonymous user has NFT!');
    });

    it('Helper function generation', async () => {
        const contracts = await createERC721(3);
        assert.equal(contracts.length, 3, 'factory created contracts');

        for (const contract of contracts) {
            assert((await contract.balanceOf(owner.address)).eq(10));
        }
    });
});

// Creates + returns dummy ERC721 tokens for use in testing
export async function createERC721(tokens = 1, mintAmount = 10) {
    const nftName = 'TESTNFT';
    const nftSymbol = 'TNFT';
    const FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        contracts.push(FactoryERC721.deploy(nftName, nftSymbol));
    }
    const deployedContracts = await Promise.all(contracts);
    // Make sure all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));

    if (mintAmount) {
        const mints = [];
        for (let i = 0; i < tokens; i++) {
            //@ts-ignore
            mints.push(deployedContracts[i].mintTokens(mintAmount));
        }
        // Mint `mintAmount` nfts to each owner
        await Promise.all(mints);
    }

    return deployedContracts;
}
