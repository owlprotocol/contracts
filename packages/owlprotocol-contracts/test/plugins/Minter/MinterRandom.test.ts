// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { expect } from 'chai';
// import { ethers } from 'hardhat';
// import { FactoryERC20__factory, FactoryERC721__factory, MinterRandom__factory } from '../../../../typechain';

// describe('MinterRandom.sol', function () {
//     let accounts: SignerWithAddress[];
//     let developer: SignerWithAddress;

//     let MinterRandom: MinterRandom__factory;
//     let FactoryERC20: FactoryERC20__factory;
//     let FactoryERC721: FactoryERC721__factory;

//     before(async () => {
//         MinterRandom = await ethers.getContractFactory('MinterRandom');
//         FactoryERC20 = await ethers.getContractFactory('FactoryERC20');
//         FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

//         accounts = await ethers.getSigners();
//         developer = accounts[2];
//     });

//     it('MinterRandom.mint(...)', async () => {
//         const minter = await MinterRandom.deploy();
//         const nft = await FactoryERC721.deploy('NFT', 'NFT');
//         const erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
//         await Promise.all([minter.deployed(), nft.deployed(), erc20.deployed()]);

//         const speciesAddress = nft.address;
//         const mintFeeToken = erc20.address;
//         const mintFeeAddress = developer.address;
//         const mintFeeAmount = 10;

//         // Create species
//         await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount);

//         // Authorize transfer
//         await erc20.increaseAllowance(minter.address, '20');

//         // Mint Specimen
//         await expect(minter.mint('1')).to.emit(minter, 'MintSpecies');

//         // SafeMint Specimen
//         await minter.safeMint('1');
//     });
// });
