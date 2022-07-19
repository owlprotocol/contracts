// // SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.9;
import 'hardhat/console.sol';

import '@opengsn/contracts/src/BasePaymaster.sol';
import '@opengsn/contracts/src/forwarder/IForwarder.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '../OwlBase.sol';
import './OwlPaymasterBase.sol';

/**
 * @dev This paymaster will approve transactions sent through a relay provider
 * if the client owns an approved ERC721 token in a collection. The paymaster
 * takes in an address of a collection of acceptable tokenIds that a client
 * can own to be able to complete a gasless transaction. A mapping also keeps
 * track of how many times a specific tokenId is used to get approved, and there
 * is a limit on how many times each tokenId can be used.
 */
contract NFTOwnershipPaymaster is OwlPaymasterBase {
    event PreRelayed();
    event PostRelayed();

    IERC721Upgradeable public acceptableToken; //address for NFT that is acceptable for approving a transaction
    address public payer; //user who wants to approve a transaction
    uint256 public limit; //maximum number of times a user can transact

    mapping(uint256 => uint256) numTimes; //keeps track how many times a tokenId has minted
    mapping(address => uint256) gasSpent; //maps a user to how much gas it has cost the paymaster

    /**
     * @dev initializes a paymaster contract
     * @param _admin admin of the paymaster
     * @param _acceptableToken address for acceptable token contract for approving transactions
     * @param _limit the maximum number of times a tokenId can be used to approve a transaction
     * @param _forwarder address for the trusted forwarder for open GSN
     */
    function initialize(
        address _admin,
        address _acceptableToken,
        uint256 _limit,
        address _forwarder
    ) external initializer {
        __NFTOwnershipPaymaster_init(_admin, _acceptableToken, _limit, _forwarder);
    }

    function proxyinitialize(
        address _admin,
        address _acceptableToken,
        uint256 _limit,
        address _forwarder
    ) external onlyInitializing {
        __NFTOwnershipPaymaster_init(_admin, _acceptableToken, _limit, _forwarder);
    }

    function __NFTOwnershipPaymaster_init(
        address _admin,
        address _acceptableToken,
        uint256 _limit,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_admin, _forwarder);
        __NFTOwnershipPaymaster_init_unchained(_acceptableToken, _limit);
    }

    function __NFTOwnershipPaymaster_init_unchained(address _acceptableToken, uint256 _limit)
        internal
        onlyInitializing
    {
        acceptableToken = IERC721Upgradeable(_acceptableToken);
        limit = _limit;
    }

    /**
     * @dev function that returns the number of times a tokenId has been used
     * for approving a transaction
     */
    function getNumTransactions(uint256 tokenId) external view returns (uint256) {
        return numTimes[tokenId];
    }

    /**
     * @dev function that performs all access control. It verifies that
     * the client owns an acceptable token in the approved collection.
     * it also ensures that the tokenId usage has not reached it's limit
     */
    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external virtual override returns (bytes memory context, bool revertOnRecipientRevert) {
        require(relayRequest.relayData.paymasterData.length == 0, 'paymasterData: invalid length');
        (signature, maxPossibleGas);

        payer = relayRequest.request.from;

        uint256 tokenId = abi.decode(approvalData, (uint256));

        require(gasSpent[payer] <= this.PAYMASTER_ACCEPTANCE_BUDGET(), 'User reached gas limit');

        require(numTimes[tokenId] < limit, 'TokenId reached minting limit');
        numTimes[tokenId]++;

        require(acceptableToken.ownerOf(tokenId) == payer, 'User does not own NFT');

        return ('', false);
    }

    /**
     * @dev function that performs all bookkeeping after a function call
     * has been made.
     */
    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external virtual override {
        if (success) {
            gasSpent[payer] += gasUseWithoutPost;
        }
        (context, success, gasUseWithoutPost, relayData);
    }

    /**
     * @dev function that is required for open GSN paymasters
     */
    function versionPaymaster() external view virtual override returns (string memory) {
        return '2.2.0+owlprotocol.paymasters.nftownershippaymaster';
    }

    function getNumTransactions(uint256 tokenId) external view returns (uint256) {
        return numTimes[tokenId];
    }

    function getGasSpent(address user) external view returns (uint256) {
        return gasSpent[user];
    }
}
