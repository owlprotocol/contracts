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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface RosalindTestLabInterface extends ethers.utils.Interface {
  functions: {
    "breedDNAGenCount(uint256,uint256[])": FunctionFragment;
    "breedDNASimple(uint256[],uint8[],uint256)": FunctionFragment;
    "breedDNAWithMutations(uint256[],uint8[],uint256,uint256[])": FunctionFragment;
    "generateMutations(uint256,uint8[],uint256,uint256[])": FunctionFragment;
    "getGenCount(uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "breedDNAGenCount",
    values: [BigNumberish, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "breedDNASimple",
    values: [BigNumberish[], BigNumberish[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "breedDNAWithMutations",
    values: [BigNumberish[], BigNumberish[], BigNumberish, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "generateMutations",
    values: [BigNumberish, BigNumberish[], BigNumberish, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getGenCount",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "breedDNAGenCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "breedDNASimple",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "breedDNAWithMutations",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "generateMutations",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getGenCount",
    data: BytesLike
  ): Result;

  events: {};
}

export class RosalindTestLab extends BaseContract {
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

  interface: RosalindTestLabInterface;

  functions: {
    breedDNAGenCount(
      child: BigNumberish,
      parents: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    breedDNASimple(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    breedDNAWithMutations(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { childDNA: BigNumber }>;

    generateMutations(
      dna: BigNumberish,
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { mutatedDNA: BigNumber }>;

    getGenCount(
      child: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  breedDNAGenCount(
    child: BigNumberish,
    parents: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  breedDNASimple(
    parents: BigNumberish[],
    genes: BigNumberish[],
    randomSeed: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  breedDNAWithMutations(
    parents: BigNumberish[],
    genes: BigNumberish[],
    randomSeed: BigNumberish,
    mutationRates: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  generateMutations(
    dna: BigNumberish,
    genes: BigNumberish[],
    randomSeed: BigNumberish,
    mutationRates: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getGenCount(
    child: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    breedDNAGenCount(
      child: BigNumberish,
      parents: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    breedDNASimple(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    breedDNAWithMutations(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    generateMutations(
      dna: BigNumberish,
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getGenCount(
      child: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    breedDNAGenCount(
      child: BigNumberish,
      parents: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    breedDNASimple(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    breedDNAWithMutations(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    generateMutations(
      dna: BigNumberish,
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getGenCount(
      child: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    breedDNAGenCount(
      child: BigNumberish,
      parents: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    breedDNASimple(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    breedDNAWithMutations(
      parents: BigNumberish[],
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    generateMutations(
      dna: BigNumberish,
      genes: BigNumberish[],
      randomSeed: BigNumberish,
      mutationRates: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getGenCount(
      child: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}