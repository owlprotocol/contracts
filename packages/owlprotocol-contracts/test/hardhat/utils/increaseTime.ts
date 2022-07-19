import { BigNumberish } from 'ethers';
import { ethers } from 'hardhat';

async function increaseTime(value: BigNumberish) {
    if (!ethers.BigNumber.isBigNumber(value)) {
        value = ethers.BigNumber.from(value);
    }
    await ethers.provider.send('evm_increaseTime', [value.toNumber()]);
    await ethers.provider.send('evm_mine', []);
}

export default increaseTime;
