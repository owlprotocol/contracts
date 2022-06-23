import { ethers, web3 } from 'hardhat';
export const ERC721BeaconInstAddr = '0xb57a585Fce9C830eBF8B39447A6Db5d2e2b432e5';
export const ERC1155BeaconInstAddr = '0xd5c881E831b038DBfadb7cbB538Dcff565d023fA';
export const crafterTransferBeaconInstAddr = '0xB9564d2667DEBC2D8444aC70F130cC8aC7ACb9B4';

export const burnNonce = async (deployer: string, nonceToDeploy: number) => {
    if (process.env.PRIV_KEY === undefined) return;
    const nonce = await web3.eth.getTransactionCount(deployer);
    const wallet = new ethers.Wallet(process.env.PRIV_KEY, ethers.provider);

    if (nonce < nonceToDeploy) {
        for (let i = 0; i < nonceToDeploy - nonce; i++) {
            const sendTx = await wallet.sendTransaction({
                to: wallet.address,
                value: 1,
            });
            await sendTx.wait();
        }
    }
};

export const burn = true;
