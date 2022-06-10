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
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

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
