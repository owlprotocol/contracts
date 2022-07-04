import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import {
    Crafter__factory,
    FactoryERC20__factory,
    FactoryERC721__factory,
    MinterAutoId__factory,
    MinterSimple__factory,
} from '../../../typechain';

describe('OpenZeppelinUpgradable', function () {
    let accounts: SignerWithAddress[];
    let owner: SignerWithAddress;
    let developer: SignerWithAddress;

    let MinterSimpleFactory: MinterSimple__factory;
    let MinterAutoIdFactory: MinterAutoId__factory;
    let CrafterFactory: Crafter__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    before(async () => {
        MinterSimpleFactory = await ethers.getContractFactory('MinterSimple');
        MinterAutoIdFactory = await ethers.getContractFactory('MinterAutoId');
        CrafterFactory = await ethers.getContractFactory('Crafter');
        FactoryERC20 = await ethers.getContractFactory('FactoryERC20');
        FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

        accounts = await ethers.getSigners();
        owner = accounts[0];
        developer = accounts[2];
    });

    it('MinterSimple.sol -> MinterAutoId.sol', async () => {
        // Deploy contracts
        let minter = await upgrades.deployProxy(MinterSimpleFactory);
        const nft = await FactoryERC721.deploy('NFT', 'NFT');
        const erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([minter.deployed(), nft.deployed(), erc20.deployed()]);

        const speciesAddress = nft.address;
        const mintFeeToken = erc20.address;
        const mintFeeAddress = developer.address;
        const mintFeeAmount = 10;

        // Create species
        await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

        // Authorize transfer
        await erc20.increaseAllowance(minter.address, '20');

        // Mint Specimen
        await expect(minter.mint('1', '100'))
            // Event
            .to.emit(minter, 'MintSpecies')
            .withArgs('1', owner.address, '100');

        // Upgrade to AutoId
        minter = await upgrades.upgradeProxy(minter.address, MinterAutoIdFactory);

        // Mint Specimen (auto id)
        await expect(minter.mint('1'))
            // Event
            .to.emit(minter, 'MintSpecies')
            .withArgs('1', owner.address, '1');
    });

    it('Crafter.sol -> Crafter.sol', async () => {
        // Deploy contracts
        let crafter = await upgrades.deployProxy(CrafterFactory);
        await crafter.deployed();

        // Upgrade to AutoId
        crafter = await upgrades.upgradeProxy(crafter.address, CrafterFactory);
    });
});
