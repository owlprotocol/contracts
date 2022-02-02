// import chai from 'chai';
// import chaiAsPromised from 'chai-as-promised';
// import configureGanache from '../../utils/configureGanache';
// import setProvider from '../../utils/setProvider';
// import NFTBreederTruffle from '../../truffle/NFTBreeder';
// import FactoryERC20Truffle from '../../truffle/FactoryERC20';
// import FactoryERC721Truffle from '../../truffle/FactoryERC721';

// import { createERC721 } from './FactoryERC721.test';

// chai.use(chaiAsPromised);
// const { assert, expect } = chai;

// describe('NFTCrafter', function () {
//     let accounts: string[];
//     let owner: string;
//     let user: string;

//     before(async () => {
//         const config = await configureGanache();
//         ({ accounts } = config);
//         setProvider([NFTBreederTruffle], config.provider, accounts[0]);
//         setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
//         setProvider([FactoryERC721Truffle], config.provider, accounts[0]);

//         owner = accounts[0];
//         user = accounts[1];
//     });

//     it('Create / Breed species', async () => {
//         const breeder = await NFTBreederTruffle.new();
//         const [s1, s2] = await createERC721(2);

//         const speciesFeatures = {

//         }

//     });
// });
