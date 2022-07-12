# Lootbox

## How does it work?

The lootbox mechanism allows for the locking and unlocking of outputs "into" an ERC721 lootbox asset by way of randomized CrafterTransfer/CrafterMint contracts. A game developer can specify a number of regular Crafter contracts, specifying the ERC721 lootbox asset as the only "input" ingredient and setting output ingredients as they desire. Using the Lootbox contract, they can then create a lootbox that randomly selects one of these Crafter contracts to route the craft/mint call to, according to a probability distribution which they define.

For example, suppose a game developer would like a lootbox to "contain" outputs of either (a) some number of ERC-20 tokens or (b) some other ERC-721 token in addition to some number of ERC-1155 tokens. They would first create two CrafterTransfer contracts with the lootbox token as an input, and with the tokens of (a) and (b) as outputs in their respective CrafterTransfer instances. Then, in creating a new Lootbox instance, the developer can specify the probability of a player receiving (a) as 30% and receiving (b) as 70%. Upon calling the `unlock()` function, the player will then receive the package of assets that is randomly selected (according to the probability distribution) by the Lootbox contract.
