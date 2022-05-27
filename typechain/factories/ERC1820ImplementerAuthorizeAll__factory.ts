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
  "0x608060405234801561001057600080fd5b506101e9806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063249cb3fa14610030575b600080fd5b61004a600480360381019061004591906100e3565b610060565b604051610057919061012e565b60405180910390f35b600080600084815260200190815260200160002060009054906101000a900460ff1661008f576000801b6100b1565b7fa2ef4600d742022d532d4747cb3547474667d6f13804902513b2ec01c848f4b45b905092915050565b6000813590506100c881610185565b92915050565b6000813590506100dd8161019c565b92915050565b600080604083850312156100f657600080fd5b6000610104858286016100ce565b9250506020610115858286016100b9565b9150509250929050565b6101288161015b565b82525050565b6000602082019050610143600083018461011f565b92915050565b600061015482610165565b9050919050565b6000819050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b61018e81610149565b811461019957600080fd5b50565b6101a58161015b565b81146101b057600080fd5b5056fea264697066735822122019718262a424cb43b8b14619aeac797efb0acca1d4a7b1b7b9a197d48985835064736f6c63430008040033";

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
