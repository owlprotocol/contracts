import { ethers } from 'hardhat';
const { utils } = ethers;
const { parseUnits, keccak256, hexlify, hexZeroPad } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    Lootbox,
    Lootbox__factory,
    ERC20,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721,
    ERC1155,
    CrafterTransfer,
    CrafterTransfer__factory,
    CrafterMint,
    CrafterMint__factory,
} from '../../typechain';

import { createERC20, createERC721, createERC1155, deployClone, predictDeployClone, getTime } from '../utils';
import { BigNumber } from 'ethers';
import { ERC721Owl__factory } from '../../typechain';
import { ERC721Owl } from '../../typechain';
import { deploy } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { pick } from 'lodash';
import { parse } from 'path';
import { keccakFromString, zeroAddress } from 'ethereumjs-util';
import { AbiCoder } from '@ethersproject/abi';

enum ConsumableType {
    unaffected,
    burned,
<<<<<<< HEAD
<<<<<<< HEAD
    NTime,
=======
    locked,
>>>>>>> 8644d37 (create lootbox + tests)
=======
    NTime,
>>>>>>> a8db743 (lootbox updates)
}
enum TokenType {
    erc20,
    erc721,
    erc1155,
}

const salt = ethers.utils.formatBytes32String('1');

describe('Lootbox.sol', function () {
    //Extra time
    this.timeout(10000);
    let client: SignerWithAddress;
    let admin: SignerWithAddress;
<<<<<<< HEAD
<<<<<<< HEAD
    let burnSigner: SignerWithAddress;
=======
>>>>>>> 8644d37 (create lootbox + tests)
=======
    let burnSigner: SignerWithAddress;
>>>>>>> a8db743 (lootbox updates)

    let lootboxImplementationFactory: Lootbox__factory;
    let lootboxImplementation: Lootbox;
    let lootboxImplementationAddress: string;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let crafterTransferFactory: CrafterTransfer__factory;
    let crafterTransfer: CrafterTransfer;
    let crafterTransferAddress: string;

    let crafterMintFactory: CrafterMint__factory;
    let crafterMint: CrafterMint;
    let crafterMintAddress: string;

    let ERC721Factory: ERC721Owl__factory;
    let ERC721: ERC721Owl;

    let lootboxNFT: ERC721Owl;
    let lootboxNFTAddress: string;

    before(async () => {
        //launch Auction + implementation
        lootboxImplementationFactory = (await ethers.getContractFactory('Lootbox')) as Lootbox__factory;
        lootboxImplementation = await lootboxImplementationFactory.deploy();

        crafterTransferFactory = (await ethers.getContractFactory('CrafterTransfer')) as CrafterTransfer__factory;
        crafterTransfer = await crafterTransferFactory.deploy();

        crafterMintFactory = (await ethers.getContractFactory('CrafterMint')) as CrafterMint__factory;
        crafterMint = await crafterMintFactory.deploy(); // Launch ERC1167 Factory

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), lootboxImplementation.deployed()]);

        //get users
        [admin, client, burnSigner] = await ethers.getSigners();
    });

    describe('Tests', async () => {
        //define setup

        let testOutputERC721: ERC721;
        let testOutputERC20: ERC20;
        let testOutputERC1155: ERC1155;

        let crafterTransferERC20OutputAddress!: string;
        let crafterTransferERC721OutputAddress!: string;
        let crafterTransferERC1155OutputAddress!: string;
        let crafterTransferAllOutputsAddress!: string;

        let lootboxInstance: Lootbox;
        let crafterInstanceERC20: CrafterTransfer;
        let crafterInstanceERC721: CrafterTransfer;
        let crafterInstanceERC1155: CrafterTransfer;
        let crafterInstanceAllOutputs: CrafterTransfer;

        beforeEach(async () => {
            //Get Lootbox
            ERC721Factory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
            ERC721 = await ERC721Factory.deploy();
            const { address } = await deployClone(ERC721, [admin.address, 'name', 'symb', 'uri'], ERC1167Factory);
            lootboxNFTAddress = address;
            lootboxNFT = (await ethers.getContractAt('ERC721Owl', lootboxNFTAddress)) as ERC721Owl;

            //Deploy test ERC20, ERC721, and ERC1155 for use in CrafterTransfer
            [testOutputERC20] = await createERC20(1);
            [testOutputERC721] = await createERC721(1, 5);
            [testOutputERC1155] = await createERC1155();

            //Create Crafter Contract Instances + set approvals
            const crafterTransferERC20OutputArgs = [
                //admin address
                //burn address
                //craftable amount
                //inputs array
                //outputs array
                admin.address,
                burnSigner.address,
                1,
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.burned,
                        contractAddr: lootboxNFTAddress,
                        amounts: [],
                        tokenIds: [],
                    },
                ],
                [
                    {
                        token: TokenType.erc20,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: testOutputERC20.address,
                        amounts: [1],
                        tokenIds: [],
                    },
                ],
            ];
            crafterTransferERC20OutputAddress = await predictDeployClone(
                crafterTransfer,
                crafterTransferERC20OutputArgs,
                ERC1167Factory,
            );
            testOutputERC20.connect(admin).approve(crafterTransferERC20OutputAddress, 999);
            await deployClone(crafterTransfer, crafterTransferERC20OutputArgs, ERC1167Factory);
            crafterInstanceERC20 = (await ethers.getContractAt(
                'CrafterTransfer',
                crafterTransferERC20OutputAddress,
            )) as CrafterTransfer;

            const crafterTransferERC721OutputArgs = [
                //admin address
                //burn address
                //craftable amount
                //inputs array
                //outputs array
                admin.address,
                burnSigner.address,
                1,
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.burned,
                        contractAddr: lootboxNFTAddress,
                        amounts: [],
                        tokenIds: [],
                    },
                ],
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: testOutputERC721.address,
                        amounts: [],
                        tokenIds: [1],
                    },
                ],
            ];
            crafterTransferERC721OutputAddress = await predictDeployClone(
                crafterTransfer,
                crafterTransferERC721OutputArgs,
                ERC1167Factory,
            );
            testOutputERC721.connect(admin).approve(crafterTransferERC721OutputAddress, 1);
            await deployClone(crafterTransfer, crafterTransferERC721OutputArgs, ERC1167Factory);
            crafterInstanceERC721 = (await ethers.getContractAt(
                'CrafterTransfer',
                crafterTransferERC721OutputAddress,
            )) as CrafterTransfer;

            const crafterTransferERC1155OutputArgs = [
                //admin address
                //burn address
                //craftable amount
                //inputs array
                //outputs array
                admin.address,
                burnSigner.address,
                1,
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.NTime,
                        contractAddr: lootboxNFTAddress,
                        amounts: [2],
                        tokenIds: [],
                    },
                ],
                [
                    {
                        token: TokenType.erc1155,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: testOutputERC1155.address,
                        amounts: [5],
                        tokenIds: [1],
                    },
                ],
            ];
            crafterTransferERC1155OutputAddress = await predictDeployClone(
                crafterTransfer,
                crafterTransferERC1155OutputArgs,
                ERC1167Factory,
            );
            testOutputERC1155.connect(admin).setApprovalForAll(crafterTransferERC1155OutputAddress, true);
            await deployClone(crafterTransfer, crafterTransferERC1155OutputArgs, ERC1167Factory);
            crafterInstanceERC1155 = (await ethers.getContractAt(
                'CrafterTransfer',
                crafterTransferERC1155OutputAddress,
            )) as CrafterTransfer;

            const crafterTransferAllOutputsArgs = [
                //admin address
                //burn address
                //craftable amount
                //inputs array
                //outputs array
                admin.address,
                burnSigner.address,
                1,
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.burned,
                        contractAddr: lootboxNFTAddress,
                        amounts: [],
                        tokenIds: [],
                    },
                ],
                [
                    {
                        token: TokenType.erc20,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: testOutputERC20.address,
                        amounts: [5],
                        tokenIds: [],
                    },
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: testOutputERC721.address,
                        amounts: [],
                        tokenIds: [2],
                    },
                    {
                        token: TokenType.erc1155,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: testOutputERC1155.address,
                        amounts: [1, 1],
                        tokenIds: [2, 3],
                    },
                ],
            ];
            crafterTransferAllOutputsAddress = await predictDeployClone(
                crafterTransfer,
                crafterTransferAllOutputsArgs,
                ERC1167Factory,
            );
            testOutputERC20.connect(admin).approve(crafterTransferAllOutputsAddress, 999);
            testOutputERC721.connect(admin).approve(crafterTransferAllOutputsAddress, 1);
            testOutputERC721.connect(admin).approve(crafterTransferAllOutputsAddress, 2);
            testOutputERC721.connect(admin).approve(crafterTransferAllOutputsAddress, 3);
            testOutputERC1155.connect(admin).setApprovalForAll(crafterTransferAllOutputsAddress, true);
            await deployClone(crafterTransfer, crafterTransferAllOutputsArgs, ERC1167Factory);
            crafterInstanceAllOutputs = (await ethers.getContractAt(
                'CrafterTransfer',
                crafterTransferAllOutputsAddress,
            )) as CrafterTransfer;

            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);

            //assert initial token amount
            expect(await testOutputERC20.balanceOf(admin.address)).to.equal(totalERC20Minted.sub(6));
            expect(await testOutputERC721.ownerOf(1)).to.equal(crafterTransferERC721OutputAddress);
            expect(await testOutputERC721.ownerOf(2)).to.equal(crafterTransferAllOutputsAddress);
            expect(await testOutputERC1155.balanceOf(crafterTransferERC1155OutputAddress, 1)).to.equal(5);
            expect(await testOutputERC1155.balanceOf(crafterTransferAllOutputsAddress, 2)).to.equal(1);
            expect(await testOutputERC1155.balanceOf(crafterTransferAllOutputsAddress, 3)).to.equal(1);
        });

        it('simple lootbox - 1 asset', async () => {
            //Create lootboxImplementation instance
            const { address: lootboxInstanceAddress } = await deployClone(
                lootboxImplementation,
                [
                    //admin address
                    //array of crafterContract addresses
                    //array of probabilities
                    admin.address,
                    [crafterTransferERC20OutputAddress],
                    [100],
                ],
                ERC1167Factory,
            );

            lootboxInstance = (await ethers.getContractAt('Lootbox', lootboxInstanceAddress)) as Lootbox;

            //mint lootbox owl to client
            await lootboxNFT.mint(client.address, 1);

            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferERC20OutputAddress, true);
            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferERC721OutputAddress, true);
            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferERC1155OutputAddress, true);
            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferAllOutputsAddress, true);

            await crafterInstanceERC20.grantForwarder(lootboxInstanceAddress);

            await lootboxInstance.connect(client).unlock(1);

            expect(await lootboxNFT.ownerOf(1)).to.equal(burnSigner.address);
            expect(await testOutputERC20.balanceOf(client.address)).to.equal(1);
        });

        it('multiple lootboxes with different assets', async () => {
            //Create lootboxImplementation instance
<<<<<<< HEAD
            let crafterTransferArr = [
=======
            let arr = [
>>>>>>> a8db743 (lootbox updates)
                crafterTransferERC20OutputAddress,
                crafterTransferERC721OutputAddress,
                crafterTransferERC1155OutputAddress,
                crafterTransferAllOutputsAddress,
            ];
<<<<<<< HEAD

            let probDistArr = [25, 50, 75, 100];
=======
>>>>>>> a8db743 (lootbox updates)
            const { address: lootboxInstanceAddress } = await deployClone(
                lootboxImplementation,
                [
                    //admin address
                    //array of crafterContract addresses
                    //array of probabilities
                    admin.address,
<<<<<<< HEAD
                    crafterTransferArr,
                    probDistArr,
=======
                    [
                        crafterTransferERC20OutputAddress,
                        crafterTransferERC721OutputAddress,
                        crafterTransferERC1155OutputAddress,
                        crafterTransferAllOutputsAddress,
                    ],
                    [25, 50, 75, 100],
>>>>>>> a8db743 (lootbox updates)
                ],
                ERC1167Factory,
            );

            lootboxInstance = (await ethers.getContractAt('Lootbox', lootboxInstanceAddress)) as Lootbox;

            //mint lootbox owl to client
            await lootboxNFT.mint(client.address, 1);

            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferERC20OutputAddress, true);
            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferERC721OutputAddress, true);
            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferERC1155OutputAddress, true);
            await lootboxNFT.connect(client).setApprovalForAll(crafterTransferAllOutputsAddress, true);
<<<<<<< HEAD

            await crafterInstanceERC20.grantForwarder(lootboxInstanceAddress);
            await crafterInstanceERC721.grantForwarder(lootboxInstanceAddress);
            await crafterInstanceERC1155.grantForwarder(lootboxInstanceAddress);
            await crafterInstanceAllOutputs.grantForwarder(lootboxInstanceAddress);

            const tx = await lootboxInstance.connect(client).unlock(1);
            await tx.wait();

            let random = BigNumber.from(keccak256(hexZeroPad(hexlify(await getTime()), 32)));

            let seedMod = random.mod(probDistArr[probDistArr.length - 1]).add(1);
            let seedModNum = seedMod.toNumber();
            let index;
            for (let j = 0; j < probDistArr.length; j++) {
                if (seedModNum <= probDistArr[j]) {
                    index = j;
                    break;
                }
            }

            console.log(seedModNum);
            console.log(index);

            if (index == 0) {
                expect(await lootboxNFT.ownerOf(1)).to.equal(burnSigner.address);
                expect(await testOutputERC20.balanceOf(client.address)).to.equal(1);
            } else if (index == 1) {
                expect(await lootboxNFT.ownerOf(1)).to.equal(burnSigner.address);
                expect(await testOutputERC721.ownerOf(1)).to.equal(client.address);
            } else if (index == 2) {
                expect(await lootboxNFT.ownerOf(1)).to.equal(client.address);
                expect(await testOutputERC1155.balanceOf(client.address, 1)).to.equal(5);
            } else if (index == 3) {
                expect(await testOutputERC20.balanceOf(client.address)).to.equal(5);
                expect(await testOutputERC721.ownerOf(2)).to.equal(client.address);
                expect(await testOutputERC1155.balanceOf(client.address, 2)).to.equal(1);
                expect(await testOutputERC1155.balanceOf(client.address, 3)).to.equal(1);
            }
        });

        it('error: user does not own lootbox', async () => {
            //Create lootboxImplementation instance
            const { address: lootboxInstanceAddress } = await deployClone(
                lootboxImplementation,
                [
                    //admin address
                    //array of crafterContract addresses
                    //array of probabilities
                    admin.address,
                    [crafterTransferERC20OutputAddress],
                    [100],
                ],
                ERC1167Factory,
            );

            await lootboxNFT.mint(burnSigner.address, 1);

            lootboxInstance = (await ethers.getContractAt('Lootbox', lootboxInstanceAddress)) as Lootbox;

            await expect(lootboxInstance.unlock(1)).to.be.revertedWith('Lootbox: you do not own this lootbox!');
        });

        it('error: length of probabilities and crafterContracts is not equal', async () => {
            //Create lootboxImplementation instance
            await expect(
                deployClone(
                    lootboxImplementation,
                    [
                        //admin address
                        //array of crafterContract addresses
                        //array of probabilities
                        admin.address,
                        [crafterTransferERC20OutputAddress],
                        [100, 200],
                    ],
                    ERC1167Factory,
                ),
            ).to.be.revertedWith('Lootbox.sol: lengths of probabilities and crafterContracts arrays do not match!');
=======

            await crafterInstanceERC20.grantForwarder(lootboxInstanceAddress);
            await crafterInstanceERC721.grantForwarder(lootboxInstanceAddress);
            await crafterInstanceERC1155.grantForwarder(lootboxInstanceAddress);
            await crafterInstanceAllOutputs.grantForwarder(lootboxInstanceAddress);

            const tx = await lootboxInstance.connect(client).unlock(1);
            await tx.wait();

            let random = parseInt(keccak256(hexZeroPad(hexlify(await getTime()), 32)));
            console.log(random);

            // expect(await lootboxNFT.ownerOf(1)).to.equal(burnSigner.address);
            // expect(await testOutputERC20.balanceOf(client.address)).to.equal(1);
>>>>>>> a8db743 (lootbox updates)
        });
    });
});
