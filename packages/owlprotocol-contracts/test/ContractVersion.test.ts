import { ethers } from 'hardhat';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { expect } from 'chai';

describe('Contract Version Testing', async () => {
    const assertCorrectVersion = async (name: string, contractVersion = 'v0.1') => {
        // Get contract factory
        const factory = await ethers.getContractFactory(name);
        const contract = await factory.deploy({ gasLimit: 30_000_000 });
        const version = await contract.version();
        expect(version, `${name}/${contractVersion} incorrect!`).to.equal(contractVersion);
        // console.log(`Version: ${name}/${version}`);
    };

    it('Contract Versioning', async () => {
        const contracts = [
            'ERC1155Owl',
            'ERC20Owl',
            'ERC721Owl',
            'ERC721OwlAttributes',
            // 'RentableERC721Owl',
            // 'Bundle',
            // 'DutchAuction',
            // 'EnglishAuction',
            // 'FixedPriceAuction',
            // 'Rent',
            'CrafterMint',
            'CrafterTransfer',
            // 'MinterAutoId',
            // 'MinterBreeding',
            // 'MinterRandom',
            // 'MinterSimple',
        ];

        const correctVersion = contracts.map((c) => assertCorrectVersion(c));
        await Promise.all(correctVersion);
    });
});
