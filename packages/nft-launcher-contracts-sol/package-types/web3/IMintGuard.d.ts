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

export interface IMintGuard extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): IMintGuard;
  clone(): IMintGuard;
  methods: {
    "allowMint(uint256,address,bytes32,bytes32[])"(
      speciesId: number | string | BN,
      userMinting: string,
      merkleRoot: string | number[],
      merkleProof: (string | number[])[]
    ): NonPayableTransactionObject<boolean>;

    "allowMint(uint256,address)"(
      speciesId: number | string | BN,
      userMinting: string
    ): NonPayableTransactionObject<boolean>;

    supportsInterface(
      interfaceId: string | number[]
    ): NonPayableTransactionObject<boolean>;
  };
  events: {
    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };
}