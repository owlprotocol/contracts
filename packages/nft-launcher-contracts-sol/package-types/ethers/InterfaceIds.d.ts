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

interface InterfaceIdsInterface extends ethers.utils.Interface {
  functions: {
    "minterAutoIdInterfaceId()": FunctionFragment;
    "minterBreedingInterfaceId()": FunctionFragment;
    "minterCoreInterfaceId()": FunctionFragment;
    "minterRandomInterfaceId()": FunctionFragment;
    "minterSimpleInterfaceId()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "minterAutoIdInterfaceId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "minterBreedingInterfaceId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "minterCoreInterfaceId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "minterRandomInterfaceId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "minterSimpleInterfaceId",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "minterAutoIdInterfaceId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "minterBreedingInterfaceId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "minterCoreInterfaceId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "minterRandomInterfaceId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "minterSimpleInterfaceId",
    data: BytesLike
  ): Result;

  events: {};
}

export class InterfaceIds extends BaseContract {
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

  interface: InterfaceIdsInterface;

  functions: {
    minterAutoIdInterfaceId(overrides?: CallOverrides): Promise<[string]>;

    minterBreedingInterfaceId(overrides?: CallOverrides): Promise<[string]>;

    minterCoreInterfaceId(overrides?: CallOverrides): Promise<[string]>;

    minterRandomInterfaceId(overrides?: CallOverrides): Promise<[string]>;

    minterSimpleInterfaceId(overrides?: CallOverrides): Promise<[string]>;
  };

  minterAutoIdInterfaceId(overrides?: CallOverrides): Promise<string>;

  minterBreedingInterfaceId(overrides?: CallOverrides): Promise<string>;

  minterCoreInterfaceId(overrides?: CallOverrides): Promise<string>;

  minterRandomInterfaceId(overrides?: CallOverrides): Promise<string>;

  minterSimpleInterfaceId(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    minterAutoIdInterfaceId(overrides?: CallOverrides): Promise<string>;

    minterBreedingInterfaceId(overrides?: CallOverrides): Promise<string>;

    minterCoreInterfaceId(overrides?: CallOverrides): Promise<string>;

    minterRandomInterfaceId(overrides?: CallOverrides): Promise<string>;

    minterSimpleInterfaceId(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    minterAutoIdInterfaceId(overrides?: CallOverrides): Promise<BigNumber>;

    minterBreedingInterfaceId(overrides?: CallOverrides): Promise<BigNumber>;

    minterCoreInterfaceId(overrides?: CallOverrides): Promise<BigNumber>;

    minterRandomInterfaceId(overrides?: CallOverrides): Promise<BigNumber>;

    minterSimpleInterfaceId(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    minterAutoIdInterfaceId(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    minterBreedingInterfaceId(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    minterCoreInterfaceId(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    minterRandomInterfaceId(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    minterSimpleInterfaceId(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}