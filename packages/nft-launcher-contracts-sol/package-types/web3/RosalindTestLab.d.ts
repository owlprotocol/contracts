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

export interface RosalindTestLab extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): RosalindTestLab;
  clone(): RosalindTestLab;
  methods: {
    breedDNAGenCount(
      child: number | string | BN,
      parents: (number | string | BN)[]
    ): NonPayableTransactionObject<string>;

    breedDNASimple(
      parents: (number | string | BN)[],
      genes: (number | string | BN)[],
      randomSeed: number | string | BN
    ): NonPayableTransactionObject<string>;

    breedDNAWithMutations(
      parents: (number | string | BN)[],
      genes: (number | string | BN)[],
      randomSeed: number | string | BN,
      mutationRates: (number | string | BN)[]
    ): NonPayableTransactionObject<string>;

    generateMutations(
      dna: number | string | BN,
      genes: (number | string | BN)[],
      randomSeed: number | string | BN,
      mutationRates: (number | string | BN)[]
    ): NonPayableTransactionObject<string>;

    getGenCount(
      child: number | string | BN
    ): NonPayableTransactionObject<string>;
  };
  events: {
    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };
}
