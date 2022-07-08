import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
    ERC1155,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC20,
    ERC721,
    ERC721OwlAttributes,
    ERC721OwlAttributes__factory,
    FactoryERC20,
    Transformer,
    Transformer__factory,
} from '../../../typechain';
import { createERC1155, createERC20, createERC721, deployClone, encodeGenesUint256 } from '../../utils';
import { pick } from 'lodash';
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

const salt = ethers.utils.formatBytes32String('1');

enum GeneTransformType {
    none,
    add,
    sub,
    mult,
    set,
    // ,
    // random
}

enum ConsumableType {
    unaffected,
    burned,
    NTime,
}

const vals = [1, 1, 1];
const genes = [250, 252, 254];

describe('Transformer.sol; genes [2, 4, 6]', () => {
    let adminAddress: string;
    let burnAddress: string;
    let inputERC20: ERC20;
    let inputERC721: ERC721;
    let inputERC1155: ERC1155;

    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let burnSigner: SignerWithAddress;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let transformerImpl: Transformer;
    let ERC721Inst: ERC721OwlAttributes;
    beforeEach(async () => {
        [signer1, signer2, burnSigner] = await ethers.getSigners();
        adminAddress = signer1.address;
        burnAddress = burnSigner.address;

        [inputERC20] = await createERC20();
        [inputERC721] = await createERC721();
        [inputERC1155] = await createERC1155();
        const ERC721OwlAttributesFactory = (await ethers.getContractFactory(
            'ERC721OwlAttributes',
        )) as ERC721OwlAttributes__factory;
        const ERC721OwlAttributes = await ERC721OwlAttributesFactory.deploy();

        const transformerFactory = (await ethers.getContractFactory('Transformer')) as Transformer__factory;
        transformerImpl = await transformerFactory.deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();
        const { address } = await deployClone(ERC721OwlAttributes, [adminAddress, 'n', 's', 'u'], ERC1167Factory, salt);

        ERC721Inst = (await ethers.getContractAt('ERC721OwlAttributes', address)) as ERC721OwlAttributes;
        ERC721Inst.connect(signer1).mint(signer1.address, encodeGenesUint256(vals, genes));
        expect(await ERC721Inst.ownerOf(0)).to.equal(signer1.address);
        //await expect(ERC721Inst.ownerOf(63)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    describe('consumableType: burn; modification: none', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: 0,
                            consumableType: ConsumableType.burned,
                            contractAddr: inputERC20.address,
                            amounts: [10],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.none, //none
                            value: 0,
                        },
                        {
                            geneTransformType: GeneTransformType.none, //none
                            value: 0,
                        },
                        {
                            geneTransformType: GeneTransformType.none, //none
                            value: 0,
                        },
                    ],
                    ERC721Inst.address,
                ],
                ERC1167Factory,
                salt,
            );
            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC20.connect(signer1).approve(burnAddress, 999);
            await inputERC20.connect(signer1).approve(transformerInst.address, 999);
            await inputERC20.connect(signer1).approve(burnAddress, 999);
        });

        it('transform()', async () => {
            const tx = await transformerInst.transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(newDna);

            expect(await inputERC20.balanceOf(burnAddress)).to.equal(10);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27).sub(10)));
        });
    });

    describe('consumableType: burn; modification: add', async () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: 0,
                            consumableType: ConsumableType.burned,
                            contractAddr: inputERC20.address,
                            amounts: [10],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.add, //add
                            value: 1,
                        },
                        {
                            geneTransformType: GeneTransformType.add,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.add,
                            value: 3,
                        },
                    ],
                    ERC721Inst.address,
                ],
                ERC1167Factory,
                salt,
            );
            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC20.connect(signer1).approve(burnAddress, 999);
            await inputERC20.connect(signer1).approve(transformerInst.address, 999);
        });

        it('transform()', async () => {
            const tx = await transformerInst.transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([2, 3, 3], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(burnAddress)).to.equal(10);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27).sub(10)));
        });

        it('transform() twice, leading to overflow', async () => {
            await transformerInst.transform(0, [[]]);
            const tx2 = await transformerInst.transform(0, [[]]);
            const receipt = await tx2.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([2, 3, 3], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 3, 3], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(burnAddress)).to.equal(20);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27).sub(20)));
        });
    });

    describe('consumableType: unaffected; modification: sub', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: 0,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC20.address,
                            amounts: [10],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.sub, //add
                            value: 1,
                        },
                        {
                            geneTransformType: GeneTransformType.sub,
                            value: 1,
                        },
                        {
                            geneTransformType: GeneTransformType.sub,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                ],
                ERC1167Factory,
                salt,
            );
            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC20.connect(signer1).approve(burnAddress, 999);
            await inputERC20.connect(signer1).approve(transformerInst.address, 999);
        });

        it('transform()', async () => {
            const tx = await transformerInst.transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([0, 0, 0], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27)));
        });

        it('transform() twice, leading to underflow', async () => {
            await transformerInst.transform(0, [[]]);
            const tx2 = await transformerInst.transform(0, [[]]);
            const receipt = await tx2.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([0, 0, 0], genes));
            expect(newDna).to.equal(encodeGenesUint256([0, 0, 0], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27)));
        });
    });

    describe('consumableType: unaffected; input: NFT; modification: mult', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: 1,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC721.address,
                            amounts: [],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.mult, //add
                            value: 3,
                        },
                        {
                            geneTransformType: GeneTransformType.mult,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.mult,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                ],
                ERC1167Factory,
                salt,
            );
        });

        it('transform()', async () => {
            const tx = await transformerInst.transform(0, [[1, 2]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 2, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27)));
        });

        it('transform() twice, leading to underflow', async () => {
            await transformerInst.transform(0, [[]]);
            const tx2 = await transformerInst.transform(0, [[]]);
            const receipt = await tx2.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([3, 2, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 3, 3], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27)));
        });
    });

    describe('consumableType: burn; input: 1155; modification: set', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: 0,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC1155.address,
                            amounts: [],
                            tokenIds: [1, 2, 3],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.mult, //add
                            value: 3,
                        },
                        {
                            geneTransformType: GeneTransformType.mult,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.mult,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                ],
                ERC1167Factory,
                salt,
            );
        });

        it('transform()', async () => {
            const tx = await transformerInst.transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 2, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(burnAddress)).to.equal(10);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27).sub(10)));
        });

        it('transform() twice, leading to underflow', async () => {
            await transformerInst.transform(0, [[]]);
            const tx2 = await transformerInst.transform(0, [[]]);
            const receipt = await tx2.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([3, 2, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 3, 3], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC20.balanceOf(burnAddress)).to.equal(20);
            expect(await inputERC20.balanceOf(signer1.address)).to.equal(BigNumber.from(parseUnits('1', 27).sub(20)));
        });
    });

    describe('consumableType: NTime; modification: [add, mult, set]', () => {
        beforeEach(async () => {});

        it('', async () => {});
    });
});
