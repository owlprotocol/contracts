/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  MintGuardMerkle,
  MintGuardMerkleInterface,
} from "../MintGuardMerkle";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "minterContract",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "speciesId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "merkleRoot",
        type: "bytes32",
      },
    ],
    name: "SetAllowedRoot",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "minterContract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "speciesId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "merkleRoot",
        type: "bytes32",
      },
    ],
    name: "addAllowedRoot",
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
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "merkleRoot",
        type: "bytes32",
      },
      {
        internalType: "bytes32[]",
        name: "merkleProof",
        type: "bytes32[]",
      },
    ],
    name: "allowMint",
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
  {
    inputs: [
      {
        internalType: "address",
        name: "minterContract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "speciesId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "merkleRoot",
        type: "bytes32",
      },
    ],
    name: "removeAllowedRoot",
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

const _bytecode =
  "0x608060405234801561001057600080fd5b50610bc6806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806301ffc9a714610051578063095f1d4314610081578063a4cd7abc146100b1578063b0742323146100cd575b600080fd5b61006b600480360381019061006691906107e8565b6100e9565b6040516100789190610965565b60405180910390f35b61009b60048036038101906100969190610811565b610153565b6040516100a89190610965565b60405180910390f35b6100cb60048036038101906100c69190610799565b610268565b005b6100e760048036038101906100e29190610799565b6103fc565b005b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b60008033878660405160200161016b9392919061092e565b604051602081830303815290604052805190602001209050600080600083815260200190815260200160002054905085811480156101aa575060008114155b6101e9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101e0906109a0565b60405180910390fd5b61025b858580806020026020016040519081016040528093929190818152602001838360200280828437600081840152601f19601f8201169050808301925050505050505087896040516020016102409190610913565b60405160208183030381529060405280519060200120610591565b9250505095945050505050565b828260008273ffffffffffffffffffffffffffffffffffffffff16632be6a2a9836040518263ffffffff1660e01b81526004016102a591906109c0565b60a06040518083038186803b1580156102bd57600080fd5b505afa1580156102d1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102f59190610722565b9091929350909150905050809150503373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610372576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161036990610980565b60405180910390fd5b60008686866040516020016103899392919061092e565b60405160208183030381529060405280519060200120905084600080838152602001908152602001600020819055507f451af3fcce1e66864a8194c388b6e43eb583fb7d2722313e01cfbabfa63e88978787876040516103eb9392919061092e565b60405180910390a150505050505050565b828260008273ffffffffffffffffffffffffffffffffffffffff16632be6a2a9836040518263ffffffff1660e01b815260040161043991906109c0565b60a06040518083038186803b15801561045157600080fd5b505afa158015610465573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104899190610722565b9091929350909150905050809150503373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610506576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104fd90610980565b60405180910390fd5b600086868660405160200161051d9392919061092e565b6040516020818303038152906040528051906020012090506000806000838152602001908152602001600020819055507f451af3fcce1e66864a8194c388b6e43eb583fb7d2722313e01cfbabfa63e88978787876040516105809392919061092e565b60405180910390a150505050505050565b60008261059e85846105a8565b1490509392505050565b60008082905060005b84518110156106385760008582815181106105f5577f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60200260200101519050808311610617576106108382610643565b9250610624565b6106218184610643565b92505b50808061063090610a6a565b9150506105b1565b508091505092915050565b600082600052816020526040600020905092915050565b60008135905061066981610b34565b92915050565b60008151905061067e81610b34565b92915050565b60008083601f84011261069657600080fd5b8235905067ffffffffffffffff8111156106af57600080fd5b6020830191508360208202830111156106c757600080fd5b9250929050565b6000813590506106dd81610b4b565b92915050565b6000813590506106f281610b62565b92915050565b60008135905061070781610b79565b92915050565b60008151905061071c81610b79565b92915050565b600080600080600060a0868803121561073a57600080fd5b60006107488882890161066f565b95505060206107598882890161066f565b945050604061076a8882890161066f565b935050606061077b8882890161070d565b925050608061078c8882890161066f565b9150509295509295909350565b6000806000606084860312156107ae57600080fd5b60006107bc8682870161065a565b93505060206107cd868287016106f8565b92505060406107de868287016106ce565b9150509250925092565b6000602082840312156107fa57600080fd5b6000610808848285016106e3565b91505092915050565b60008060008060006080868803121561082957600080fd5b6000610837888289016106f8565b95505060206108488882890161065a565b9450506040610859888289016106ce565b935050606086013567ffffffffffffffff81111561087657600080fd5b61088288828901610684565b92509250509295509295909350565b61089a816109ec565b82525050565b6108a9816109fe565b82525050565b6108b881610a0a565b82525050565b60006108cb600e836109db565b91506108d682610ae2565b602082019050919050565b60006108ee6012836109db565b91506108f982610b0b565b602082019050919050565b61090d81610a60565b82525050565b60006020820190506109286000830184610891565b92915050565b60006060820190506109436000830186610891565b6109506020830185610904565b61095d60408301846108af565b949350505050565b600060208201905061097a60008301846108a0565b92915050565b60006020820190508181036000830152610999816108be565b9050919050565b600060208201905081810360008301526109b9816108e1565b9050919050565b60006020820190506109d56000830184610904565b92915050565b600082825260208201905092915050565b60006109f782610a40565b9050919050565b60008115159050919050565b6000819050919050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b6000610a7582610a60565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415610aa857610aa7610ab3565b5b600182019050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e6f7420746865206f776e657221000000000000000000000000000000000000600082015250565b7f4e6f207065726d697373696f6e20736574210000000000000000000000000000600082015250565b610b3d816109ec565b8114610b4857600080fd5b50565b610b5481610a0a565b8114610b5f57600080fd5b50565b610b6b81610a14565b8114610b7657600080fd5b50565b610b8281610a60565b8114610b8d57600080fd5b5056fea2646970667358221220d2398da43f454914b3daa859a5cd167bb93463d97dbac3e6c11a8da1ee2a75bd64736f6c63430008040033";

export class MintGuardMerkle__factory extends ContractFactory {
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
  ): Promise<MintGuardMerkle> {
    return super.deploy(overrides || {}) as Promise<MintGuardMerkle>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MintGuardMerkle {
    return super.attach(address) as MintGuardMerkle;
  }
  connect(signer: Signer): MintGuardMerkle__factory {
    return super.connect(signer) as MintGuardMerkle__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MintGuardMerkleInterface {
    return new utils.Interface(_abi) as MintGuardMerkleInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MintGuardMerkle {
    return new Contract(address, _abi, signerOrProvider) as MintGuardMerkle;
  }
}