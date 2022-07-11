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

From here, there are two things that can happen: (1) a buyer buys within the auction duration timeframe or (2) nobody buys within the timeframe. In (1), a buyer calls the `buy()` function, and an amount of the acceptable ERC20 token in the amount of `price` is transferred to the seller directly (along with the sale fee to the sale fee address), after which the asset will be transferred from the contract to the buyer.

In (2), nobody is eligible to buy the asset after the auction is over. The only action possible is for the owner (the seller of the asset) to claim the listed asset back from the contract. This can only happen after the auction duration has passed.

## DutchAuction.sol

Implementation for a simple on-chain Dutch Auction with a pricing view function that decreases over a set period of time.

The contract is initialized with the seller address, the asset being listed (DutchAuction handles the asset being listed as an AuctionLib.Asset struct), the ERC20 token acceptable for payment, both the starting ceiling price and ending floor price, the duration of the auction, the type of change price function (linear vs nonlinear), the sale fee (as an integer percentage <= 100), and the address to which the sale fee should be sent (this address cannot be the same as the seller's).

Upon initialization of the contract, the asset will be transferred from the seller to the contract, and the auction will also be started, and the timestamp of the current block is recorded as the start time.

From here, the bidder can call `bid()` to place a bid based on the current price of the asset that is defined by `getCurrentPrice()`, which updates the price of the NFT based on either a linear or nonlinear function. When the bidder calls the `bid()` function, the contract transfers the ERC20 tokens from the bidder to the seller directly (along with the sale fee to the sale fee address). Because of the nature of the Dutch Auction, calling the `bid()` function will also transfer the asset from the contract address to the bidder directly.

The owner can also call the `claim()` function only if the auction has ended. This function allows the owner to claim back the asset from the contract address if no bid was made and the auction time expires.

## EnglishAuction.sol

Implementation for a standard English Auction smart contract that allows bidders to keep bidding until the highest bidder wins the asset.

The contract is initialized with the seller address, the asset being listed (EnglishAuction handles the asset being listed as an AuctionLib.Asset struct), the ERC20 token acceptable for payment, the starting bid on the NFT, the duration of the auction, the reset time (the time at which the auction resets when a bid is made within this time frame), the sale fee (as an integer percentage <= 100), and the address to which the sale fee should be sent (this address cannot be the same as the seller's).

Upon initialization of the contract, the asset will be transferred from the seller to the contract.

In order to start the auction, the owner must call the `start()` function which essentially starts the clock and defines the `endAt` variable that keeps track of the length of the auction.

Then, the bidders can call the `bid()` method to place a bid through an amount defined in the parameter. The function ensures that the bid must be higher than the highest bid and that the auction is started. All bids made are mapped by the address that made the bid in a mapping called `bids` so that the highest bid is always kept track of. When the `bid()` function is called, the bid value of ERC20 tokens are transferred from the bidder to the contract address. The `endAt` variable is also modified if the bid is made within the `resetTime` defined in the initialization.

Once bids continue to be made the `withdraw()` function can also be called by any bidder except for the highest bidder. This will allow lower bidders to get their previous bid amounts back in ERC20 tokens.

When the auction ends, the owner is able to call the `ownerClaim()` function which will transfer the funds from the contract address to the seller. If no bids were made, `ownerClaim()` is where the owner can get back their asset from the contract address.

Finally, once the auction has ended, the highest bidder is able to call the `winnerClaim()` function which transfers the ownership of the asset from the contract address to the highest bidder. This function will ensure that only the highest bidder is able to claim the asset.

## Rent.sol

Implementation for a simple Rent middleman that handles multiple Rental instances.

This contract allows owners of NFTs to lock their assets in this smart contract for a fixed epoch period. The contract then mints a new identical "shadow" NFT on a separate smart contract. This "shadow" NFT can be sold and transferred like any other NFT when being rented. However, after the epoch is finished, the "shadow" NFT is destroyed and the original NFT is returned to its original owner.

This contract can handle multiple rentals at a time and each Rental is identified by its rentId, which is given based on the number of total rentals currently being managed by the contract. (The first rent has id 0, second rent has id 1, etc.). Each rentId can be mapped to a specific Rental Terms Struct, which defines all of the parameters and specifications for a Rental instance. Each Rental Terms Struct defines the original NFT ID, which is used in minting the shadow NFT, the address of the owner and renter, the amount of time periods that the renter must pay, the price for each period, and the expire time for each period. All of these attributes are defined by the Rental Terms Struct which can be accessed by the mapping through the specific rentId.

There is also a mapping that maps how many time periods were paid by a renter for a specific rentId and a mapping that maps an owner to the balances it can claim at any point in time.

This contract is initialized with the acceptable ERC20 token that can be used for payment, the address of the original NFT, and the address that the shadow NFTs will be minted on. During initialization, the number of rentals (which also defines the rentIds) is set to 0.

After initialization, the function `createRental()` can be called which takes in as a parameter a Rental Terms Struct that defines all the attributes for a Rental. In this function, the various mappings are updated and the original NFT is transfered from the owner defined in the inputted struct to this contract address. The number of rentals is also incremented.

Once a rental is created, the renter can `startRent()` and `payRent()`. `startRent()` can only be called at the very beginning of the rental process if rent has not been paid yet. This function allows the renter to start paying rent by only paying for one period. It is also the function in which the shadow NFT is minted on the shadow address after the renter has paid their first period. After the rent has been started, the renter can call the `payRent()` function in which they can pay for one or multiple rental periods at a time. In this function, the ERC20 tokens that are owed by the renter are transferred from the renter to the contract address. The balances mapping is also updated for the owner to claim at any point. This function ensures that a renter can only pay for at most the number of time periods defined in the rental terms struct. It also updates the "shadow" address with the rent duration based on how much has been paid and ensures that "shadow" NFT will not be destroyed yet because rent has been paid.

At any point, the owner can call the `endRental()` or `ownerClaim()` function. The `endRental()` function updates the boolean for the rent status (ended vs not) and transfers the ownership of the NFT back to its owner from the contract address. It does not give funds to the owner in ERC20 tokens. The owner of a rental can call this function if the renter has not yet paid their rent. The `ownerClaim()` function enables the owner to claim the balances paid by the renter in ERC20 tokens. After the owner calls this function, it will update the balance back to 0 using the mapping.
