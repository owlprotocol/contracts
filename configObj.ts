export const configObj = {
    solidity: '0.8.4',
    networks: {
        hardhat: {
            chainId: 1337,
        },
        rinkeby: {
            url: '',
            accounts: [],
        },
    },
    typechain: {
        outDir: 'typechain', //default
        target: 'truffle-v5', //All options: ethers-v5, web3-v1, truffle-v5
    },
};

export default configObj;
