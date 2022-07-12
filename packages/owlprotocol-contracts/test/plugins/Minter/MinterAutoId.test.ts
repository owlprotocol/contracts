import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import {
    FactoryERC20,
    FactoryERC20__factory,
    FactoryERC721,
    FactoryERC721__factory,
    MinterAutoId,
    MinterAutoId__factory,
} from '../../../typechain';

import { deployClone } from '../../utils';

describe('MinterAutoId.sol', function () {
    let owner: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    let MinterAutoIdFactory: MinterAutoId__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let MinterImplementation: MinterAutoId;
    let nft: FactoryERC721;
    let erc20: FactoryERC20;

    let nftAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    before(async () => {
        // Deploy contracts
        MinterAutoIdFactory = (await ethers.getContractFactory('MinterAutoId')) as MinterAutoId__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

        [owner, burnAddress] = await ethers.getSigners();

        MinterImplementation = await MinterAutoIdFactory.deploy();
        nft = await FactoryERC721.deploy('NFT', 'NFT');
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([MinterImplementation.deployed(), nft.deployed(), erc20.deployed()]);

        nftAddress = nft.address;
        mintFeeToken = erc20.address;
        mintFeeAddress = burnAddress.address;
        mintFeeAmount = 10;
    });

    describe('MinterAutoId testing', async () => {
        let minter: MinterAutoId;

        beforeEach(async () => {
            const { address } = await deployClone(MinterImplementation, [
                owner.address,
                mintFeeToken,
                mintFeeAddress,
                mintFeeAmount,
                nftAddress,
                '0x' + '0'.repeat(40), // trusted forwarder
            ]);

            minter = (await ethers.getContractAt('MinterAutoId', address)) as MinterAutoId;
        });

        it('MinterSimple.mint(...)', async () => {
            // Authorize transfer
            await erc20.increaseAllowance(minter.address, '20');

            // Mint Specimen
            await minter.mint(owner.address);

            // Second mint increments id
            await minter.safeMint(owner.address);
        });
    });
});
