// // SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.9;
import 'hardhat/console.sol';

import '@opengsn/contracts/src/BasePaymaster.sol';
import '@opengsn/contracts/src/forwarder/IForwarder.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

contract NFTOwnershipPaymaster is BasePaymaster {
    event PreRelayed();
    event PostRelayed();

    IERC721Upgradeable public acceptableToken; //address for NFT that is acceptable for approving a transaction
    //uint256 public tokenId; //tokenId of acceptable NFT
    address public payer; //user who wants to approve a transaction
    uint256 public limit; //maximum number of times a user can transact

    mapping(uint256 => uint256) numTimes; //keeps track how many times a tokenId has minted

    /**
     * @dev constructor for the paymaster
     * @param _acceptableToken acceptable ERC721 for approving a transaction
     * @param _limit number of times a tokenId can be minted
     */
    constructor(
        address _acceptableToken,
        //uint256 _tokenId,
        uint256 _limit
    ) {
        acceptableToken = IERC721Upgradeable(_acceptableToken);
        //tokenId = _tokenId;
        limit = _limit;
        //numTimes[tokenId] = 0;
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external virtual override returns (bytes memory context, bool revertOnRecipientRevert) {
        require(relayRequest.relayData.paymasterData.length == 0, 'paymasterData: invalid length');
        _verifyForwarder(relayRequest);
        (signature, maxPossibleGas);
        payer = relayRequest.request.from;

        uint256 tokenId = abi.decode(approvalData, (uint256));

        numTimes[tokenId]++;

        require(acceptableToken.ownerOf(tokenId) == payer, 'User does not own NFT');

        require(numTimes[tokenId] <= limit, 'TokenId reached minting limit');

        return ('', false);
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external virtual override {
        (context, success, gasUseWithoutPost, relayData);
    }

    function versionPaymaster() external view virtual override returns (string memory) {
        return '2.2.0';
    }

    function getNumTransactions(uint256 tokenId) external view returns (uint256) {
        return numTimes[tokenId];
    }
}
