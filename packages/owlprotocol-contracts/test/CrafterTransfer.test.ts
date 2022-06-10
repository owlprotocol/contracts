import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CrafterTransfer, CrafterTransfer__factory } from '../typechain';
import { createERC721 } from './utils';
import { ERC1167Factory__factory } from '../typechain/factories/ERC1167Factory__factory';
import { ERC1167Factory } from '../typechain/ERC1167Factory';

enum ConsumableType {
    unaffected,
    burned,
    locked,
}

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

describe('Crafter.sol', function () {
    // Extra time
    this.timeout(10000);

    let owner: SignerWithAddress;

    let CrafterTransferFactory: CrafterTransfer__factory;
    let CrafterTransferImplementation: CrafterTransfer;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    before(async () => {
        // Launch Crafter + implementation
        CrafterTransferFactory = (await ethers.getContractFactory('CrafterTransfer')) as CrafterTransfer__factory;
        CrafterTransferImplementation = await CrafterTransferFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), CrafterTransferImplementation.deployed()]);

        // Get users
        [owner] = await ethers.getSigners();
    });

    it('1 ERC721 -> 1 ERC721', async () => {
        //Deploy ERC721
        const [inputERC721, outputERC721] = await createERC721(2);
        //Crafter Data
        const burnAddress = '0x0000000000000000000000000000000000000001';
        const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
            owner.address,
            burnAddress,
            1,
            //Input any token id, input burned
            [
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.burned,
                    contractAddr: inputERC721.address,
                    amounts: [],
                    tokenIds: [],
                },
            ],
            //Output specific token id, output unaffected
            [
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.unaffected,
                    contractAddr: outputERC721.address,
                    amounts: [],
                    tokenIds: [1],
                },
            ],
        ]);

        //Predict address
        const salt = ethers.utils.formatBytes32String('');
        const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
            CrafterTransferImplementation.address,
            salt,
            CrafterTransferData,
        );

        //Set Approval ERC721 Output
        await outputERC721.connect(owner).approve(CrafterTransferAddress, 1);

        //Deploy Crafter craftableAmount=1
        //Check balances
        //Clone deterministic
        await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);
        const crafter = await ethers.getContractAt('CrafterTransfer', CrafterTransferAddress);
        //Storage tests
        //Assert transferred
        expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
        expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);

        //Craft 1
        await inputERC721.connect(owner).approve(CrafterTransferAddress, 1);
        await crafter.craft(1, [[1]]);
        //Check balances
        expect(await inputERC721.ownerOf(1)).to.equal(burnAddress);
        expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
    });
});
