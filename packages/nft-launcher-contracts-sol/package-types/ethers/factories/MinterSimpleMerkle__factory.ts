/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  MinterSimpleMerkle,
  MinterSimpleMerkleInterface,
} from "../MinterSimpleMerkle";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "speciesId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "MintSpecies",
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
    inputs: [],
    name: "hashKeccakUser",
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
    inputs: [],
    name: "initialize",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
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
    name: "mint",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
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
    name: "safeMint",
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

const _bytecode =
  "0x60806040523480156200001157600080fd5b506000620000266001620000ae60201b60201c565b905080156200004b576001600060016101000a81548160ff0219169083151502179055505b8015620000a75760008060016101000a81548160ff0219169083151502179055507f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb384740249860016040516200009e919062000231565b60405180910390a15b50620002f7565b60008060019054906101000a900460ff1615620001385760018260ff16148015620000ec5750620000ea30620001b460201b620008891760201c565b155b6200012e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016200012590620002d5565b60405180910390fd5b60009050620001af565b8160ff1660008054906101000a900460ff1660ff161062000190576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016200018790620002d5565b60405180910390fd5b816000806101000a81548160ff021916908360ff160217905550600190505b919050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b6000819050919050565b600060ff82169050919050565b6000819050919050565b600062000219620002136200020d84620001d7565b620001ee565b620001e1565b9050919050565b6200022b81620001f8565b82525050565b600060208201905062000248600083018462000220565b92915050565b600082825260208201905092915050565b7f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160008201527f647920696e697469616c697a6564000000000000000000000000000000000000602082015250565b6000620002bd602e836200024e565b9150620002ca826200025f565b604082019050919050565b60006020820190508181036000830152620002f081620002ae565b9050919050565b611d9480620003076000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c80633d7fe7b2116100665780633d7fe7b21461014857806364524dd9146101645780638129fc1c14610182578063de5e938e1461018c578063ea0b2c0e146101a857610093565b806301ffc9a71461009857806323247105146100c8578063249cb3fa146100e45780632be6a2a914610114575b600080fd5b6100b260048036038101906100ad91906112b3565b6101c4565b6040516100bf91906112fb565b60405180910390f35b6100e260048036038101906100dd91906113e7565b61023c565b005b6100fe60048036038101906100f991906114cd565b610344565b60405161010b919061151c565b60405180910390f35b61012e60048036038101906101299190611537565b61039e565b60405161013f959493929190611582565b60405180910390f35b610162600480360381019061015d91906113e7565b610469565b005b61016c610571565b604051610179919061151c565b60405180910390f35b61018a61059f565b005b6101a660048036038101906101a191906115d5565b61068b565b005b6101c260048036038101906101bd919061163c565b610830565b005b60006101cf826108ac565b80610235575060016000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060009054906101000a900460ff165b9050919050565b846004600082815260200190815260200160002060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff1614156102e3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102da906116d9565b60405180910390fd5b858484846102f384848484610916565b6102fe8a338b610a66565b897f8bf50312adaaf209a92a83a9dc5a552047b8f3da5809e85aaff1bb86b979ed81338b6040516103309291906116f9565b60405180910390a250505050505050505050565b60006002600084815260200190815260200160002060009054906101000a900460ff16610374576000801b610396565b7fa2ef4600d742022d532d4747cb3547474667d6f13804902513b2ec01c848f4b45b905092915050565b6000806000806000806004600088815260200190815260200160002090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168160010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168260020160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1683600301548460040160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16955095509550955095505091939590929450565b846004600082815260200190815260200160002060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff161415610510576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610507906116d9565b60405180910390fd5b8584848461052084848484610916565b61052b8a338b610b6c565b897f8bf50312adaaf209a92a83a9dc5a552047b8f3da5809e85aaff1bb86b979ed81338b60405161055d9291906116f9565b60405180910390a250505050505050505050565b6000336040516020016105849190611722565b60405160208183030381529060405280519060200120905090565b60006105ab6001610c72565b905080156105cf576001600060016101000a81548160ff0219169083151502179055505b6105d7610d62565b60007f31a5b62e71964a1df02721f445e8b5bae728f4aa35fafa483c870206766d7a10905061060581610e46565b61062e7f1e5b96b700000000000000000000000000000000000000000000000000000000610e75565b5080156106885760008060016101000a81548160ff0219169083151502179055507f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498600160405161067f919061178f565b60405180910390a15b50565b6106956003610f4a565b6000600460006106a56003610f60565b81526020019081526020016000209050848160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550338160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550838160020160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550828160040160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508181600301819055503373ffffffffffffffffffffffffffffffffffffffff167fd83a2cae25dbbcad2777652cdf5dd52554093b0c8b7d4d4b20bdef825d28ba8461080c6003610f60565b878787876040516108219594939291906117aa565b60405180910390a25050505050565b806004600084815260200190815260200160002060050160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b60006004600086815260200190815260200160002060050160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610a5f57600115158173ffffffffffffffffffffffffffffffffffffffff1663095f1d4387338888886040518663ffffffff1660e01b81526004016109ca95949392919061187e565b602060405180830381600087803b1580156109e457600080fd5b505af11580156109f8573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a1c91906118f8565b151514610a5e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a5590611971565b60405180910390fd5b5b5050505050565b6000600460008581526020019081526020016000209050610ad58160020160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16848360040160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168460030154610f6e565b8060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166340c10f1984846040518363ffffffff1660e01b8152600401610b349291906116f9565b600060405180830381600087803b158015610b4e57600080fd5b505af1158015610b62573d6000803e3d6000fd5b5050505050505050565b6000600460008581526020019081526020016000209050610bdb8160020160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16848360040160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168460030154610f6e565b8060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a144819484846040518363ffffffff1660e01b8152600401610c3a9291906116f9565b600060405180830381600087803b158015610c5457600080fd5b505af1158015610c68573d6000803e3d6000fd5b5050505050505050565b60008060019054906101000a900460ff1615610ce95760018260ff16148015610ca15750610c9f30610889565b155b610ce0576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cd790611a03565b60405180910390fd5b60009050610d5d565b8160ff1660008054906101000a900460ff1660ff1610610d3e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d3590611a03565b60405180910390fd5b816000806101000a81548160ff021916908360ff160217905550600190505b919050565b6000610d6e6001610c72565b90508015610d92576001600060016101000a81548160ff0219169083151502179055505b60007fe5768001ceb4673781b1d04ea3de1953b0a39f10c0fea931ef5fd3b1694cb4839050610dc081610e46565b610de97ff5b8312700000000000000000000000000000000000000000000000000000000610e75565b508015610e435760008060016101000a81548160ff0219169083151502179055507f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024986001604051610e3a919061178f565b60405180910390a15b50565b60016002600083815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b63ffffffff60e01b817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161415610ede576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ed590611a6f565b60405180910390fd5b6001806000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b6001816000016000828254019250508190555050565b600081600001549050919050565b610ff1846323b872dd60e01b858585604051602401610f8f93929190611a8f565b604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050610ff7565b50505050565b6000611059826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c65648152508573ffffffffffffffffffffffffffffffffffffffff166110be9092919063ffffffff16565b90506000815111156110b9578080602001905181019061107991906118f8565b6110b8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110af90611b38565b60405180910390fd5b5b505050565b60606110cd84846000856110d6565b90509392505050565b60608247101561111b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161111290611bca565b60405180910390fd5b61112485610889565b611163576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161115a90611c36565b60405180910390fd5b6000808673ffffffffffffffffffffffffffffffffffffffff16858760405161118c9190611cd0565b60006040518083038185875af1925050503d80600081146111c9576040519150601f19603f3d011682016040523d82523d6000602084013e6111ce565b606091505b50915091506111de8282866111ea565b92505050949350505050565b606083156111fa5782905061124a565b60008351111561120d5782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016112419190611d3c565b60405180910390fd5b9392505050565b600080fd5b600080fd5b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6112908161125b565b811461129b57600080fd5b50565b6000813590506112ad81611287565b92915050565b6000602082840312156112c9576112c8611251565b5b60006112d78482850161129e565b91505092915050565b60008115159050919050565b6112f5816112e0565b82525050565b600060208201905061131060008301846112ec565b92915050565b6000819050919050565b61132981611316565b811461133457600080fd5b50565b60008135905061134681611320565b92915050565b6000819050919050565b61135f8161134c565b811461136a57600080fd5b50565b60008135905061137c81611356565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126113a7576113a6611382565b5b8235905067ffffffffffffffff8111156113c4576113c3611387565b5b6020830191508360208202830111156113e0576113df61138c565b5b9250929050565b60008060008060006080868803121561140357611402611251565b5b600061141188828901611337565b955050602061142288828901611337565b94505060406114338882890161136d565b935050606086013567ffffffffffffffff81111561145457611453611256565b5b61146088828901611391565b92509250509295509295909350565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061149a8261146f565b9050919050565b6114aa8161148f565b81146114b557600080fd5b50565b6000813590506114c7816114a1565b92915050565b600080604083850312156114e4576114e3611251565b5b60006114f28582860161136d565b9250506020611503858286016114b8565b9150509250929050565b6115168161134c565b82525050565b6000602082019050611531600083018461150d565b92915050565b60006020828403121561154d5761154c611251565b5b600061155b84828501611337565b91505092915050565b61156d8161148f565b82525050565b61157c81611316565b82525050565b600060a0820190506115976000830188611564565b6115a46020830187611564565b6115b16040830186611564565b6115be6060830185611573565b6115cb6080830184611564565b9695505050505050565b600080600080608085870312156115ef576115ee611251565b5b60006115fd878288016114b8565b945050602061160e878288016114b8565b935050604061161f878288016114b8565b925050606061163087828801611337565b91505092959194509250565b6000806040838503121561165357611652611251565b5b600061166185828601611337565b9250506020611672858286016114b8565b9150509250929050565b600082825260208201905092915050565b7f5370656369657320646f6573206e6f7420657869737421000000000000000000600082015250565b60006116c360178361167c565b91506116ce8261168d565b602082019050919050565b600060208201905081810360008301526116f2816116b6565b9050919050565b600060408201905061170e6000830185611564565b61171b6020830184611573565b9392505050565b60006020820190506117376000830184611564565b92915050565b6000819050919050565b600060ff82169050919050565b6000819050919050565b600061177961177461176f8461173d565b611754565b611747565b9050919050565b6117898161175e565b82525050565b60006020820190506117a46000830184611780565b92915050565b600060a0820190506117bf6000830188611573565b6117cc6020830187611564565b6117d96040830186611564565b6117e66060830185611564565b6117f36080830184611573565b9695505050505050565b600082825260208201905092915050565b600080fd5b82818337600083830152505050565b600061182e83856117fd565b93507f07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8311156118615761186061180e565b5b602083029250611872838584611813565b82840190509392505050565b60006080820190506118936000830188611573565b6118a06020830187611564565b6118ad604083018661150d565b81810360608301526118c0818486611822565b90509695505050505050565b6118d5816112e0565b81146118e057600080fd5b50565b6000815190506118f2816118cc565b92915050565b60006020828403121561190e5761190d611251565b5b600061191c848285016118e3565b91505092915050565b7f4d696e742064656e696564210000000000000000000000000000000000000000600082015250565b600061195b600c8361167c565b915061196682611925565b602082019050919050565b6000602082019050818103600083015261198a8161194e565b9050919050565b7f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160008201527f647920696e697469616c697a6564000000000000000000000000000000000000602082015250565b60006119ed602e8361167c565b91506119f882611991565b604082019050919050565b60006020820190508181036000830152611a1c816119e0565b9050919050565b7f4552433136353a20696e76616c696420696e7465726661636520696400000000600082015250565b6000611a59601c8361167c565b9150611a6482611a23565b602082019050919050565b60006020820190508181036000830152611a8881611a4c565b9050919050565b6000606082019050611aa46000830186611564565b611ab16020830185611564565b611abe6040830184611573565b949350505050565b7f5361666545524332303a204552433230206f7065726174696f6e20646964206e60008201527f6f74207375636365656400000000000000000000000000000000000000000000602082015250565b6000611b22602a8361167c565b9150611b2d82611ac6565b604082019050919050565b60006020820190508181036000830152611b5181611b15565b9050919050565b7f416464726573733a20696e73756666696369656e742062616c616e636520666f60008201527f722063616c6c0000000000000000000000000000000000000000000000000000602082015250565b6000611bb460268361167c565b9150611bbf82611b58565b604082019050919050565b60006020820190508181036000830152611be381611ba7565b9050919050565b7f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000600082015250565b6000611c20601d8361167c565b9150611c2b82611bea565b602082019050919050565b60006020820190508181036000830152611c4f81611c13565b9050919050565b600081519050919050565b600081905092915050565b60005b83811015611c8a578082015181840152602081019050611c6f565b83811115611c99576000848401525b50505050565b6000611caa82611c56565b611cb48185611c61565b9350611cc4818560208601611c6c565b80840191505092915050565b6000611cdc8284611c9f565b915081905092915050565b600081519050919050565b6000601f19601f8301169050919050565b6000611d0e82611ce7565b611d18818561167c565b9350611d28818560208601611c6c565b611d3181611cf2565b840191505092915050565b60006020820190508181036000830152611d568184611d03565b90509291505056fea26469706673582212207dbd6623e827cabdaeb85a8a140ee1e9a4f1745388cbbef7cab69428f54e607064736f6c63430008090033";

export class MinterSimpleMerkle__factory extends ContractFactory {
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
  ): Promise<MinterSimpleMerkle> {
    return super.deploy(overrides || {}) as Promise<MinterSimpleMerkle>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MinterSimpleMerkle {
    return super.attach(address) as MinterSimpleMerkle;
  }
  connect(signer: Signer): MinterSimpleMerkle__factory {
    return super.connect(signer) as MinterSimpleMerkle__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MinterSimpleMerkleInterface {
    return new utils.Interface(_abi) as MinterSimpleMerkleInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MinterSimpleMerkle {
    return new Contract(address, _abi, signerOrProvider) as MinterSimpleMerkle;
  }
}
