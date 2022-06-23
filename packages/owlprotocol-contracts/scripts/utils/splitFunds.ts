import { ethers } from 'hardhat';
const { utils } = ethers;
const { formatUnits } = utils;

(async () => {
    const [orig, proxy] = await ethers.getSigners();
    const balance = await orig.getBalance();
    console.log(formatUnits(balance.div(2), 'ether'));
    console.log(formatUnits(await proxy.getBalance()), 'ether');

    await orig.sendTransaction({ to: proxy.address, value: balance.div(2) });
    console.log(formatUnits(await proxy.getBalance()), 'ether');
})();
