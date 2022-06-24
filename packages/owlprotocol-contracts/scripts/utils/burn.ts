import { ethers, web3 } from 'hardhat';

const alignOn = 17;

(async () => {
    const [orig] = await ethers.getSigners();
    if (process.env.PRIV_KEY === undefined) return;
    const nonce = await web3.eth.getTransactionCount(orig.address);
    const wallet = new ethers.Wallet(process.env.PRIV_KEY, ethers.provider);

    if (nonce < alignOn) {
        for (let i = 0; i < alignOn - nonce; i++) {
            const sendTx = await wallet.sendTransaction({
                to: wallet.address,
                value: 1,
                gasPrice: 10000000000,
            });
            await sendTx.wait();
        }
    }
    console.log(await ethers.provider.getTransactionCount(orig.address));
})();
