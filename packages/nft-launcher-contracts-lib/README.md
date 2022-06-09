# Generative NFT Encoder/Decoder

This library is used to encode/decode binary tokenId data to readable attributes. It comes with a middleware server, and a JSON schema that together enable anyone to deploy a generative NFT collection that uses on-chain data to derive the following:

-   Attributes
-   SVG Layers that compose the NFT
-   RGB Color palettes

Combining these uses cases, developers can launch a truly generative collection with infinite combinations (but limited supply) and that leverages on-chain mechanics (crafting, breeding, P2E) to create new original NFTs.

The NFT Decoder middleware server works as a backwards compatibility solution with regular exchanges that rely on the `tokenURI` method as opposed to encoding data directly into the tokenId. The middleware server is decentralized as it does not store any data and simply feches data from IPFS to convert a given tokenId to more readable JSON metadata.

TODO: @Hrik Add additional docs on metadata, SVG Generation, Colormaps (8bit -> 24bit).

## Metadata

# The Concept

The metadata standard is designed to be a map from the tokenId to the attributes of that tokenId. The binary representation of that tokenId encodes all the type of traits, and which specific type is to be used on that tokenId. Here's an example:

Imagine a NFT PFP project with two traits
*Animal
*Color

And imagine that these are the options for each trait:
\*Animal: `["Cow", "Bat", "Mouse", "Owl", "Rabbit"]`
\*Color: `["Red", "Blue"]`

The animal attribute can be encoded into 3 bits (ceil(log2(5)) = 3) and the color attribute can be encoded into 1 bit (ceil(log2(2)) = 1).

The 0 tokenId will be represented by 0000 in binary. The library is desgined to read from right to left so 0*000* will represent an index in the animal array and *0*000 will represent and index in the color array.

For example, tokenId 4 converted to binary would be 100 but padded until the maximum bit size would be 0100.

\*\*SpecieMetadata & SpecieTrait classes

## Demo Data

As an example, we can use the Crypto Owls demo collection's spec that is stored on IPFS at `QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM`.

http://localhost:8000/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/15532881770934585726362572820003503218105251610
http://localhost:8000/metadata/getImage/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/15532881770934585726362572820003503218105251610
