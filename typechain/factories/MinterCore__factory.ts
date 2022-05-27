/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { MinterCore, MinterCoreInterface } from "../MinterCore";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "speciesId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "contractAddr",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "mintFeeToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "mintFeeAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "mintFeeAmount",
        type: "uint256",
      },
    ],
    name: "CreateSpecies",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "interfaceHash",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "canImplementInterfaceForAddress",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "mintFeeToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "mintFeeAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "mintFeeAmount",
        type: "uint256",
      },
    ],
    name: "createSpecies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "speciesId",
        type: "uint256",
      },
    ],
    name: "getSpecies",
    outputs: [
      {
        internalType: "address",
        name: "contractAddr",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "mintFeeToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "mintFeeAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "mintFeeAddress",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "speciesId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "mintGuardAddress",
        type: "address",
      },
    ],
    name: "setMintGuard",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class MinterCore__factory {
  static readonly abi = _abi;
  static createInterface(): MinterCoreInterface {
    return new utils.Interface(_abi) as MinterCoreInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MinterCore {
    return new Contract(address, _abi, signerOrProvider) as MinterCore;
  }
}
