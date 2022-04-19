import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configureGanache from '../../../src/utils/configureGanache';
import setProvider from '../../../src/utils/setProvider';
import ERC1820Registry from '../../../src/truffle/ERC1820Registry';
import MinterSimple from '../../../src/truffle/MinterSimple';
import MinterAutoId from '../../../src/truffle/MinterAutoId';
import MinterBreeding from '../../../src/truffle/MinterBreeding';
import MinterRandom from '../../../src/truffle/MinterRandom';
import InterfaceIds from '../../../src/truffle/InterfaceIds';
import Web3 from 'web3';
import { keccak256 } from 'web3-utils';

chai.use(chaiAsPromised);
const { assert } = chai;

describe('ERC1820 Registry', function () {
    let accounts: string[];
    let manager: string;
    let web3: Web3;
    let encodeFunctionSignature: any;

    let minterCoreSignature: string;
    let minterSimpleSignature: string;
    let minterAutoIdSignature: string;
    let minterBreedingSignature: string;
    let minterRandomSignature: string;

    const minterCorePrivateInterface = keccak256('OWLProtocol://MinterCore');
    const minterSimplePrivateInterface = keccak256('OWLProtocol://MinterSimple');
    const minterAutoIdPrivateInterface = keccak256('OWLProtocol://MinterAutoId');
    const minterBreedingPrivateInterface = keccak256('OWLProtocol://MinterBreeding');
    const minterRandomPrivateInterface = keccak256('OWLProtocol://MinterRandom');
    const _ERC1820_ACCEPT_MAGIC = keccak256('ERC1820_ACCEPT_MAGIC');

    before(async () => {
        const config = await configureGanache();
        ({ accounts, web3 } = config);
        encodeFunctionSignature = web3.eth.abi.encodeFunctionSignature;
        setProvider([InterfaceIds], config.provider, accounts[0]);
        setProvider([MinterSimple], config.provider, accounts[0]);
        setProvider([MinterAutoId], config.provider, accounts[0]);
        setProvider([MinterBreeding], config.provider, accounts[0]);
        setProvider([MinterRandom], config.provider, accounts[0]);
        setProvider([ERC1820Registry], config.provider, accounts[0]);

        const interfaceIds = await InterfaceIds.new();
        minterCoreSignature = await interfaceIds.minterCoreInterfaceId();
        minterSimpleSignature = await interfaceIds.minterSimpleInterfaceId();
        minterAutoIdSignature = await interfaceIds.minterAutoIdInterfaceId();
        minterBreedingSignature = await interfaceIds.minterBreedingInterfaceId();
        minterRandomSignature = await interfaceIds.minterRandomInterfaceId();

        manager = accounts[0];
    });

    it('ERC165 Interface Testing', async () => {
        const minterSimple = await MinterSimple.new();
        const minterAutoId = await MinterAutoId.new();
        const minterBreeding = await MinterBreeding.new();
        const minterRandom = await MinterRandom.new();

        let signature: string = encodeFunctionSignature('supportsInterface(bytes4)');
        assert(await minterSimple.supportsInterface(signature), 'Not ERC165 compatibile');
        signature = '0xffffffff';
        assert.isFalse(await minterSimple.supportsInterface(signature), 'Not rejecting bad interface!');

        assert(await minterSimple.supportsInterface(minterCoreSignature), 'Not MinterCore compatible!!');
        assert(await minterSimple.supportsInterface(minterSimpleSignature), 'Not MinterSimple Compatible! ');
        assert(await minterAutoId.supportsInterface(minterAutoIdSignature), 'Not MinterAutoId Compatible! ');
        assert(await minterBreeding.supportsInterface(minterBreedingSignature), 'Not MinterBreeding Compatible! ');
        assert(await minterRandom.supportsInterface(minterRandomSignature), 'Not MinterRandom Compatible! ');
    });

    it('ERC1820 Implementer Testing', async () => {
        const minterSimple = await MinterSimple.new();
        const minterAutoId = await MinterAutoId.new();
        const minterBreeding = await MinterBreeding.new();
        const minterRandom = await MinterRandom.new();

        // Ensure private interfaces registered
        assert.equal(
            await minterSimple.canImplementInterfaceForAddress(minterCorePrivateInterface, manager),
            _ERC1820_ACCEPT_MAGIC,
            'private interface unregistered!',
        );
        assert.equal(
            await minterSimple.canImplementInterfaceForAddress(minterSimplePrivateInterface, manager),
            _ERC1820_ACCEPT_MAGIC,
            'private interface unregistered!',
        );
        assert.equal(
            await minterAutoId.canImplementInterfaceForAddress(minterAutoIdPrivateInterface, manager),
            _ERC1820_ACCEPT_MAGIC,
            'private interface unregistered!',
        );
        assert.equal(
            await minterBreeding.canImplementInterfaceForAddress(minterBreedingPrivateInterface, manager),
            _ERC1820_ACCEPT_MAGIC,
            'private interface unregistered!',
        );
        assert.equal(
            await minterRandom.canImplementInterfaceForAddress(minterRandomPrivateInterface, manager),
            _ERC1820_ACCEPT_MAGIC,
            'private interface unregistered!',
        );

        // Non-existent interface
        assert.notEqual(
            await minterSimple.canImplementInterfaceForAddress(keccak256('foo'), manager),
            _ERC1820_ACCEPT_MAGIC,
            'nonexistent interfaced registered!',
        );
    });

    it('ERC1820 Registry Testing', async () => {
        const registry = await ERC1820Registry.new();

        const minterSimple = await MinterSimple.new();
        const minterAutoId = await MinterAutoId.new();
        const minterBreeding = await MinterBreeding.new();
        const minterRandom = await MinterRandom.new();

        // Register our interfaces
        let tx;
        tx = await registry.setInterfaceImplementer(manager, minterSimplePrivateInterface, minterSimple.address);
        assert.equal(tx.logs[0].event, 'InterfaceImplementerSet');
        // assert.equal(tx.logs[0].args['2'], minterSimple.address);
        assert.equal(tx.logs[0].args['1'], minterSimplePrivateInterface);
        assert.equal(tx.logs[0].args.addr, manager);
        tx = await registry.setInterfaceImplementer(manager, minterAutoIdPrivateInterface, minterAutoId.address);
        assert.equal(tx.logs[0].event, 'InterfaceImplementerSet');
        // assert.equal(tx.logs[0].args['2'], minterAutoId.address);
        assert.equal(tx.logs[0].args['1'], minterAutoIdPrivateInterface);
        assert.equal(tx.logs[0].args.addr, manager);
        tx = await registry.setInterfaceImplementer(manager, minterBreedingPrivateInterface, minterBreeding.address);
        assert.equal(tx.logs[0].event, 'InterfaceImplementerSet');
        // assert.equal(tx.logs[0].args['2'], minterBreeding.address);
        assert.equal(tx.logs[0].args['1'], minterBreedingPrivateInterface);
        assert.equal(tx.logs[0].args.addr, manager);
        tx = await registry.setInterfaceImplementer(manager, minterRandomPrivateInterface, minterRandom.address);
        assert.equal(tx.logs[0].event, 'InterfaceImplementerSet');
        // assert.equal(tx.logs[0].args['2'], minterRandom.address);
        assert.equal(tx.logs[0].args['1'], minterRandomPrivateInterface);
        assert.equal(tx.logs[0].args.addr, manager);

        // Reverse-lookup interface implementations
        assert.equal(
            await registry.getInterfaceImplementer(manager, minterSimplePrivateInterface),
            minterSimple.address,
        );
        assert.equal(
            await registry.getInterfaceImplementer(manager, minterAutoIdPrivateInterface),
            minterAutoId.address,
        );
        assert.equal(
            await registry.getInterfaceImplementer(manager, minterBreedingPrivateInterface),
            minterBreeding.address,
        );
        assert.equal(
            await registry.getInterfaceImplementer(manager, minterRandomPrivateInterface),
            minterRandom.address,
        );
    });
});
