import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import {
    ERC1167Factory,
    ERC1167Factory__factory,
    FactoryERC20__factory,
    FactoryERC721__factory,
    FactoryERC20,
    FactoryERC721,
    MinterRandom,
    MinterRandom__factory,
} from '../../../typechain';
import { deployClone } from '../../utils';

describe.only('MinterRandom.sol', function () {
    let owner: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    let MinterRandomFactory: MinterRandom__factory;
    let FactoryERC20: FactoryERC20__factory;
    let FactoryERC721: FactoryERC721__factory;

    let MinterImplementation: MinterRandom;
    let nft: FactoryERC721;
    let erc20: FactoryERC20;

    let nftAddress: string;
    let mintFeeToken: string;
    let mintFeeAddress: string;
    let mintFeeAmount: number;

    before(async () => {
        // Deploy contracts
        MinterRandomFactory = (await ethers.getContractFactory('MinterRandom')) as MinterRandom__factory;
        FactoryERC20 = (await ethers.getContractFactory('FactoryERC20')) as FactoryERC20__factory;
        FactoryERC721 = (await ethers.getContractFactory('FactoryERC721')) as FactoryERC721__factory;

        [owner, burnAddress] = await ethers.getSigners();

        MinterImplementation = await MinterRandomFactory.deploy();
        nft = await FactoryERC721.deploy('NFT', 'NFT');
        erc20 = await FactoryERC20.deploy('0', 'ERC', 'ERC');
        await Promise.all([MinterImplementation.deployed(), nft.deployed(), erc20.deployed()]);

        nftAddress = nft.address;
        mintFeeToken = erc20.address;
        mintFeeAddress = burnAddress.address;
        mintFeeAmount = 10;
    });

    describe('MinterRandom Minting', async () => {
        let minter: MinterRandom;

        beforeEach(async () => {
            const { address } = await deployClone(MinterImplementation, [
                owner.address,
                mintFeeToken,
                mintFeeAddress,
                mintFeeAmount,
                nftAddress,
            ]);

            minter = (await ethers.getContractAt('MinterRandom', address)) as MinterRandom;
        });

        it('MinterRandom.mint(...)', async () => {
            // Authorize transfer
            await erc20.increaseAllowance(minter.address, '20');

            // Mint Specimen
            await minter.mint(owner.address);

            // SafeMint Specimen
            await minter.safeMint(owner.address);
        });
    });
});
