import { assert } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/cli/dist/GsnTestEnvironment';
import Web3 from 'web3';
import type { Contract as Web3Contract } from 'web3-eth-contract';
import { ethers } from 'hardhat'; //HH-connected ethers
import ERC721OwlGSNArtifact from '../../artifacts/contracts/assets/ERC721/ERC721OwlGSN.sol/ERC721OwlGSN.json';
import { ERC721OwlGSN as Web3ERC721OwlGSN } from '../../types/web3/ERC721OwlGSN';
import { ERC721OwlGSN, ERC721OwlGSN__factory, ERC1167Factory, ERC1167Factory__factory } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HttpProvider } from 'web3-core';
import { deployClone } from '../utils';
import { TransactionConfig } from 'web3-core';
import { hexlify, toUtf8Bytes } from 'ethers/lib/utils';
import { Transaction } from '@ethereumjs/tx';
import { Contract } from 'web3-eth-contract';
import { RelayProvider } from '@opengsn/provider';
import { AccountManager } from '@opengsn/provider/dist/AccountManager';

const salt = ethers.utils.formatBytes32String('1');

describe.only('ERC721OwlGSN', () => {
    let ERC721OwlGSNFactory: ERC721OwlGSN__factory;
    let ERC721OwlGSNImplementation: ERC721OwlGSN;
    let OwlGSN: ERC721OwlGSN;

    let signer1: SignerWithAddress; //original owner of ERC721Owl
    let signer2: SignerWithAddress; //owner after mint

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let gsn: TestEnvironment;
    // let gsnProvider: HttpProvider;
    let web3: Web3;

    //Run GSN Tests here
    //Use account1 as account0 is used as relayer
    //Use Web3.js as better suited for provider
    before(async () => {
        //Setup Test Environment
        gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
        //@ts-ignore
        // const provider = gsn.relayProvider;

        const config = {
            paymasterAddress: gsn.contractsDeployment.paymasterAddress,
            loggerConfiguration: {
                logLevel: 'debug',
            },
            preferredRelays: [gsn.relayUrl],
            auditorsCount: 0,
            // gasPriceFactorPercent: ,
            // gasPrice: 200000000000,
        };

        web3 = new Web3('http://localhost:8545');

        //@ts-ignore
        const accountManager = new AccountManager(web3.currentProvider, '1337', config);
        accountManager.addAccount('0x615158bef6091ad6ed66bace871f0c0c8b16ef45ef8d9f8b7e08684b6a12dfe1');
        accountManager.addAccount('0xa366ba8d969ba1a265a7c9e0b9868d9acd1f6589e46faec479b24ec5f3989ef5');
        accountManager.addAccount('0x4688f661095f699be837a99b5c857a99b51a8659ee87b3f9a1f04d244df763ba');

        const overrideDependencies = {
            accountManager,
        };

        //@ts-ignore
        const provider = await RelayProvider.newProvider({
            //@ts-ignore
            provider: web3.currentProvider,
            //@ts-ignore
            config,
            // overrideDependencies,
        }).init();

        provider.addAccount('0x615158bef6091ad6ed66bace871f0c0c8b16ef45ef8d9f8b7e08684b6a12dfe1');
        provider.addAccount('0xa366ba8d969ba1a265a7c9e0b9868d9acd1f6589e46faec479b24ec5f3989ef5');
        provider.addAccount('0x4688f661095f699be837a99b5c857a99b51a8659ee87b3f9a1f04d244df763ba');

        web3.setProvider(provider);
        // web3 = new Web3(provider);

        console.log('Got new provider!');
        console.log(`Accounts: ${await web3.eth.getAccounts()}`);

        // load accounts
        web3.eth.accounts.privateKeyToAccount('0x615158bef6091ad6ed66bace871f0c0c8b16ef45ef8d9f8b7e08684b6a12dfe1');
        web3.eth.accounts.privateKeyToAccount('0xa366ba8d969ba1a265a7c9e0b9868d9acd1f6589e46faec479b24ec5f3989ef5');
        web3.eth.accounts.privateKeyToAccount('0x4688f661095f699be837a99b5c857a99b51a8659ee87b3f9a1f04d244df763ba');

        gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;

        console.log(`Trusted forwarder: ${gsnForwarderAddress}`);

        // paymaster = new web3.eth.Contract(ERC721OwlGSNArtifact.abi as any, OwlGSN.address);

    });

    after(() => {
        //Disconnect from relayer
        gsn.relayProvider.disconnect();
    });

    beforeEach(async () => {
        [signer1, signer2] = await ethers.getSigners();
        ERC721OwlGSNFactory = (await ethers.getContractFactory('ERC721OwlGSN')) as ERC721OwlGSN__factory;
        ERC721OwlGSNImplementation = await ERC721OwlGSNFactory.connect(signer2).deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.connect(signer2).deploy();
        const { address } = await deployClone(
            ERC721OwlGSNImplementation,
            [signer2.address, 'n', 's', 'u', gsnForwarderAddress],
            ERC1167Factory,
            salt,
            'initialize(address,string,string,string,address)',
            signer2,
        );
        OwlGSN = (await ethers.getContractAt('ERC721OwlGSN', address)) as ERC721OwlGSN;
    });

    describe('Regular', () => {
        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer2.address);

            await OwlGSN.connect(signer2).mint(signer2.address, 1);
            const exists = await OwlGSN.exists(1);

            assert.equal(exists, true, 'Token not minted!');

            //Gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer2.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });
    });

    describe('GSN', () => {
        let OwlGSNContract: Web3ERC721OwlGSN;

        before(async () => {
            console.log('Is trusted:');
            console.log(await OwlGSN.isTrustedForwarder(gsnForwarderAddress));
            //Set forwarder --> don't need if we are passing in as an initializer?
            //await OwlGSN.setTrustedForwarder(gsnForwarderAddress);



            //Setup GSN-connected contract
            //@ts-ignore
            OwlGSNContract = new web3.eth.Contract(ERC721OwlGSNArtifact.abi as any, OwlGSN.address);
        });

        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer2.address);

            console.log(`Signer2: ${signer2.address}`);
            console.log(`Accounts: ${JSON.stringify(await web3.eth.getAccounts())}`);
            console.log(`GSN Addr: ${OwlGSN.address}`);
            const data = OwlGSNContract.methods.mint(signer2.address, 1).encodeABI();

            // const rawTx = {
            //     from: signer2.address,
            //     to: OwlGSN.address,
            //     gas: 3_000_000,
            //     gasPrice: '0x09184e72a000',
            //     gasLimit: '0x2DC6C0',
            //     value: '0x00',
            //     data,
            // };

            // await web3.eth.sendTransaction(rawTx, (e, h) => {
            //     console.log(`Got while running: ${JSON.stringify([e, h])}`);
            // });

            // console.log(rawTx);
            // const key = Buffer.from('615158bef6091ad6ed66bace871f0c0c8b16ef45ef8d9f8b7e08684b6a12dfe1');
            // const tx = new Transaction(rawTx);
            // tx.sign(key);
            // const txSerial = tx.serialize();
            // console.log(`Serial: ${txSerial}`);

            // web3.eth.sendSignedTransaction('0x' + txSerial.toString('hex')).on('receipt', console.log);

            // let signed = await web3.eth.accounts.signTransaction(
            //     rawTx,
            //     '0x615158bef6091ad6ed66bace871f0c0c8b16ef45ef8d9f8b7e08684b6a12dfe1',
            // );
            // const signedBytes = hexlify(toUtf8Bytes(JSON.stringify(signed)));
            // console.log(`Signed tx: ${signedBytes}`);

            //@ts-ignore
            // const recipt = await web3.eth.sendSignedTransaction(signed.rawTransaction, (e, h) => {
            //     if (e) console.log('Ran into error!');
            // });
            // console.log(JSON.stringify(recipt));
            // const info = await web3.eth.getTransaction(recipt.transactionHash);
            // console.log(`Info: ${JSON.stringify(info)}`);

            // // Mint again should fail (same id)
            // signed = await web3.eth.accounts.signTransaction(
            //     rawTx,
            //     '0x615158bef6091ad6ed66bace871f0c0c8b16ef45ef8d9f8b7e08684b6a12dfe1',
            // );

            // //@ts-ignore
            // const recipt2 = await web3.eth.sendSignedTransaction(signed.rawTransaction);
            // console.log(JSON.stringify(recipt2));
            // const info2 = await web3.eth.getTransaction(recipt2.transactionHash);
            // console.log(`Info: ${JSON.stringify(info2)}`);

            // console.log(`Exists: ${await OwlGSN.exists(1)}`);
            // await OwlGSN.exists(1);

            // const exisits = await OwlGSN.exists('2');
            // console.log(exisits);

            await OwlGSNContract.methods.mint(signer2.address, 2).send({ from: signer2.address, gasLimit: 1e6 });
            // const exists = await OwlGSNContract.methods.exists(1).call({ from: signer2.address, gas: 3_000_000 });

            // assert.equal(exists, true, 'Token not minted!');

            // //No gas was spent by user
            // const finalBalance = await ethers.provider.getBalance(signer1.address);
            // assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
        });

        /*
        //Run GSN Tests here
        //Use account1 as account0 is used as relayer
        before(async () => {
            //Setup Test Environment
            gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
            //@ts-ignore
            gsnProvider = new ethers.providers.Web3Provider(gsn.relayProvider);
            const pkey = '0x8253ed8da24264bd06df0281196eb8ce86f42878172d0caf178cfd9e01808761'
            gsnSigner = new ethers.Wallet(pkey, gsnProvider)
            gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;
            //Set forwarder
            await Flag.setTrustedForwarder(gsnForwarderAddress);
            //Setup GSN-connected contract
            FlagGSN = new ethers.Contract(Flag.address, Flag.interface, gsnSigner) as CaptureTheFlag
        })
        after(() => {
            //Disconnect from relayer
            gsn.relayProvider.disconnect();
        });
        it('captureFlag()', async () => {
            const initialBalance = await ethersHH.provider.getBalance(accounts[2].address);
            await FlagGSN.captureFlag({ from: accounts[2].address });
            const holder = await FlagGSN.flagHolder()
            assert.equal(holder, accounts[2].address, 'Flag not captured!')
            //No gas was spent by user
            const finalBalance = await ethersHH.provider.getBalance(accounts[2].address);
            console.debug(initialBalance.toString())
            console.debug(finalBalance.toString())
            assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
        });
    })
    */
    });
});
