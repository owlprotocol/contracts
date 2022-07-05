/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ERC721Proxy, ERC721ProxyInterface } from "../ERC721Proxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_codeAddr",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "proxyAddr",
        type: "address",
      },
    ],
    name: "NewClone",
    type: "event",
  },
  {
    inputs: [],
    name: "ADMIN",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "string",
        name: "_baseURI",
        type: "string",
      },
    ],
    name: "createProxy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516107a73803806107a78339818101604052810190610032919061011c565b336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050610149565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100e9826100be565b9050919050565b6100f9816100de565b811461010457600080fd5b50565b600081519050610116816100f0565b92915050565b600060208284031215610132576101316100b9565b5b600061014084828501610107565b91505092915050565b61064f806101586000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632a0acc6a1461003b57806333ef584614610059575b600080fd5b610043610075565b60405161005091906102af565b60405180910390f35b610073600480360381019061006e9190610424565b610099565b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610127576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011e90610528565b60405180910390fd5b6000610154600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16610204565b90508073ffffffffffffffffffffffffffffffffffffffff16635c6d8da1858585336040518563ffffffff1660e01b815260040161019594939291906105bf565b600060405180830381600087803b1580156101af57600080fd5b505af11580156101c3573d6000803e3d6000fd5b505050507fcc1e9c890bc4f4943c457abb8d17f97703b9f7144e1f4a69e50c6e4988ef38b7816040516101f691906102af565b60405180910390a150505050565b6000808260601b90506040517f3d602d80600a3d3981f3363d3d373d3d3d363d7300000000000000000000000081528160148201527f5af43d82803e903d91602b57fd5bf3000000000000000000000000000000000060288201526037816000f092505050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006102998261026e565b9050919050565b6102a98161028e565b82525050565b60006020820190506102c460008301846102a0565b92915050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610331826102e8565b810181811067ffffffffffffffff821117156103505761034f6102f9565b5b80604052505050565b60006103636102ca565b905061036f8282610328565b919050565b600067ffffffffffffffff82111561038f5761038e6102f9565b5b610398826102e8565b9050602081019050919050565b82818337600083830152505050565b60006103c76103c284610374565b610359565b9050828152602081018484840111156103e3576103e26102e3565b5b6103ee8482856103a5565b509392505050565b600082601f83011261040b5761040a6102de565b5b813561041b8482602086016103b4565b91505092915050565b60008060006060848603121561043d5761043c6102d4565b5b600084013567ffffffffffffffff81111561045b5761045a6102d9565b5b610467868287016103f6565b935050602084013567ffffffffffffffff811115610488576104876102d9565b5b610494868287016103f6565b925050604084013567ffffffffffffffff8111156104b5576104b46102d9565b5b6104c1868287016103f6565b9150509250925092565b600082825260208201905092915050565b7f53656e646572206973206e6f742061646d696e00000000000000000000000000600082015250565b60006105126013836104cb565b915061051d826104dc565b602082019050919050565b6000602082019050818103600083015261054181610505565b9050919050565b600081519050919050565b60005b83811015610571578082015181840152602081019050610556565b83811115610580576000848401525b50505050565b600061059182610548565b61059b81856104cb565b93506105ab818560208601610553565b6105b4816102e8565b840191505092915050565b600060808201905081810360008301526105d98187610586565b905081810360208301526105ed8186610586565b905081810360408301526106018185610586565b905061061060608301846102a0565b9594505050505056fea2646970667358221220b127e35dced1aa4f3eb1870d658c9d690687eac873bc3027bf6f825c5cc8439c64736f6c63430008090033";

export class ERC721Proxy__factory extends ContractFactory {
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
    _codeAddr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC721Proxy> {
    return super.deploy(_codeAddr, overrides || {}) as Promise<ERC721Proxy>;
  }
  getDeployTransaction(
    _codeAddr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_codeAddr, overrides || {});
  }
  attach(address: string): ERC721Proxy {
    return super.attach(address) as ERC721Proxy;
  }
  connect(signer: Signer): ERC721Proxy__factory {
    return super.connect(signer) as ERC721Proxy__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC721ProxyInterface {
    return new utils.Interface(_abi) as ERC721ProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC721Proxy {
    return new Contract(address, _abi, signerOrProvider) as ERC721Proxy;
  }
}