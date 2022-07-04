/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { ContractOptions } from "web3-eth-contract";
import { EventLog } from "web3-core";
import { EventEmitter } from "events";
import {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from "./types";

interface EventOptions {
  filter?: object;
  fromBlock?: BlockType;
  topics?: string[];
}

export type AddAllowedUser = ContractEventLog<{
  minterContract: string;
  speciesId: string;
  user: string;
  0: string;
  1: string;
  2: string;
}>;
export type RemoveAllowedUser = ContractEventLog<{
  minterContract: string;
  speciesId: string;
  user: string;
  0: string;
  1: string;
  2: string;
}>;

export interface MintGuardAllowlist extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): MintGuardAllowlist;
  clone(): MintGuardAllowlist;
  methods: {
    addAllowedUser(
      minterContract: string,
      speciesId: number | string | BN,
      user: string
    ): NonPayableTransactionObject<void>;

    allowMint(
      speciesId: number | string | BN,
      user: string
    ): NonPayableTransactionObject<boolean>;

    removeAllowedUser(
      minterContract: string,
      speciesId: number | string | BN,
      user: string
    ): NonPayableTransactionObject<void>;

    supportsInterface(
      interfaceId: string | number[]
    ): NonPayableTransactionObject<boolean>;
  };
  events: {
    AddAllowedUser(cb?: Callback<AddAllowedUser>): EventEmitter;
    AddAllowedUser(
      options?: EventOptions,
      cb?: Callback<AddAllowedUser>
    ): EventEmitter;

    RemoveAllowedUser(cb?: Callback<RemoveAllowedUser>): EventEmitter;
    RemoveAllowedUser(
      options?: EventOptions,
      cb?: Callback<RemoveAllowedUser>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "AddAllowedUser", cb: Callback<AddAllowedUser>): void;
  once(
    event: "AddAllowedUser",
    options: EventOptions,
    cb: Callback<AddAllowedUser>
  ): void;

  once(event: "RemoveAllowedUser", cb: Callback<RemoveAllowedUser>): void;
  once(
    event: "RemoveAllowedUser",
    options: EventOptions,
    cb: Callback<RemoveAllowedUser>
  ): void;
}