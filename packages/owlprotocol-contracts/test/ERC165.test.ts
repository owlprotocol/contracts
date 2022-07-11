import { ethers } from 'hardhat';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { expect } from 'chai';

describe('ERC165 Testing', async () => {
    const assertSupportsInterface = async (name: string, contractVersion = 'v0.1') => {
        // Get contract factory
        const factory = await ethers.getContractFactory(name);
        const contract = await factory.deploy({ gasLimit: 30_000_000 });
        const tag = toUtf8Bytes(`OWLProtocol://${name}/${contractVersion}`);
        const interfaceName = keccak256(tag).slice(0, 10);
        const supportsInt = await contract.supportsInterface(interfaceName);
        expect(supportsInt, `${name}/${contractVersion} does not support interface!`).to.be.true;
    };

    it('ERC165 Support Interface', async () => {
        const contracts = [
            'ERC1155Owl',
            'ERC20Owl',
            'ERC721Owl',
            'ERC721OwlExpiring',
            'Bundle',
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
        ];

        const supportsAll = contracts.map((c) => assertSupportsInterface(c));
        await Promise.all(supportsAll);
    });
});
