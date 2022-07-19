import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
    FactoryERC1155,
    ERC1167Factory,
    ERC1167Factory__factory,
    FactoryERC20,
    FactoryERC721,
    ERC721OwlAttributes,
    ERC721OwlAttributes__factory,
    Transformer,
    Transformer__factory,
    UpgradeableBeaconInitializable__factory,
    UpgradeableBeaconInitializable,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
} from '../../../typechain';
import { createERC1155, createERC20, createERC721, deployClone, encodeGenesUint256 } from '../../utils';
import { pick } from 'lodash';
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { loadSignersSmart, loadForwarder, TestingSigner } from '@owlprotocol/contract-helpers-opengsn/src';

const salt = ethers.utils.formatBytes32String('1');

enum GeneTransformType {
    none,
    add,
    sub,
    mult,
    set,
}

enum ConsumableType {
    unaffected,
    burned,
    NTime,
}

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

const vals = [1, 1, 1];
const genes = [250, 252, 254];

describe('Transformer.sol; genes [2, 4, 6]', () => {
    let adminAddress: string;
    let burnAddress: string;
    let inputERC20: FactoryERC20;
    let inputERC721: FactoryERC721;
    let inputERC1155: FactoryERC1155;

    let signer1: TestingSigner;
    let signer2: TestingSigner;
    let burnSigner: TestingSigner;
    let forwarder: TestingSigner;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let transformerImpl: Transformer;
    let ERC721Inst: ERC721OwlAttributes;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    beforeEach(async () => {
        //Setup Test Environment
        gsnForwarderAddress = await loadForwarder(ethers);

        [signer1, signer2, burnSigner] = await loadSignersSmart(ethers);
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
        const { address } = await deployClone(
            ERC721OwlAttributes,
            [adminAddress, 'n', 's', 'u', gsnForwarderAddress],
            ERC1167Factory,
            salt,
        );

        ERC721Inst = (await ethers.getContractAt('ERC721OwlAttributes', address)) as ERC721OwlAttributes;

        await ERC721Inst.connect(signer1).mint(signer1.address, encodeGenesUint256(vals, genes));

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
                            token: TokenType.erc20,
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
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );

            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC20.connect(signer1).approve(transformerInst.address, 999);
        });

        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(newDna);
            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);

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
                            token: TokenType.erc20,
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
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );
            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC20.connect(signer1).approve(transformerInst.address, 999);
        });

        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[]]);
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
            await transformerInst.connect(signer1).transform(0, [[]]);
            const tx2 = await transformerInst.connect(signer1).transform(0, [[]]);
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
                            token: TokenType.erc20,
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
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );
            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;
        });

        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[]]);
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
            await transformerInst.connect(signer1).transform(0, [[]]);
            const tx2 = await transformerInst.connect(signer1).transform(0, [[]]);
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

    describe('consumableType: NTime; input: NFT; modification: mult', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC721.address,
                            amounts: [2],
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
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );
            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;
        });

        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[1]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 2, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC721.ownerOf(1)).to.equal(signer1.address);
        });

        it('transform() twice, leading to overflow', async () => {
            await transformerInst.connect(signer1).transform(0, [[1]]);
            const tx = await transformerInst.connect(signer1).transform(0, [[1]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([3, 2, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 3, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC721.ownerOf(1)).to.equal(signer1.address);
        });

        it('transform() three times, leading to overflow + NTime exceeded', async () => {
            await transformerInst.connect(signer1).transform(0, [[1]]);
            await transformerInst.connect(signer1).transform(0, [[1]]);
            await expect(transformerInst.connect(signer1).transform(0, [[1]])).to.be.revertedWith(
                'PluginsCore: Used over the limit of n',
            );

            expect(await inputERC721.ownerOf(1)).to.equal(signer1.address);
        });
    });

    describe('consumableType: Burned; input: NFT; modification: mult', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.burned,
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
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );
            await ERC721Inst.grantDna(address);

            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            await inputERC721.connect(signer1).approve(transformerInst.address, 1);
        });

        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[1]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 2, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC721.ownerOf(1)).to.equal(burnAddress);
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
                            token: TokenType.erc1155,
                            consumableType: ConsumableType.burned,
                            contractAddr: inputERC1155.address,
                            amounts: [1, 5],
                            tokenIds: [1, 2],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 3,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 3,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );

            await ERC721Inst.grantDna(address);
            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC1155.connect(signer1).setApprovalForAll(transformerInst.address, true);
        });
        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 3, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC1155.balanceOf(burnAddress, 1)).to.equal(1);
            expect(await inputERC1155.balanceOf(burnAddress, 2)).to.equal(5);
        });
    });

    describe('consumableType: unaffected; input: 1155; modification: set', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc1155,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC1155.address,
                            amounts: [1, 5],
                            tokenIds: [1, 2],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 3,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 3,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );

            await ERC721Inst.grantDna(address);
            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC1155.connect(signer1).setApprovalForAll(transformerInst.address, true);
        });
        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 3, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC1155.balanceOf(signer1.address, 1)).to.equal(100);
            expect(await inputERC1155.balanceOf(signer1.address, 2)).to.equal(100);
        });
    });

    describe('consumableType: unaffected; input: 1155; modification: set overflows', () => {
        let transformerInst: Transformer;

        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc1155,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC1155.address,
                            amounts: [1, 5],
                            tokenIds: [1, 2],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );

            await ERC721Inst.grantDna(address);
            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC1155.connect(signer1).setApprovalForAll(transformerInst.address, true);
        });
        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([1, 2, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC1155.balanceOf(signer1.address, 1)).to.equal(100);
            expect(await inputERC1155.balanceOf(signer1.address, 2)).to.equal(100);
        });
    });

    describe('consumableType: NTime; modification: add, mult, set', () => {
        let transformerInst: Transformer;
        beforeEach(async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC721.address,
                            amounts: [2],
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
                            geneTransformType: GeneTransformType.mult,
                            value: 0,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );

            await ERC721Inst.grantDna(address);
            transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            // approvals
            await inputERC20.connect(signer1).approve(transformerInst.address, 100);
            await inputERC721.connect(signer1).approve(transformerInst.address, 1);
            await inputERC1155.connect(signer1).setApprovalForAll(transformerInst.address, true);
        });

        it('transform()', async () => {
            const tx = await transformerInst.connect(signer1).transform(0, [[1]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([1, 1, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([2, 0, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);
            expect(await inputERC721.ownerOf(1)).to.equal(signer1.address);
        });

        it('transform() two times, leading to overflow + NTime exceeded', async () => {
            await transformerInst.connect(signer1).transform(0, [[1]]);
            const tx = await transformerInst.connect(signer1).transform(0, [[1]]);
            const receipt = await tx.wait();

            const { nftAddr, tokenId, oldDna, newDna } = pick(
                receipt.events?.find((e) => e.event === 'Transform')?.args,
                ['nftAddr', 'tokenId', 'oldDna', 'newDna'],
            );

            expect(oldDna).to.equal(encodeGenesUint256([2, 0, 1], genes));
            expect(newDna).to.equal(encodeGenesUint256([3, 0, 1], genes));

            const attributeNft = (await ethers.getContractAt('ERC721OwlAttributes', nftAddr)) as ERC721OwlAttributes;
            expect(await attributeNft.getDna(tokenId)).to.equal(newDna);

            await expect(transformerInst.connect(signer1).transform(0, [[1]])).to.be.revertedWith(
                'PluginsCore: Used over the limit of n',
            );

            expect(await inputERC721.ownerOf(1)).to.equal(signer1.address);
        });
    });

    describe('Check reverts', async () => {
        it('burn address is zero address', async () => {
            await expect(
                deployClone(
                    transformerImpl,
                    [
                        adminAddress,
                        ethers.constants.AddressZero,
                        [
                            {
                                token: TokenType.erc721,
                                consumableType: ConsumableType.NTime,
                                contractAddr: inputERC721.address,
                                amounts: [2],
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
                                geneTransformType: GeneTransformType.mult,
                                value: 0,
                            },
                            {
                                geneTransformType: GeneTransformType.set,
                                value: 1,
                            },
                        ],
                        ERC721Inst.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                    salt,
                ),
            ).to.be.revertedWith('Transformer: burn address must not be 0');
        });
        it('inputs length is empty', async () => {
            await expect(
                deployClone(
                    transformerImpl,
                    [
                        adminAddress,
                        burnAddress,
                        [],
                        [250, 252, 254],
                        [
                            {
                                geneTransformType: GeneTransformType.add, //add
                                value: 1,
                            },
                            {
                                geneTransformType: GeneTransformType.mult,
                                value: 0,
                            },
                            {
                                geneTransformType: GeneTransformType.set,
                                value: 1,
                            },
                        ],
                        ERC721Inst.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                    salt,
                ),
            ).to.be.revertedWith('Transformer: A crafting input must be given!');
        });
        it('genes length different from modifications length', async () => {
            await expect(
                deployClone(
                    transformerImpl,
                    [
                        adminAddress,
                        burnAddress,
                        [
                            {
                                token: TokenType.erc721,
                                consumableType: ConsumableType.NTime,
                                contractAddr: inputERC721.address,
                                amounts: [2],
                                tokenIds: [],
                            },
                        ],
                        [210, 250, 252, 254],
                        [
                            {
                                geneTransformType: GeneTransformType.add, //add
                                value: 1,
                            },
                            {
                                geneTransformType: GeneTransformType.mult,
                                value: 0,
                            },
                            {
                                geneTransformType: GeneTransformType.set,
                                value: 1,
                            },
                        ],
                        ERC721Inst.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                    salt,
                ),
            ).to.be.revertedWith('Transformer: length of genes must be the same as length of modifications');
        });

        it('caller of unlock not owner of tokenid', async () => {
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC721.address,
                            amounts: [2],
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
                            geneTransformType: GeneTransformType.mult,
                            value: 0,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );

            const transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;

            await expect(transformerInst.connect(signer2).transform(0, [[]])).to.be.revertedWith(
                'Transformer: you are not the owner of that ID!',
            );
        });

        it('user doesnt have NTime token', async () => {
            ERC721Inst.transferFrom(signer1.address, signer2.address, 0);
            const { address } = await deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC721.address,
                            amounts: [2],
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
                            geneTransformType: GeneTransformType.mult,
                            value: 0,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 1,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            );

            const transformerInst = (await ethers.getContractAt('Transformer', address)) as Transformer;
            await expect(transformerInst.connect(signer2).transform(0, [[0]])).to.be.revertedWith(
                'PluginsCore: User does not own token(s)!',
            );
        });
    });

    it('beacon proxy initialization', async () => {
        const beaconFactory = (await ethers.getContractFactory(
            'UpgradeableBeaconInitializable',
        )) as UpgradeableBeaconInitializable__factory;
        const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

        const beaconProxyFactory = (await ethers.getContractFactory(
            'BeaconProxyInitializable',
        )) as BeaconProxyInitializable__factory;
        const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

        const { address: beaconAddr } = await deployClone(beaconImpl, [signer1.address, transformerImpl.address]);
        //@ts-ignore
        const data = transformerImpl.interface.encodeFunctionData('proxyInitialize', [
            adminAddress,
            burnAddress,
            [
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.NTime,
                    contractAddr: inputERC721.address,
                    amounts: [2],
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
                    geneTransformType: GeneTransformType.mult,
                    value: 0,
                },
                {
                    geneTransformType: GeneTransformType.set,
                    value: 1,
                },
            ],
            ERC721Inst.address,
            gsnForwarderAddress,
        ]);
        const { address: beaconProxyAddr } = await deployClone(beaconProxyImpl, [signer1.address, beaconAddr, data]);
        const contrInst = (await ethers.getContractAt('Transformer', beaconProxyAddr)) as Transformer;

        //transformer doesn't have only dna role
        await expect(contrInst.transform(0, [[1]])).to.be.revertedWith(
            `AccessControl: account ${beaconProxyAddr.toLowerCase()} is missing role 0xd81e3d287dc343b6afbd738eeed3ca0a2b77921a595a475a4e43ed25b38ceb2f`,
        );
    });

    describe('validate inputs', async () => {

        it('ERC20 input token ids not empty', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc20,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC20.address,
                            amounts: [1],
                            tokenIds: [1, 2],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: tokenids.length != 0');
        });

        it('ERC20 input amounts not length 1', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc20,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC20.address,
                            amounts: [1, 2],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: amounts.length != 1');
        });

        it('ERC20 consumable type unsupported', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc20,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC20.address,
                            amounts: [1],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: ERC20 consumableType not unaffected or burned');
        });

        it('ERC721 tokens id length not 0', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC721.address,
                            amounts: [1],
                            tokenIds: [1, 2, 3],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: tokenIds.length != 0');
        });

        it('ERC721 consumable type unsupported', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: inputERC721.address,
                            amounts: [1],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: ERC721 consumableType not burned or NTime');
        });

        it('ERC721 NTime empty amounts', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC721.address,
                            amounts: [],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: amounts.length != 1; required for NTime ConsumableType');
        });


        it('ERC721 burned empty amounts', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc721,
                            consumableType: ConsumableType.burned,
                            contractAddr: inputERC721.address,
                            amounts: [5],
                            tokenIds: [],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: amounts.length != 0');
        });

        it('ERC1155 token ID and amounts mismatch', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc1155,
                            consumableType: ConsumableType.burned,
                            contractAddr: inputERC1155.address,
                            amounts: [5],
                            tokenIds: [1, 2],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: tokenids.length != amounts.length');
        });

        it('ERC1155 consumable type unsupported', async () => {
            await expect(deployClone(
                transformerImpl,
                [
                    adminAddress,
                    burnAddress,
                    [
                        {
                            token: TokenType.erc1155,
                            consumableType: ConsumableType.NTime,
                            contractAddr: inputERC1155.address,
                            amounts: [5, 4],
                            tokenIds: [1, 2],
                        },
                    ],
                    [250, 252, 254],
                    [
                        {
                            geneTransformType: GeneTransformType.set, //add
                            value: 4,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 2,
                        },
                        {
                            geneTransformType: GeneTransformType.set,
                            value: 4,
                        },
                    ],
                    ERC721Inst.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
                salt,
            )).to.be.revertedWith('PluginsCore: ERC1155 consumableType not unaffected or burned');
        });
    });
});
