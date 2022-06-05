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

interface CrafterInterface extends ethers.utils.Interface {
  functions: {
    "craftForRecipe(uint256,uint256[])": FunctionFragment;
    "createRecipe(tuple[],tuple[],tuple[],tuple[])": FunctionFragment;
    "createRecipeWithDeposit(tuple[],tuple[],tuple[],tuple[],uint256,uint256[][])": FunctionFragment;
    "depositForRecipe(uint256,uint256,uint256[][])": FunctionFragment;
    "getRecipe(uint256)": FunctionFragment;
    "initialize()": FunctionFragment;
    "onERC721Received(address,address,uint256,bytes)": FunctionFragment;
    "setBurnAddress(uint256,address)": FunctionFragment;
    "withdrawForRecipe(uint256,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "craftForRecipe",
    values: [BigNumberish, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "createRecipe",
    values: [
      {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      { contractAddr: string; consumableType: BigNumberish }[],
      { contractAddr: string; amount: BigNumberish }[],
      { contractAddr: string; ids: BigNumberish[] }[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "createRecipeWithDeposit",
    values: [
      {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      { contractAddr: string; consumableType: BigNumberish }[],
      { contractAddr: string; amount: BigNumberish }[],
      { contractAddr: string; ids: BigNumberish[] }[],
      BigNumberish,
      BigNumberish[][]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "depositForRecipe",
    values: [BigNumberish, BigNumberish, BigNumberish[][]]
  ): string;
  encodeFunctionData(
    functionFragment: "getRecipe",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "onERC721Received",
    values: [string, string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setBurnAddress",
    values: [BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawForRecipe",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "craftForRecipe",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createRecipe",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createRecipeWithDeposit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "depositForRecipe",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getRecipe", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "onERC721Received",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setBurnAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "withdrawForRecipe",
    data: BytesLike
  ): Result;

  events: {
    "CreateRecipe(uint256,address,tuple[],tuple[],tuple[],tuple[])": EventFragment;
    "Initialized(uint8)": EventFragment;
    "RecipeCraft(uint256,uint256,uint256,address)": EventFragment;
    "RecipeUpdate(uint256,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CreateRecipe"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RecipeCraft"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RecipeUpdate"): EventFragment;
}

export type CreateRecipeEvent = TypedEvent<
  [
    BigNumber,
    string,
    ([string, number, BigNumber] & {
      contractAddr: string;
      consumableType: number;
      amount: BigNumber;
    })[],
    ([string, number] & { contractAddr: string; consumableType: number })[],
    ([string, BigNumber] & { contractAddr: string; amount: BigNumber })[],
    ([string, BigNumber[]] & { contractAddr: string; ids: BigNumber[] })[]
  ] & {
    recipeId: BigNumber;
    owner: string;
    inputsERC20: ([string, number, BigNumber] & {
      contractAddr: string;
      consumableType: number;
      amount: BigNumber;
    })[];
    inputsERC721: ([string, number] & {
      contractAddr: string;
      consumableType: number;
    })[];
    outputsERC20: ([string, BigNumber] & {
      contractAddr: string;
      amount: BigNumber;
    })[];
    outputsERC721: ([string, BigNumber[]] & {
      contractAddr: string;
      ids: BigNumber[];
    })[];
  }
>;

export type InitializedEvent = TypedEvent<[number] & { version: number }>;

export type RecipeCraftEvent = TypedEvent<
  [BigNumber, BigNumber, BigNumber, string] & {
    recipeId: BigNumber;
    craftedAmount: BigNumber;
    craftableAmount: BigNumber;
    user: string;
  }
>;

export type RecipeUpdateEvent = TypedEvent<
  [BigNumber, BigNumber] & { recipeId: BigNumber; craftableAmount: BigNumber }
>;

export class Crafter extends BaseContract {
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

  interface: CrafterInterface;

  functions: {
    craftForRecipe(
      recipeId: BigNumberish,
      inputERC721Ids: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    createRecipe(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    createRecipeWithDeposit(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    depositForRecipe(
      recipeId: BigNumberish,
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getRecipe(
      recipeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[],
        ([string, number] & { contractAddr: string; consumableType: number })[],
        ([string, BigNumber] & { contractAddr: string; amount: BigNumber })[],
        ([string, BigNumber[]] & { contractAddr: string; ids: BigNumber[] })[],
        BigNumber,
        BigNumber
      ] & {
        inputsERC20: ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[];
        inputsERC721: ([string, number] & {
          contractAddr: string;
          consumableType: number;
        })[];
        outputsERC20: ([string, BigNumber] & {
          contractAddr: string;
          amount: BigNumber;
        })[];
        outputsERC721: ([string, BigNumber[]] & {
          contractAddr: string;
          ids: BigNumber[];
        })[];
        craftableAmount: BigNumber;
        craftedAmount: BigNumber;
      }
    >;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setBurnAddress(
      recipeId: BigNumberish,
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    withdrawForRecipe(
      recipeId: BigNumberish,
      withdrawCraftAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  craftForRecipe(
    recipeId: BigNumberish,
    inputERC721Ids: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  createRecipe(
    inputsERC20: {
      contractAddr: string;
      consumableType: BigNumberish;
      amount: BigNumberish;
    }[],
    inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
    outputsERC20: { contractAddr: string; amount: BigNumberish }[],
    outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  createRecipeWithDeposit(
    inputsERC20: {
      contractAddr: string;
      consumableType: BigNumberish;
      amount: BigNumberish;
    }[],
    inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
    outputsERC20: { contractAddr: string; amount: BigNumberish }[],
    outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
    craftAmount: BigNumberish,
    outputsERC721Ids: BigNumberish[][],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  depositForRecipe(
    recipeId: BigNumberish,
    craftAmount: BigNumberish,
    outputsERC721Ids: BigNumberish[][],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getRecipe(
    recipeId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      ([string, number, BigNumber] & {
        contractAddr: string;
        consumableType: number;
        amount: BigNumber;
      })[],
      ([string, number] & { contractAddr: string; consumableType: number })[],
      ([string, BigNumber] & { contractAddr: string; amount: BigNumber })[],
      ([string, BigNumber[]] & { contractAddr: string; ids: BigNumber[] })[],
      BigNumber,
      BigNumber
    ] & {
      inputsERC20: ([string, number, BigNumber] & {
        contractAddr: string;
        consumableType: number;
        amount: BigNumber;
      })[];
      inputsERC721: ([string, number] & {
        contractAddr: string;
        consumableType: number;
      })[];
      outputsERC20: ([string, BigNumber] & {
        contractAddr: string;
        amount: BigNumber;
      })[];
      outputsERC721: ([string, BigNumber[]] & {
        contractAddr: string;
        ids: BigNumber[];
      })[];
      craftableAmount: BigNumber;
      craftedAmount: BigNumber;
    }
  >;

  initialize(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  onERC721Received(
    arg0: string,
    arg1: string,
    arg2: BigNumberish,
    arg3: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setBurnAddress(
    recipeId: BigNumberish,
    addr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  withdrawForRecipe(
    recipeId: BigNumberish,
    withdrawCraftAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    craftForRecipe(
      recipeId: BigNumberish,
      inputERC721Ids: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    createRecipe(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      overrides?: CallOverrides
    ): Promise<void>;

    createRecipeWithDeposit(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: CallOverrides
    ): Promise<void>;

    depositForRecipe(
      recipeId: BigNumberish,
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: CallOverrides
    ): Promise<void>;

    getRecipe(
      recipeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[],
        ([string, number] & { contractAddr: string; consumableType: number })[],
        ([string, BigNumber] & { contractAddr: string; amount: BigNumber })[],
        ([string, BigNumber[]] & { contractAddr: string; ids: BigNumber[] })[],
        BigNumber,
        BigNumber
      ] & {
        inputsERC20: ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[];
        inputsERC721: ([string, number] & {
          contractAddr: string;
          consumableType: number;
        })[];
        outputsERC20: ([string, BigNumber] & {
          contractAddr: string;
          amount: BigNumber;
        })[];
        outputsERC721: ([string, BigNumber[]] & {
          contractAddr: string;
          ids: BigNumber[];
        })[];
        craftableAmount: BigNumber;
        craftedAmount: BigNumber;
      }
    >;

    initialize(overrides?: CallOverrides): Promise<void>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    setBurnAddress(
      recipeId: BigNumberish,
      addr: string,
      overrides?: CallOverrides
    ): Promise<void>;

    withdrawForRecipe(
      recipeId: BigNumberish,
      withdrawCraftAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "CreateRecipe(uint256,address,tuple[],tuple[],tuple[],tuple[])"(
      recipeId?: null,
      owner?: string | null,
      inputsERC20?: null,
      inputsERC721?: null,
      outputsERC20?: null,
      outputsERC721?: null
    ): TypedEventFilter<
      [
        BigNumber,
        string,
        ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[],
        ([string, number] & { contractAddr: string; consumableType: number })[],
        ([string, BigNumber] & { contractAddr: string; amount: BigNumber })[],
        ([string, BigNumber[]] & { contractAddr: string; ids: BigNumber[] })[]
      ],
      {
        recipeId: BigNumber;
        owner: string;
        inputsERC20: ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[];
        inputsERC721: ([string, number] & {
          contractAddr: string;
          consumableType: number;
        })[];
        outputsERC20: ([string, BigNumber] & {
          contractAddr: string;
          amount: BigNumber;
        })[];
        outputsERC721: ([string, BigNumber[]] & {
          contractAddr: string;
          ids: BigNumber[];
        })[];
      }
    >;

    CreateRecipe(
      recipeId?: null,
      owner?: string | null,
      inputsERC20?: null,
      inputsERC721?: null,
      outputsERC20?: null,
      outputsERC721?: null
    ): TypedEventFilter<
      [
        BigNumber,
        string,
        ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[],
        ([string, number] & { contractAddr: string; consumableType: number })[],
        ([string, BigNumber] & { contractAddr: string; amount: BigNumber })[],
        ([string, BigNumber[]] & { contractAddr: string; ids: BigNumber[] })[]
      ],
      {
        recipeId: BigNumber;
        owner: string;
        inputsERC20: ([string, number, BigNumber] & {
          contractAddr: string;
          consumableType: number;
          amount: BigNumber;
        })[];
        inputsERC721: ([string, number] & {
          contractAddr: string;
          consumableType: number;
        })[];
        outputsERC20: ([string, BigNumber] & {
          contractAddr: string;
          amount: BigNumber;
        })[];
        outputsERC721: ([string, BigNumber[]] & {
          contractAddr: string;
          ids: BigNumber[];
        })[];
      }
    >;

    "Initialized(uint8)"(
      version?: null
    ): TypedEventFilter<[number], { version: number }>;

    Initialized(
      version?: null
    ): TypedEventFilter<[number], { version: number }>;

    "RecipeCraft(uint256,uint256,uint256,address)"(
      recipeId?: BigNumberish | null,
      craftedAmount?: null,
      craftableAmount?: null,
      user?: string | null
    ): TypedEventFilter<
      [BigNumber, BigNumber, BigNumber, string],
      {
        recipeId: BigNumber;
        craftedAmount: BigNumber;
        craftableAmount: BigNumber;
        user: string;
      }
    >;

    RecipeCraft(
      recipeId?: BigNumberish | null,
      craftedAmount?: null,
      craftableAmount?: null,
      user?: string | null
    ): TypedEventFilter<
      [BigNumber, BigNumber, BigNumber, string],
      {
        recipeId: BigNumber;
        craftedAmount: BigNumber;
        craftableAmount: BigNumber;
        user: string;
      }
    >;

    "RecipeUpdate(uint256,uint256)"(
      recipeId?: BigNumberish | null,
      craftableAmount?: null
    ): TypedEventFilter<
      [BigNumber, BigNumber],
      { recipeId: BigNumber; craftableAmount: BigNumber }
    >;

    RecipeUpdate(
      recipeId?: BigNumberish | null,
      craftableAmount?: null
    ): TypedEventFilter<
      [BigNumber, BigNumber],
      { recipeId: BigNumber; craftableAmount: BigNumber }
    >;
  };

  estimateGas: {
    craftForRecipe(
      recipeId: BigNumberish,
      inputERC721Ids: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    createRecipe(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    createRecipeWithDeposit(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    depositForRecipe(
      recipeId: BigNumberish,
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getRecipe(
      recipeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setBurnAddress(
      recipeId: BigNumberish,
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    withdrawForRecipe(
      recipeId: BigNumberish,
      withdrawCraftAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    craftForRecipe(
      recipeId: BigNumberish,
      inputERC721Ids: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    createRecipe(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    createRecipeWithDeposit(
      inputsERC20: {
        contractAddr: string;
        consumableType: BigNumberish;
        amount: BigNumberish;
      }[],
      inputsERC721: { contractAddr: string; consumableType: BigNumberish }[],
      outputsERC20: { contractAddr: string; amount: BigNumberish }[],
      outputsERC721: { contractAddr: string; ids: BigNumberish[] }[],
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    depositForRecipe(
      recipeId: BigNumberish,
      craftAmount: BigNumberish,
      outputsERC721Ids: BigNumberish[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getRecipe(
      recipeId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setBurnAddress(
      recipeId: BigNumberish,
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    withdrawForRecipe(
      recipeId: BigNumberish,
      withdrawCraftAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
