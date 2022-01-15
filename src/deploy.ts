// import FactoryERC20 from './truffle/FactoryERC20';
// import { getWeb3Default } from './utils/getWeb3';
// import setProvider from './utils/setProvider';
// import { toBN } from 'web3-utils';

// //Set Web3 provider
// export const contracts = {
//     FactoryERC20,
// };

// export async function deploy() {
//     const example = await FactoryERC20.new();
//     console.log('CONTRACTS DEPLOYED');
//     console.log({
//         example: example.address,
//     });
// }

// export async function main() {
//     const { web3, provider, account } = await getWeb3Default();
//     setProvider(Object.values(contracts), provider, account);

//     const balance = await web3.eth.getBalance(account);
//     if (toBN(balance).eq(toBN(0))) {
//         throw new Error(`${account} balance = 0! Make sure to get some ether.`);
//     } else {
//         try {
//             await deploy();
//         } catch (error) {
//             console.error(error);
//         }
//     }
// }

// if (typeof require !== 'undefined' && require.main === module) {
//     main()
//         .then(() => process.exit())
//         .catch((error) => console.error(error));
// }
