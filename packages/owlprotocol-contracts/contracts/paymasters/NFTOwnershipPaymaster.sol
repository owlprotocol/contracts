// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.9;

import '@opengsn/contracts/src/BasePaymaster.sol';
import '@opengsn/contracts/src/forwarder/IForwarder.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

contract NFTOwnershipPaymaster is BasePaymaster {
    // /* event PreRelayed();
    // event PostRelayed();
    // IERC721Upgradeable public acceptableToken; //address for NFT that is acceptable for approving a transaction
    // uint256 public tokenId; //tokenId of acceptable NFT
    // address public payer; //user who wants to approve a transaction
    // /**
    //  * @dev constructor for the paymaster
    //  * @param _acceptableToken acceptable ERC721 for approving a transaction
    //  * @param _tokenId token ID of acceptable ERC721 for approving a transaction
    //  */
    // constructor(IERC721Upgradeable _acceptableToken, uint256 _tokenId) {
    //     acceptableToken = _acceptableToken;
    //     tokenId = _tokenId;
    // }
    // function preRelayedCall(
    //     GsnTypes.RelayRequest calldata relayRequest,
    //     bytes calldata signature,
    //     bytes calldata approvalData,
    //     uint256 maxPossibleGas
    // ) external virtual override returns (bytes memory context, bool revertOnRecipientRevert) {
    //     require(approvalData.length == 0, 'approvalData: invalid length');
    //     require(relayRequest.relayData.paymasterData.length == 0, 'paymasterData: invalid length');
    //     _verifyForwarder(relayRequest);
    //     (signature, maxPossibleGas);
    //     payer = relayRequest.request.from;
    //     if (acceptableToken.ownerOf(tokenId) == payer) return ('', false);
    //     else return ('', true);
    // }
    // function postRelayedCall(
    //     bytes calldata context,
    //     bool success,
    //     uint256 gasUseWithoutPost,
    //     GsnTypes.RelayData calldata relayData
    // ) external virtual override {
    //     (context, success, gasUseWithoutPost, relayData);
    // }
    // function versionPaymaster() external view virtual override returns (string memory) {
    //     return '2.2.0';
    // }

    function versionPaymaster() external view virtual override returns (string memory) {
        return '2.2.0+opengsn.accepteverything.ipaymaster';
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external virtual override returns (bytes memory context, bool revertOnRecipientRevert) {
        (relayRequest, signature, approvalData, maxPossibleGas);
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
}
