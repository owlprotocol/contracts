// import chai from 'chai';
// import chaiAsPromised from 'chai-as-promised';
// import configureGanache from '../../../utils/configureGanache';
// import setProvider from '../../../utils/setProvider';
// import NFTMinterTruffle from '../../../truffle/Minter';
// import FactoryERC20Truffle from '../../../truffle/FactoryERC20';
// import FactoryERC721Truffle from '../../../truffle/FactoryERC721';

// import { SpeciesFeatures, parseSpecies, parseSpecimen } from '../../../nft-launcher-lib/Minter';
// import { createERC721 } from './FactoryERC721.test';
// import { createERC20 } from './FactoryERC20.test';

// chai.use(chaiAsPromised);
// const { assert, expect } = chai;

// describe('NFTMinter', function () {
//     let accounts: string[];
//     let owner: string;
//     let user: string;

//     before(async () => {
//         const config = await configureGanache();
//         ({ accounts } = config);
//         setProvider([NFTMinterTruffle], config.provider, accounts[0]);
//         setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
//         setProvider([FactoryERC721Truffle], config.provider, accounts[0]);

//         owner = accounts[0];
//         user = accounts[1];
//     });

//     it('Create species / generate DNA', async () => {
//         const minter = await NFTMinterTruffle.new();
//         const speciesAddress = '0x0000000000000000000000000000000000000001';
//         const mintFeeToken = '0x0000000000000000000000000000000000000002';
//         const mintFeeAddress = '0x0000000000000000000000000000000000000003';
//         const mintFeeAmount = '0x0000000000000000000000000000000000000004';

//         const speciesFeatures: Array<SpeciesFeatures> = [
//             {
//                 minValue: '0',
//                 maxValue: '255',
//             },
//             {
//                 minValue: '0',
//                 maxValue: '3',
//             },
//             {
//                 minValue: '0',
//                 maxValue: '10',
//             },
//         ];

//         // Bad Address
//         let call = minter.createSpecies(
//             '0x0000000000000000000000000000000000000000',
//             mintFeeToken,
//             mintFeeAddress,
//             mintFeeAmount,
//             speciesFeatures,
//         );
//         expect(call).eventually.to.rejectedWith(Error);

//         // Create species
//         await minter.createSpecies(speciesAddress, mintFeeToken, mintFeeAddress, mintFeeAmount, speciesFeatures);

//         // Bad species permission
//         call = minter.registerSpecimen('1', '2', { from: user });
//         expect(call).eventually.to.rejectedWith(Error);

//         // Unexisting species
//         call = minter.registerSpecimen('2', '1', { from: user });
//         expect(call).eventually.to.rejectedWith(Error);

//         // Event testing
//         let event = await minter.getPastEvents('CreateSpecies');
//         assert.equal(event[0].returnValues.speciesId, 1, 'CreateSpecies event created');

//         // Parse species
//         const species = parseSpecies(await minter.getSpecies('1'));
//         assert.equal(species.contractAddr, speciesAddress, 'species address mismatch!');
//         assert.equal(species.owner, owner, 'species owner issue!');
//         assert.equal(species.speciesFeatures.length, speciesFeatures.length, 'species features mismatch!');

//         // Register Specimen
//         await minter.registerSpecimen('1', '2');
//         event = await minter.getPastEvents('RegisterSpecimen');
//         assert.equal(event[0].returnValues.tokenId, 2, 'RegisterSpecimen event created');

//         // Existing specimen
//         call = minter.registerSpecimen('1', '2');
//         expect(call).eventually.to.rejectedWith(Error);

//         // Register a second specimen
//         await minter.registerSpecimen('1', '3');

//         // Parse specimen
//         const specimen = parseSpecimen(await minter.getSpecimen('1', '2'));
//         assert.equal(specimen.features.length, speciesFeatures.length, 'species features not generated!');
//     });

//     it('Minting features', async () => {
//         const minter = await NFTMinterTruffle.new();
//         const [nft1, nft2] = await createERC721(2, 0);
//         const [token1] = await createERC20(1);

//         const mintFeeToken = token1.address;
//         const mintFeeAddress = owner;
//         const mintFeeAmount = '100';

//         const speciesFeatures: Array<SpeciesFeatures> = [
//             {
//                 minValue: '0',
//                 maxValue: '255',
//             },
//             {
//                 minValue: '0',
//                 maxValue: '3',
//             },
//             {
//                 minValue: '0',
//                 maxValue: '10',
//             },
//         ];

//         // Create species
//         await minter.createSpecies(nft1.address, mintFeeToken, mintFeeAddress, mintFeeAmount, speciesFeatures);

//         // Set Pricing
//         const event = await minter.getPastEvents('CreateSpecies');
//         assert.equal(event[0].returnValues.speciesId, 1, 'species mint price');
//         assert.equal(event[0].returnValues.mintFeeToken, token1.address, 'token address mismatch');
//         assert.equal(event[0].returnValues.mintFeeAmount, mintFeeAmount, 'token amount mismatch');
//         assert.equal(event[0].returnValues.mintFeeAddress, owner, 'mintFeeAddress issue!');

//         // Purchase NFT
//         await token1.increaseAllowance(minter.address, mintFeeAmount);
//         await minter.mintSpecimen('1');
//         await minter.registerMintedSpecimen('1', '0'); // TODO - this will be removed
//         assert.equal(await nft1.ownerOf('1'), owner, 'nft not minted correctly');
//         // assert((await token1.balanceOf(minter.address)).eqn(100), 'erc20 tokens not transferred!');

//         // Purchase NFT on non-existing species
//         const call = minter.mintSpecimen('100');
//         expect(call).eventually.to.rejectedWith(Error);

//         // Get details on our new specimen
//         const specimen = parseSpecimen(await minter.getSpecimen('1', '0'));
//         assert.equal(specimen.features.length, speciesFeatures.length, 'species not generated!');
//         assert.notEqual(specimen.createdBlock, '0', 'species not created!');

//         // Create a new species + w/ different user (mintFeeAddress=user)
//         await minter.createSpecies(nft2.address, mintFeeToken, user, mintFeeAmount, speciesFeatures, {
//             from: user,
//         });
//         // await token1.transfer(user, 100 * 10);
//         await token1.increaseAllowance(minter.address, mintFeeAmount);
//         await minter.mintSpecimen('2');
//         assert((await token1.balanceOf(user)).eqn(100), 'erc20 tokens not transferred (user)!');
//     });
// });
