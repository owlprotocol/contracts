//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

//all ERC20 contracts in outputs must implement mint function
interface ERC20Mint {
    function mint(address account, uint256 amount) external;
}

//all ERC721 contracts in outputs must implement safeMint function
interface ERC721Mint {
    function safeMint(address to, uint256 tokenId) external;
}

library BatchMint {
    /**
     * @dev Used to mint ERC20 recipe outputs
     * @param tokenAddresses ERC20 token addresses to mint
     * @param to address minting to
     * @param amounts Amount of ERC20 tokens to be minted
     */
    function mintFromERC20(
        address[] memory tokenAddresses,
        address to,
        uint256[] memory amounts
    ) internal {
        require(tokenAddresses.length == amounts.length, 'Mismatching supplied tokenAddresses and amounts!');
        for (uint256 tokenIdx = 0; tokenIdx < tokenAddresses.length; tokenIdx++) {
            if (amounts[tokenIdx] == 0) continue; //No need to transfer for amount 0
            ERC20Mint contr = ERC20Mint(tokenAddresses[tokenIdx]);
            contr.mint(to, amounts[tokenIdx]);
        }
    }

    /**
     * @dev Used to mint ERC721 recipe outputs
     * @param tokenAddresses ERC721 token addresses to mint
     * @param to address minting to
     * @param ids 2d array of tokenIds to mint
     */
    function mintFromERC721(
        address[] memory tokenAddresses,
        address to,
        uint256[][] memory ids
    ) internal {
        require(tokenAddresses.length == ids.length, 'Mismatching token IDs');

        for (uint256 nftIdx = 0; nftIdx < tokenAddresses.length; nftIdx++)
            for (uint256 tokenIdx = 0; tokenIdx < ids[nftIdx].length; tokenIdx++) {
                if (ids[nftIdx][tokenIdx] == type(uint256).max) continue;
                ERC721Mint(tokenAddresses[nftIdx]).safeMint(to, ids[nftIdx][tokenIdx]);
            }
    }
}
