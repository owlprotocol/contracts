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

export type CreateSpecies = ContractEventLog<{
  speciesId: string;
  contractAddr: string;
  owner: string;
  mintFeeToken: string;
  mintFeeAddress: string;
  mintFeeAmount: string;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}>;
export type Initialized = ContractEventLog<{
  version: string;
  0: string;
}>;
export type MintSpecies = ContractEventLog<{
  speciesId: string;
  to: string;
  tokenId: string;
  0: string;
  1: string;
  2: string;
}>;

export interface MinterAutoId extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): MinterAutoId;
  clone(): MinterAutoId;
  methods: {
    canImplementInterfaceForAddress(
      interfaceHash: string | number[],
      arg1: string
    ): NonPayableTransactionObject<string>;

    createSpecies(
      contractAddress: string,
      mintFeeToken: string,
      mintFeeAddress: string,
      mintFeeAmount: number | string | BN
    ): NonPayableTransactionObject<void>;

    getSpecies(speciesId: number | string | BN): NonPayableTransactionObject<{
      contractAddr: string;
      owner: string;
      mintFeeToken: string;
      mintFeeAmount: string;
      mintFeeAddress: string;
      0: string;
      1: string;
      2: string;
      3: string;
      4: string;
    }>;

    initialize(): NonPayableTransactionObject<void>;

    mint(speciesId: number | string | BN): NonPayableTransactionObject<string>;

    safeMint(
      speciesId: number | string | BN
    ): NonPayableTransactionObject<string>;

    setMintGuard(
      speciesId: number | string | BN,
      mintGuardAddress: string
    ): NonPayableTransactionObject<void>;

    setNextTokenId(
      speciesId: number | string | BN,
      nextTokenId_: number | string | BN
    ): NonPayableTransactionObject<void>;

    supportsInterface(
      interfaceId: string | number[]
    ): NonPayableTransactionObject<boolean>;
  };
  events: {
    CreateSpecies(cb?: Callback<CreateSpecies>): EventEmitter;
    CreateSpecies(
      options?: EventOptions,
      cb?: Callback<CreateSpecies>
    ): EventEmitter;

    Initialized(cb?: Callback<Initialized>): EventEmitter;
    Initialized(
      options?: EventOptions,
      cb?: Callback<Initialized>
    ): EventEmitter;

    MintSpecies(cb?: Callback<MintSpecies>): EventEmitter;
    MintSpecies(
      options?: EventOptions,
      cb?: Callback<MintSpecies>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "CreateSpecies", cb: Callback<CreateSpecies>): void;
  once(
    event: "CreateSpecies",
    options: EventOptions,
    cb: Callback<CreateSpecies>
  ): void;

  once(event: "Initialized", cb: Callback<Initialized>): void;
  once(
    event: "Initialized",
    options: EventOptions,
    cb: Callback<Initialized>
  ): void;

  once(event: "MintSpecies", cb: Callback<MintSpecies>): void;
  once(
    event: "MintSpecies",
    options: EventOptions,
    cb: Callback<MintSpecies>
  ): void;
}
