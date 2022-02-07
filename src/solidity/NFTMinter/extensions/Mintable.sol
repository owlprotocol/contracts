//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../NFTMinter.sol";
import "../NFTMinterLibrary.sol";
import "../IMintableERC721.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract Mintable is NFTMinter {

    // Data Storage
    mapping (uint256 => MintableSpecies) _mintPrices;

    // Types
    struct MintableSpecies {
        address erc20TokenAddress;
        uint256 erc20TokenAmount;

        uint256 currentTokenId;
        uint256 endingTokenId;

        uint256 tokensStored;
    }

    // Events
    event SetSpeciesMintPrice(
        uint256 speciesId,
        address erc20TokenAddress,
        uint256 erc20TokenAmount
    );

    event MintSpecimen(
        uint256 speciesId,
        uint256 tokenId
    );


    function setSpeciesMintPrice(
        uint256 speciesId,
        address erc20TokenAddress,
        uint256 erc20TokenAmount,
        uint256 startingTokenId,
        uint256 endingTokenId
    ) public speciesOwner(speciesId) {
        MintableSpecies storage s = _mintPrices[speciesId];
        // Purposefully don't check addresses or amounts to
        // allow disabling of minting.
        s.erc20TokenAddress = erc20TokenAddress;
        s.erc20TokenAmount = erc20TokenAmount;

        // Track tokenIds to mint by
        s.currentTokenId = startingTokenId;
        s.endingTokenId = endingTokenId;

        emit SetSpeciesMintPrice(speciesId, erc20TokenAddress, erc20TokenAmount);
    }

    function withdrawTokens(
        uint256 speciesId
    ) public speciesOwner(speciesId) {
        MintableSpecies storage speciePrice = _mintPrices[speciesId];

        // Prevent reentry
        uint256 withdrawAmount = speciePrice.tokensStored;
        speciePrice.tokensStored = 0;

        // Transfer out tokens
        SafeERC20.safeTransfer(
            IERC20(species[speciesId].contractAddr),
            msg.sender,
            withdrawAmount
        );
    }

    function mintSpecimen(
        uint256 speciesId
    ) public {
        MintableSpecies storage speciePrice = _mintPrices[speciesId];

        // Make sure exists
        require(speciePrice.erc20TokenAmount != 0, "Species is not mintable!");

        // Token ID tracking
        if (speciePrice.endingTokenId != 0)
            require(speciePrice.currentTokenId <= speciePrice.endingTokenId);


        // Transfer ERC20 tokens from sender
        IERC20 token = IERC20(speciePrice.erc20TokenAddress);
        SafeERC20.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            speciePrice.erc20TokenAmount
        );

        // Mint our NFT / transfer to `msg.sender`
        IMintableERC721(species[speciesId].contractAddr)
            ._mint(msg.sender, speciePrice.currentTokenId);

        // Generate DNA / register specimen
        NFTMinter.registerSpecimen(speciesId, speciePrice.currentTokenId);

        // Event
        emit MintSpecimen(speciesId, speciePrice.currentTokenId);

        speciePrice.tokensStored += speciePrice.erc20TokenAmount;
        speciePrice.currentTokenId++;
    }

}
