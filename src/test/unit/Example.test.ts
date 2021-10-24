import { assert } from 'chai';
import { ethers } from 'ethers';
import { HD_WALLET_MNEMONIC } from '../../utils/environment';
import { configureGanacheMemo } from '../../utils/configureGanache';
import setProvider from '../../utils/setProvider';
import ExampleTruffle from '../../truffle/Example';
import ExampleWeb3 from '../../web3/Example';
import ExampleEthers from '../../ethers/Example';

describe('Example', function () {
    const mnemonic = HD_WALLET_MNEMONIC;

    let web3: Web3;
    let accounts: string[];

    before(async () => {
        const config = await configureGanacheMemo({ mnemonic });
        ({ web3, accounts } = config);
        setProvider([ExampleTruffle], config.provider, accounts[0]);
    });

    it('sum(): truffle contract', async () => {
        const example = await ExampleTruffle.new();
        assert.equal((await example.sum(1, 2)).toNumber(), 3, '1+2=3');
    });

    it('sum(): web3 contract', async () => {
        //@ts-ignore
        const tx = ExampleWeb3(web3).deploy(); //deploy() has {data} field as non-optional even though it is
        const gas = await tx.estimateGas();
        const example = await tx.send({ from: accounts[0], gas });

        assert.equal(await example.methods.sum(1, 2).call(), 3, '1+2=3');
    });

    it('sum(): ethers contract', async () => {
        const deployed = await ExampleTruffle.new(); //Deploy with Truffle
        const example = ExampleEthers.attach(deployed.address).connect(
            //@ts-ignore
            new ethers.providers.Web3Provider(web3.currentProvider),
        );

        assert.equal((await example.sum(1, 2)).toNumber(), 3, '1+2=3');
    });
});
