import { task } from 'hardhat/config';
import { AcceptEverythingPaymaster } from '../types';

task('configurePaymaster', 'Configures a deployed paymaster')
    .addParam('relayHub', 'address of relay hub')
    .addParam('forwarder', 'address of the forwarder')
    .setAction(async (args, hre) => {
        const { deployments, ethers } = hre;

        const { address } = await deployments.get('AcceptEverythingPaymaster');
        const paymaster = (await ethers.getContractAt(
            'AcceptEverythingPaymaster',
            address,
        )) as AcceptEverythingPaymaster;

        console.log({
            forwarder: args.forwarder,
            relay: args.relayHub,
        });

        await paymaster.setTrustedForwarder(args.forwarder);
        await paymaster.setRelayHub(args.relayHub);
    });

task('transferEth', 'transfers ether to the paymaster address')
    .addParam('amount', 'amount of eth to transfer')
    .setAction(async (args, hre) => {
        const { deployments, ethers } = hre;
        const [signer] = await ethers.getSigners();

        const { address } = await deployments.get('AcceptEverythingPaymaster');
        const paymaster = (await ethers.getContractAt(
            'AcceptEverythingPaymaster',
            address,
        )) as AcceptEverythingPaymaster;

        await signer.sendTransaction({ to: paymaster.address, value: args.amount });
    });
