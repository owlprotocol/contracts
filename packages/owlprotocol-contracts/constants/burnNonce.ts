import { ethers, web3 } from 'hardhat';

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
