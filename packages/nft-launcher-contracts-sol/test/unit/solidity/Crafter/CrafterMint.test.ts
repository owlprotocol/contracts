import { ethers } from 'hardhat';
import { expect } from 'chai';
import { CrafterMint__factory, CrafterMint, ERC721Mintable__factory, ERC721Mintable } from '../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

enum ConsumableType {
    unaffected,
    burned,
    NTime,
}

describe('CrafterMint.sol', () => {
    let nftContrFactory: ERC721Mintable__factory;
    let leatherContr: ERC721Mintable;
    let beltContr: ERC721Mintable;
    let recipeCreator: SignerWithAddress;
    let recipeUser: SignerWithAddress;
    let accounts;

    let crafterMintContrFactory: CrafterMint__factory;
    let crafterMintContr: CrafterMint;

    before(async () => {
        accounts = await ethers.getSigners();
        [recipeCreator, recipeUser] = accounts;

        nftContrFactory = await ethers.getContractFactory('ERC721Mintable');
        leatherContr = await nftContrFactory.connect(recipeCreator).deploy('Leather', 'LTHR', 'uri');
        await leatherContr.deployed();
        beltContr = await nftContrFactory.connect(recipeCreator).deploy('Belt', 'BLT', 'uri');
        await beltContr.deployed();

        crafterMintContrFactory = await ethers.getContractFactory('CrafterMint');
        crafterMintContr = await crafterMintContrFactory.deploy();
    });

    it('create recipe then use recipe', async () => {
        //recipe creation
        const create = await crafterMintContr.connect(recipeCreator).createRecipe(
            [],
            [
                {
                    contractAddr: leatherContr.address,
                    consumableType: ConsumableType.NTime,
                },
            ],
            [],
            [
                {
                    contractAddr: beltContr.address,
                    ids: (() => {
                        const arr = [];
                        for (let i = 0; i < 10; i++) arr.push(i);
                        return arr;
                    })(),
                },
            ],
        );
        const { events } = await create.wait();
        const event = events ? events[0] : undefined;
        const id = event?.args?.recipeId;

        //mint leather
        const mintLeather1 = await leatherContr.connect(recipeCreator).mint(recipeUser.address, 5);
        await mintLeather1.wait();

        const mintLeather2 = await leatherContr.connect(recipeCreator).mint(recipeCreator.address, 6);
        await mintLeather2.wait();

        //grant CraftMint.sol access to minting
        const allowMint = await beltContr.connect(recipeCreator).grantMinter(crafterMintContr.address);
        await allowMint.wait();

        //recipe use
        const craft = await crafterMintContr.connect(recipeUser).craftForRecipe(id, [5]);
        await craft.wait();

        expect(await beltContr.ownerOf(9)).to.equal(recipeUser.address);
    });
});
