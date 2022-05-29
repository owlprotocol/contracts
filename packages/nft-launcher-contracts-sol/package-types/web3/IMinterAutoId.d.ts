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

export interface IMinterAutoId extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): IMinterAutoId;
  clone(): IMinterAutoId;
  methods: {
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

    mint(speciesId: number | string | BN): NonPayableTransactionObject<string>;

    safeMint(
      speciesId: number | string | BN
    ): NonPayableTransactionObject<string>;

    setNextTokenId(
      speciesId: number | string | BN,
      nextTokenId_: number | string | BN
    ): NonPayableTransactionObject<void>;

    supportsInterface(
      interfaceId: string | number[]
    ): NonPayableTransactionObject<boolean>;
  };
  events: {
    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };
}
