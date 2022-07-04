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

export interface IMinterBreeding extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): IMinterBreeding;
  clone(): IMinterBreeding;
  methods: {
    breed(
      speciesId: number | string | BN,
      parents: (number | string | BN)[]
    ): NonPayableTransactionObject<string>;

    createSpecies(
      contractAddress: string,
      mintFeeToken: string,
      mintFeeAddress: string,
      mintFeeAmount: number | string | BN
    ): NonPayableTransactionObject<void>;

    getBreedingRules(
      speciesId: number | string | BN
    ): NonPayableTransactionObject<{
      requiredParents: string;
      breedCooldownSeconds: string;
      genes: string[];
      mutationRates: string[];
      0: string;
      1: string;
      2: string[];
      3: string[];
    }>;

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

    safeBreed(
      speciesId: number | string | BN,
      parents: (number | string | BN)[]
    ): NonPayableTransactionObject<string>;

    setBreedingRules(
      speciesId: number | string | BN,
      requiredParents: number | string | BN,
      breedCooldownSeconds: number | string | BN,
      genes: (number | string | BN)[],
      mutationRates: (number | string | BN)[]
    ): NonPayableTransactionObject<string>;

    supportsInterface(
      interfaceId: string | number[]
    ): NonPayableTransactionObject<boolean>;
  };
  events: {
    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };
}