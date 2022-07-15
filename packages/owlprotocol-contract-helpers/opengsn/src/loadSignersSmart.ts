import { Network } from 'hardhat/types/runtime';
import { network } from 'hardhat';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/dev';
import { JsonRpcSigner, JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { GSNContractsDeployment } from '@opengsn/common/dist/GSNContractsDeployment';


const ZERO_ADDR = '0x' + '0'.repeat(40);

// Create a hybrid-testing signer
export type TestingSigner = SignerWithAddress | JsonRpcSignerTesting;

// Global testing environment
// Allows us to not reload testing every time
let signers: TestingSigner[] = [];
let gsnTestEnv: TestEnvironment;
let provider: Web3Provider;
let gsnForwarderAddress = ZERO_ADDR;
let signer1: TestingSigner;

export const IS_GSN = (process.env.IS_GSN?.toLowerCase() === 'true') || (network.name === 'local') || false;

export const itGSN = IS_GSN ? it : it.skip; // skips tests if gsn disabled
export const describeGSN = IS_GSN ? describe : describe.skip;

export const itNoGSN = IS_GSN ? it.skip : it;
export const describeNoGSN = IS_GSN ? describe.skip : describe;

interface loadedSigners {
    signer1: TestingSigner;
    signers: (TestingSigner)[];
    gsnForwarderAddress: string;
    gsnTestEnv?: TestEnvironment;
    provider?: Web3Provider;
    contracts?: GSNContractsDeployment;
}

export class JsonRpcSignerTesting extends JsonRpcSigner {
    // Allow native interchange w/ SignerWithAddress
    address: string = '';
}

/**
 * Returns GSN-wrapped signers if GSN environment is live.
 * Otherwise returns standard.
 * TODO - stop @ts-ignore
 */
export default async function loadEnvironment(ethers: any, hardhatNetwork: Network = network): Promise<loadedSigners> {
    if (IS_GSN) {

        if (gsnTestEnv === undefined) {
            // Instantiate testing environment
            console.log('===== Loading Global GSN Environment! =====');
            gsnTestEnv = await GsnTestEnvironment.startGsn('http://localhost:8545');
            console.log('\n'.repeat(2) + '===== GSN Loaded! =====' + '\n'.repeat(5));

            // Launch new provider
            provider = new ethers.providers.Web3Provider(gsnTestEnv.relayProvider);

            // Wrap signers with provider and add address field
            for (let etherSigner of await ethers.getSigners()) {
                // Get signer wrapped with GSN
                const signer = provider.getSigner(etherSigner.address) as JsonRpcSignerTesting;
                // Fill in address field
                signer.address = await signer.getAddress();

                signers.push(signer);
            }

            // Grab forwarder address
            if (gsnTestEnv.contractsDeployment.forwarderAddress === undefined)
                throw "Unable to launch forwarder!";
            gsnForwarderAddress = gsnTestEnv.contractsDeployment.forwarderAddress;

            // Assign signer1 for easier deconstructing
            signer1 = signers[0];

        }

        return { signers, signer1, gsnTestEnv, provider, gsnForwarderAddress, contracts: gsnTestEnv.contractsDeployment };

    } else {

        // Return standard ethers signers
        signers = await ethers.getSigners();
        signer1 = signers[0];

        return { signers, signer1, gsnForwarderAddress };

    }
}

/**
 * Return only signers
 */
export async function loadSignersSmart(ethers: any, hardhatNetwork: Network = network) {
    if (signers.length === 0)
        await loadEnvironment(ethers, hardhatNetwork);
    return signers;
}

/**
 * Return only signers
 */
export async function loadForwarder(ethers: any, hardhatNetwork: Network = network) {
    if (gsnForwarderAddress === ZERO_ADDR)
        await loadEnvironment(ethers, hardhatNetwork);
    return gsnForwarderAddress;
}

/**
 * Test wrapper to assert balances don't change in a test.
 */
export function assertBalances(ethers: any, fn: Function, signersToCheck?: TestingSigner[]) {

    return async function () {
        // Default to all signers if none provided.
        signersToCheck = signersToCheck !== undefined && signersToCheck.length > 0 ? signersToCheck : signers;
        let balancesBefore;
        if (IS_GSN) {
            // Get all balances
            balancesBefore = await Promise.all(signers.map(signer => ethers.provider.getBalance(signer.address)));
            console.log(`All signer bals: ${JSON.stringify(balancesBefore)}`);

            // Call function
            await fn();

            // Check balances after
            const balancesAfter = await Promise.all(signers.map(signer => ethers.provider.getBalance(signer.address)));
            console.log(`Balances after: ${JSON.stringify(balancesAfter)}`);

            // Assert same
            for (let i = 0; i < signers.length; i++)
                expect(balancesBefore[i]).to.equal(balancesAfter[i]);
            console.log('No fees spent!');
        } else {
            await fn();
        }

    }
}
