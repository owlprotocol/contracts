/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface MinterSimpleMerkleInterface extends ethers.utils.Interface {
  functions: {
    "canImplementInterfaceForAddress(bytes32,address)": FunctionFragment;
    "createSpecies(address,address,address,uint256)": FunctionFragment;
    "getSpecies(uint256)": FunctionFragment;
    "hashKeccakUser()": FunctionFragment;
    "initialize()": FunctionFragment;
    "mint(uint256,uint256,bytes32,bytes32[])": FunctionFragment;
    "safeMint(uint256,uint256,bytes32,bytes32[])": FunctionFragment;
    "setMintGuard(uint256,address)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "canImplementInterfaceForAddress",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "createSpecies",
    values: [string, string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getSpecies",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "hashKeccakUser",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "mint",
    values: [BigNumberish, BigNumberish, BytesLike, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "safeMint",
    values: [BigNumberish, BigNumberish, BytesLike, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "setMintGuard",
    values: [BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "canImplementInterfaceForAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createSpecies",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getSpecies", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "hashKeccakUser",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "safeMint", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setMintGuard",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;

  events: {
    "CreateSpecies(uint256,address,address,address,address,uint256)": EventFragment;
    "Initialized(uint8)": EventFragment;
    "MintSpecies(uint256,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CreateSpecies"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MintSpecies"): EventFragment;
}

export type CreateSpeciesEvent = TypedEvent<
  [BigNumber, string, string, string, string, BigNumber] & {
    speciesId: BigNumber;
    contractAddr: string;
    owner: string;
    mintFeeToken: string;
    mintFeeAddress: string;
    mintFeeAmount: BigNumber;
  }
>;

export type InitializedEvent = TypedEvent<[number] & { version: number }>;

export type MintSpeciesEvent = TypedEvent<
  [BigNumber, string, BigNumber] & {
    speciesId: BigNumber;
    to: string;
    tokenId: BigNumber;
  }
>;

export class MinterSimpleMerkle extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: MinterSimpleMerkleInterface;

  functions: {
    canImplementInterfaceForAddress(
      interfaceHash: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    createSpecies(
      contractAddress: string,
      mintFeeToken: string,
      mintFeeAddress: string,
      mintFeeAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getSpecies(
      speciesId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [string, string, string, BigNumber, string] & {
        contractAddr: string;
        owner: string;
        mintFeeToken: string;
        mintFeeAmount: BigNumber;
        mintFeeAddress: string;
      }
    >;

    hashKeccakUser(overrides?: CallOverrides): Promise<[string]>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    mint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    safeMint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setMintGuard(
      speciesId: BigNumberish,
      mintGuardAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  canImplementInterfaceForAddress(
    interfaceHash: BytesLike,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<string>;

  createSpecies(
    contractAddress: string,
    mintFeeToken: string,
    mintFeeAddress: string,
    mintFeeAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getSpecies(
    speciesId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [string, string, string, BigNumber, string] & {
      contractAddr: string;
      owner: string;
      mintFeeToken: string;
      mintFeeAmount: BigNumber;
      mintFeeAddress: string;
    }
  >;

  hashKeccakUser(overrides?: CallOverrides): Promise<string>;

  initialize(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  mint(
    speciesId: BigNumberish,
    tokenId: BigNumberish,
    merkleRoot: BytesLike,
    merkleProof: BytesLike[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  safeMint(
    speciesId: BigNumberish,
    tokenId: BigNumberish,
    merkleRoot: BytesLike,
    merkleProof: BytesLike[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setMintGuard(
    speciesId: BigNumberish,
    mintGuardAddress: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    canImplementInterfaceForAddress(
      interfaceHash: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<string>;

    createSpecies(
      contractAddress: string,
      mintFeeToken: string,
      mintFeeAddress: string,
      mintFeeAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    getSpecies(
      speciesId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [string, string, string, BigNumber, string] & {
        contractAddr: string;
        owner: string;
        mintFeeToken: string;
        mintFeeAmount: BigNumber;
        mintFeeAddress: string;
      }
    >;

    hashKeccakUser(overrides?: CallOverrides): Promise<string>;

    initialize(overrides?: CallOverrides): Promise<void>;

    mint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    safeMint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    setMintGuard(
      speciesId: BigNumberish,
      mintGuardAddress: string,
      overrides?: CallOverrides
    ): Promise<void>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {
    "CreateSpecies(uint256,address,address,address,address,uint256)"(
      speciesId?: null,
      contractAddr?: null,
      owner?: string | null,
      mintFeeToken?: null,
      mintFeeAddress?: null,
      mintFeeAmount?: null
    ): TypedEventFilter<
      [BigNumber, string, string, string, string, BigNumber],
      {
        speciesId: BigNumber;
        contractAddr: string;
        owner: string;
        mintFeeToken: string;
        mintFeeAddress: string;
        mintFeeAmount: BigNumber;
      }
    >;

    CreateSpecies(
      speciesId?: null,
      contractAddr?: null,
      owner?: string | null,
      mintFeeToken?: null,
      mintFeeAddress?: null,
      mintFeeAmount?: null
    ): TypedEventFilter<
      [BigNumber, string, string, string, string, BigNumber],
      {
        speciesId: BigNumber;
        contractAddr: string;
        owner: string;
        mintFeeToken: string;
        mintFeeAddress: string;
        mintFeeAmount: BigNumber;
      }
    >;

    "Initialized(uint8)"(
      version?: null
    ): TypedEventFilter<[number], { version: number }>;

    Initialized(
      version?: null
    ): TypedEventFilter<[number], { version: number }>;

    "MintSpecies(uint256,address,uint256)"(
      speciesId?: BigNumberish | null,
      to?: null,
      tokenId?: null
    ): TypedEventFilter<
      [BigNumber, string, BigNumber],
      { speciesId: BigNumber; to: string; tokenId: BigNumber }
    >;

    MintSpecies(
      speciesId?: BigNumberish | null,
      to?: null,
      tokenId?: null
    ): TypedEventFilter<
      [BigNumber, string, BigNumber],
      { speciesId: BigNumber; to: string; tokenId: BigNumber }
    >;
  };

  estimateGas: {
    canImplementInterfaceForAddress(
      interfaceHash: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    createSpecies(
      contractAddress: string,
      mintFeeToken: string,
      mintFeeAddress: string,
      mintFeeAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getSpecies(
      speciesId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    hashKeccakUser(overrides?: CallOverrides): Promise<BigNumber>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    mint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    safeMint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setMintGuard(
      speciesId: BigNumberish,
      mintGuardAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    canImplementInterfaceForAddress(
      interfaceHash: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    createSpecies(
      contractAddress: string,
      mintFeeToken: string,
      mintFeeAddress: string,
      mintFeeAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getSpecies(
      speciesId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    hashKeccakUser(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    mint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    safeMint(
      speciesId: BigNumberish,
      tokenId: BigNumberish,
      merkleRoot: BytesLike,
      merkleProof: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setMintGuard(
      speciesId: BigNumberish,
      mintGuardAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
