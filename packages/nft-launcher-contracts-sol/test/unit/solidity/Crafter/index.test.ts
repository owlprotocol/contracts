import { ethers } from 'hardhat';
import { Crafter__factory } from '../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import Recipes from './Recipes.test';
import Materials from './Materials.test';
import Crafting from './Crafting.test';

describe('Crafter.sol', function () {
    // Extra time
    this.timeout(10000);

    let accounts: SignerWithAddress[];
    let owner: SignerWithAddress;
    let user: SignerWithAddress;

    let NFTCrafter: Crafter__factory;

    before(async () => {
        NFTCrafter = await ethers.getContractFactory('Crafter');

        accounts = await ethers.getSigners();
        owner = accounts[0];
        user = accounts[1];
    });

    // Must be called with `it` for the async variables to exist
    it('Crafting Test Modules', async () => {
        describe('Module: Crafting Logistics', async () => {
            Recipes(NFTCrafter, owner, user);
        });

        describe('Module: Crafting Materials', async () => {
            Materials(NFTCrafter, owner, user);
        });

        describe('Module: Crafting', async () => {
            Crafting(NFTCrafter, owner, user);
        });
    });
});
