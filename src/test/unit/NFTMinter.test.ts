// import chai from 'chai';
// import chaiAsPromised from 'chai-as-promised';
// import configureGanache from '../../utils/configureGanache';
// import setProvider from '../../utils/setProvider';
// import NFTMinterTruffle from '../../truffle/NFTMinter';
// import NFTMinterMintableTruffle from '../../truffle/Mintable';
// import FactoryERC20Truffle from '../../truffle/FactoryERC20';
// import FactoryERC721Truffle from '../../truffle/FactoryERC721';
// import { toHex } from 'web3-utils';

// import { SpeciesFeatures, parseSpecies, parseSpecimen } from '../../nft-launcher-lib/NFTMinter';
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
//         setProvider([NFTMinterMintableTruffle], config.provider, accounts[0]);
//         setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
//         setProvider([FactoryERC721Truffle], config.provider, accounts[0]);

//         owner = accounts[0];
//         user = accounts[1];
//     });

//     it('Create species / generate DNA', async () => {
//         const minter = await NFTMinterTruffle.new();
//         const speciesName = toHex('myspecies');
//         const speciesAddress = '0x0000000000000000000000000000000000000001';

//         const speciesFeatures: Array<SpeciesFeatures> = [
//             {
//                 name: toHex('color').padEnd(66, '0'),
//                 minValue: '0',
//                 maxValue: '255',
//             },
//             {
//                 name: toHex('hair').padEnd(66, '0'),
//                 minValue: '0',
//                 maxValue: '3',
//             },
//             {
//                 name: toHex('shoes').padEnd(66, '0'),
//                 minValue: '0',
//                 maxValue: '10',
//             },
//         ];

//         // Bad Address
//         let call = minter.createSpecies(speciesName, '0x0000000000000000000000000000000000000000', speciesFeatures);
//         expect(call).eventually.to.rejectedWith(Error);

//         // Create species
//         await minter.createSpecies(speciesName, speciesAddress, speciesFeatures);

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

//     it('Mintable Species Extension', async () => {
//         const minter = await NFTMinterMintableTruffle.new();
//         const [nft1, nft2] = await createERC721(2, 0);
//         const [token1] = await createERC20(1);

//         const speciesName = toHex('myspecies');
//         const tokenAmount = '100';
//         const startingTokenId = '0';
//         const endingTokenId = '3';

//         const speciesFeatures: Array<SpeciesFeatures> = [
//             {
//                 name: toHex('color').padEnd(66, '0'),
//                 minValue: '0',
//                 maxValue: '255',
//             },
//             {
//                 name: toHex('hair').padEnd(66, '0'),
//                 minValue: '0',
//                 maxValue: '3',
//             },
//             {
//                 name: toHex('shoes').padEnd(66, '0'),
//                 minValue: '0',
//                 maxValue: '10',
//             },
//         ];

//         // Create species
//         await minter.createSpecies(speciesName, nft1.address, speciesFeatures);

//         // Set Pricing
//         await minter.setSpeciesMintPrice('1', token1.address, tokenAmount, startingTokenId, endingTokenId);
//         const event = await minter.getPastEvents('SetSpeciesMintPrice');
//         assert.equal(event[0].returnValues.speciesId, 1, 'species mint price');
//         assert.equal(event[0].returnValues.erc20TokenAddress, token1.address, 'token address mismatch');
//         assert.equal(event[0].returnValues.erc20TokenAmount, tokenAmount, 'token amount mismatch');

//         // Set pricing without permission
//         let call = minter.setSpeciesMintPrice('1', token1.address, tokenAmount, startingTokenId, endingTokenId, {
//             from: user,
//         });
//         expect(call).eventually.to.rejectedWith(Error);

//         // Purchase NFT
//         await token1.increaseAllowance(minter.address, tokenAmount);
//         await minter.mintSpecimen('1');
//         assert((await token1.balanceOf(minter.address)).eqn(100), 'erc20 tokens not transferred!');

//         // Purchase NFT on non-existing species
//         call = minter.mintSpecimen('100');
//         expect(call).eventually.to.rejectedWith(Error);

//         // Get details on our new specimen
//         const specimen = parseSpecimen(await minter.getSpecimen('1', '0'));
//         assert.equal(specimen.features.length, speciesFeatures.length, 'species not generated!');
//         assert.notEqual(specimen.createdBlock, '0', 'species not created!');

//         // Create a new species + w/ different user
//         await minter.createSpecies(speciesName, nft2.address, speciesFeatures, { from: user });
//         await minter.setSpeciesMintPrice('2', token1.address, tokenAmount, startingTokenId, endingTokenId, {
//             from: user,
//         });
//         await token1.transfer(user, 100 * 10);
//         await token1.increaseAllowance(minter.address, tokenAmount, { from: user });
//         await minter.mintSpecimen('2', { from: user });
//         assert((await token1.balanceOf(minter.address)).eqn(200), 'erc20 tokens not transferred (user)!');

//         // Withdraw coins
//         const beforeBal = await token1.balanceOf(owner);
//         await minter.withdrawTokens('1');
//         assert(beforeBal.addn(100).eq(await token1.balanceOf(owner)), 'balance withdrewn');

//         // Withdraw from wrong user
//         call = minter.withdrawTokens('1', { from: user });
//         expect(call).eventually.to.rejectedWith(Error);

//         // Withdraw from other user
//         await minter.withdrawTokens('2', { from: user });
//         assert((await token1.balanceOf(minter.address)).eqn(0), 'balance not transferred to user');

//         // Text exhaust tokenIds
//         await token1.increaseAllowance(minter.address, Number(tokenAmount) * 10, { from: user });
//         await minter.mintSpecimen('1', { from: user });
//         await minter.mintSpecimen('1', { from: user });
//         await minter.mintSpecimen('1', { from: user });

//         call = minter.mintSpecimen('1', { from: user });
//         expect(call).eventually.to.rejectedWith(Error);
//     });
// });
