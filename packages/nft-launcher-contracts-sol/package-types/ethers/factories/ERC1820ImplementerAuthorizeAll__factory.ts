/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ERC1820ImplementerAuthorizeAll,
  ERC1820ImplementerAuthorizeAllInterface,
} from "../ERC1820ImplementerAuthorizeAll";

const _abi = [
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506101f2806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063249cb3fa14610030575b600080fd5b61004a60048036038101906100459190610152565b610060565b60405161005791906101a1565b60405180910390f35b600080600084815260200190815260200160002060009054906101000a900460ff1661008f576000801b6100b1565b7fa2ef4600d742022d532d4747cb3547474667d6f13804902513b2ec01c848f4b45b905092915050565b600080fd5b6000819050919050565b6100d1816100be565b81146100dc57600080fd5b50565b6000813590506100ee816100c8565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061011f826100f4565b9050919050565b61012f81610114565b811461013a57600080fd5b50565b60008135905061014c81610126565b92915050565b60008060408385031215610169576101686100b9565b5b6000610177858286016100df565b92505060206101888582860161013d565b9150509250929050565b61019b816100be565b82525050565b60006020820190506101b66000830184610192565b9291505056fea26469706673582212209b9f98b23c00f6a8ef44bcf2dae428b43d8db40ac77e57fbc76159c4ae30ff4b64736f6c63430008090033";

export class ERC1820ImplementerAuthorizeAll__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC1820ImplementerAuthorizeAll> {
    return super.deploy(
      overrides || {}
    ) as Promise<ERC1820ImplementerAuthorizeAll>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ERC1820ImplementerAuthorizeAll {
    return super.attach(address) as ERC1820ImplementerAuthorizeAll;
  }
  connect(signer: Signer): ERC1820ImplementerAuthorizeAll__factory {
    return super.connect(signer) as ERC1820ImplementerAuthorizeAll__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC1820ImplementerAuthorizeAllInterface {
    return new utils.Interface(_abi) as ERC1820ImplementerAuthorizeAllInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC1820ImplementerAuthorizeAll {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as ERC1820ImplementerAuthorizeAll;
  }
}
