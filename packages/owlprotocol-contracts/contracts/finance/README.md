# Finance Contracts

## Utils

AuctionLib.sol and BundleLib.sol contain struct definitions of the Asset type, containing three fields: `token`, `contractAddr`, and `tokenId`, which refer to the token type (erc721, erc1155), contract address, and token ID of the asset, respectively. In the BundleLib.sol Asset definition, we also include erc20 as a token type as well as an `amount` field indicating the amount of that tokenID (applies to ERC20 and ERC1155, ERC721 defaults to 1).

## Lootboxes

### Bundle.sol

Early implementation of a lootbox mechanism that enables users to "lock" assets into the contract, at the same time tying them to an ERC 721 token so that they are only able to be "unlocked" upon verfication of ownership of said token.

Initialized with address of admin (who is transferred owner privileges), address of the client (who the deployer of the contract must specify on the frontend, as only the client is allowed to lock and unlock), and the address of the lootbox minter (a MinterAutoId address which allows us to mint unique lootbox token IDs).

The `lock()` function takes as input an array of `BundleLib.Asset`s. It iterates through this array to transfer each asset to teh contract. At the same time keeping inventory of the assets locked in the current lootbox id (kept track of by nextLootBoxId, a global counter variable) by adding entries to `lootBoxStorage`, a mapping from lootbox token IDs to dynamic arrays of the `BundleLib.Asset`s they hold. `nextLootboxId` is incremented and the current lootbox is minted to the msg sender using `MinterAutoId.mint()`. Notice that the counter variable `nextLootboxId` will always be equal to the tokenID of the ERC721 minted by MinterAutoId, even when the MinterAutoId address is altered by setLootboxAddress (see below).

The admin may also call `setLootboxAddress` to manually reset the address of the lootbox minter, so as to change the ERC 721 lootbox contract. This address is stored globally on the contract for use in the `lock()` function. Additionally, we call the MinterAutoId method `setNextTokenId()` on this address, which sets the next token ID to be minted to be equal to `nextLootboxId`, serving to keep the tokenID minted by MinterAutoId to always match `nextLootboxId`.

The `unlock()` function allows the client to input lootbox ID. Upon verifying that the client is the owner of said token, we then send the assets to the client, iterating through the stored array of assets in `lootBoxStorage` in reverse order, allowing for popping the assets out of the array after trasnferring them to the client.

## Auctions

### FixedPriceAuction.sol

Implementation for a simple fixed price (sell-buy) auction.

Similar to EnglishAuction and DutchAuction, FixedPriceAuction handles the asset being listed as an AuctionLib.Asset struct. The contract is initialized with the seller address, the asset (as an AuctionLib.Asset struct), the ERC20 contract address of the token which the seller will accept as valid payment for a potential transaction, the price of the auction (which is static throughout the duration), the duration of the auction (in seconds), as well as the sale fee (as an integer percentage <= 100) and the address to which the sale fee should be sent (this address cannot be the same as the seller's).

Upon initialization of the contract, the asset will be transferred from the seller to the contract, and the auction will also be started, and the timestamp of the current block is recorded as the start time.

From here, there are two things that can happen: (1) a buyer buys within the auction duration timeframe or (2) nobody buys within the timeframe. In (1), a buyer calls the `buy()` function, and an amount of the acceptable ERC20 token in the amount of `price` is transfeered to the seller directly (along with the sale fee to the sale fee address), after which the asset will be transferred from the contract to the buyer.

In (2), nobody is eligible to buy the asset after the auction is over. The only action possible is for the owner (the seller of the asset) to claim the listed asset back from the contract. This can only happen after the auction duration has passed.

## DutchAuction.sol

## Rent
