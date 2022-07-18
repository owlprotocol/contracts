import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('Contract Version Testing', async () => {
    const assertCorrectVersion = async (name: string, contractVersion = 'v0.1') => {
        // Get contract factory
        const factory = await ethers.getContractFactory(name);
        const contract = await factory.deploy();
        console.log(name)
        const version = contract.version ? await contract.version() : await contract.VERSION()
        expect(version, `${name}/${contractVersion} incorrect!`).to.equal(contractVersion);
        // console.log(`Version: ${name}/${version}`);
    };

    it('Contract Versioning', async () => {
        const contracts = [
            'ERC1155Owl',
            'ERC20Owl',
            'ERC721Owl',
            'ERC721OwlAttributes',
            'ERC721OwlExpiring',
            'DutchAuction',
            'EnglishAuction',
            'FixedPriceAuction',
            'Rent',
            'CrafterMint',
            'CrafterTransfer',
            'MinterAutoId',
            'MinterBreeding',
            'MinterRandom',
            'MinterSimple',
            'Lootbox',
        ];

        const correctVersion = contracts.map((c) => assertCorrectVersion(c));
        await Promise.all(correctVersion);
    });
});
