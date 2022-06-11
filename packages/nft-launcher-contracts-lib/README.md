# Generative NFT Encoder/Decoder

This library is used to encode/decode binary tokenId data to readable attributes. It comes with a middleware server, and a JSON schema that together enable anyone to deploy a generative NFT collection that uses on-chain data to derive the following:

-   Attributes
-   SVG Layers that compose the NFT
-   RGB Color palettes

Combining these uses cases, developers can launch a truly generative collection with infinite combinations (but limited supply) and that leverages on-chain mechanics (crafting, breeding, P2E) to create new original NFTs.

The NFT Decoder middleware server works as a backwards compatibility solution with regular exchanges that rely on the `tokenURI` method as opposed to encoding data directly into the tokenId. The middleware server is decentralized as it does not store any data and simply feches data from IPFS to convert a given tokenId to more readable JSON metadata.

TODO: @Hrik Add additional docs on SVG Generation, Colormaps (8bit -> 24bit).

## Metadata

### The Concept and Overview

The metadata standard is designed to be a map from the tokenId to the attributes of that tokenId. The binary representation of that tokenId encodes all the type of traits, and which specific type is to be used on that tokenId. Here's an example:

Imagine a NFT PFP project with two traits
*Animal
*Color

And imagine that these are the options for each trait:
*Animal: `["Cow", "Bat", "Mouse", "Owl", "Rabbit"]`
*Color: `["Red", "Blue"]`

The `Animal` attribute can be encoded into 3 bits (ceil(log2(5)) = 3) and the `Color` attribute can be encoded into 1 bit (ceil(log2(2)) = 1).

The 0 tokenId will be represented by 0000 in binary. The library is desgined to read from right to left so 0**000** will represent an index in the animal array and **0**000 will represent and index in the color array.

For example, tokenId 4 converted to binary would be 100 but padded until the maximum bit size would be 0100. 0*100* represents the index in the `Animal` options array and *0*100 represents the index in the `Color` options array. 0 in decimal is 0 and 100 in decimal is 4 so this tokenId represent and nft with a Red Rabbit.

### Implementation

The above concept will be encapuslated into a json spec. Each json spec is supposed to represent the range of possibilities an NFT project can have. This library has denoted a term for that spec: "SpecieMetadata."

An example of a SpecieMetadata can be found under `src/examples`.

There are two fields in the json object. The first one is the "traits" field. This is an array of all the traits that any individual token will have. Using the previous example, `Animal` and `Color` are the two traits for that project.

Each trait in the array is an object with some required (and optional) fields.

The first required field is "trait_type". This is the name of the trait.

The second required field is "type". These are the list of valid types:
`["Image", "number", "enum", "color"]`

The third required field is "value_options" and the formatting of this field based on the the "type". If the type is Image or enum, it is an array of `Value`s. A `Value` is also an object which has a required field "value_name" and then another required one of two fields; either an "image" field or a "value" field. Which field is used is based on the type: Image type means use "image" field and enum type means use "value" field. However, if the type is number or color, then "value_options" is just an object that defines a "max" and "min" field.

Finally, the fourth required field is "value_bit_size". This is just a simple calculation of how many bits should be allocated to encode this "trait_type". The calculation is ceil(log2("value_options".length)).

**TODO: optional traits**

So that's the traits array. The other field within the SpecieMetadata json object is "maxBitSize". This is the total bits required to encode the entire collection of possibilties. This is also a simple calculation. It is the sum of the "value_bit_size" fields in all of the traits in the "traits" array

Here is the SpecieMetadata of the previous example:

```
{
    "traits":[
        {
            "trait_type": "Animal",
            "type": "Image",
            "value_options": [
                {
                    "value_name": "Cow",
                    "image": `${Link_To_Image_Of_Cow_Layer}`
                },
                {
                    "value_name": "Bat",
                    "image": `${Link_To_Image_Of_Bat_Layer}`
                },
                {
                    "value_name": "Mouse",
                    "image": `${Link_To_Image_Of_Mouse_Layer}`
                },
                {
                    "value_name": "Owl",
                    "image": `${Link_To_Image_Of_Owl_Layer}`
                },
                {
                    "value_name": "Rabbit",
                    "image": `${Link_To_Image_Of_Rabbit_yer}`
                },
            ],
            "value_bit_size": 3
        },
        {
            "trait_type": "Color",
            "type": "Image",
            "value_options": [

                {
                    "value_name": "Red",
                    "image": `${Link_To_Image_Of_Red_Layer}`
                },
                {
                    "value_name": "Blue",
                    "image": `${Link_To_Image_Of_Blue_Layer}`
                },
            ],
            "value_bit_size": 1
        }
    ],
    "maxBitSize": 4
}
```

    \*\*SpecieMetadata & SpecieTrait classes

## Demo Data

As an example, we can use the Crypto Owls demo collection's spec that is stored on IPFS at `QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM`.

**Localhost**
http://localhost:8000/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/15532881770934585726362572820003503218105251610
http://localhost:8000/metadata/getImage/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/15532881770934585726362572820003503218105251610

**Deployed API**
https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/15532881770934585726362572820003503218105251610


## Docker
```
docker build . -t vulcanlink/nft-decoder
docker push vulcanlink/nft-decoder
docker run vulcanlink/nft-decoder
```
