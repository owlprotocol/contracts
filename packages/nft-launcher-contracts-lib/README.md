# Generative NFT Encoder/Decoder
This library is used to encode/decode binary tokenId data to readable attributes. It comes with a middleware server, and a JSON schema that together enable anyone to deploy a generative NFT collection that uses on-chain data to derive the following:
* Attributes
* SVG Layers that compose the NFT
* RGB Color palettes

Combining these uses cases, developers can launch a truly generative collection with infinite combinations (but limited supply) and that leverages on-chain mechanics (crafting, breeding, P2E) to create new original NFTs.

The NFT Decoder middleware server works as a backwards compatibility solution with regular exchanges that rely on the `tokenURI` method as opposed to encoding data directly into the tokenId. The middleware server is decentralized as it does not store any data and simply feches data from IPFS to convert a given tokenId to more readable JSON metadata.

TODO: @Hrik Add additional docs on metadata, SVG Generation, Colormaps (8bit -> 24bit).

## Demo Data
As an example, we can use the Crypto Owls demo collection's spec that is stored on IPFS at `QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM`.

http://localhost:8000/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/15532881770934585726362572820003503218105251610
http://localhost:8000/metadata/getImage/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/15532881770934585726362572820003503218105251610
