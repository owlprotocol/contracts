// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';

import '@chainlink/contracts/src/v0.8/KeeperCompatible.sol';

import '../../random/VRFBeacon.sol';
import '../PluginsCore.sol';
import '../../utils/SourceRandom.sol';
import '../../utils/Probability.sol';

/**
 * @dev Contract module that enables implementation of unlockable lootboxes by
 * routing unlock requests to a number of deployed Crafter contracts. By
 * configuring multiple Crafter contracts that take in the lootbox (typically
 * some ERC721 token) as their sole input and each have different output asset
 * bundles, a developer can route the output of a certain lootbox to a myriad of
 * possible output bundles, effectively designating the inputted token as a
 * lootbox.
 *
 * Configuration for Crafter contracts is designated by two {Ingredient}[]. One
 * array is the `inputs` and the other is the `outputs`. The contract allows for
 * the `inputs` to be redeemed for the `outputs`, `craftableAmount` times.
 *
 * ```
 * struct Ingredient {
 *     TokenType token;
 *     ConsumableType consumableType;
 *     address contractAddr;
 *     uint256[] amounts;
 *     uint256[] tokenIds;
 * }
 * ```
 *
 * Configuration is set in the initializers and cannot be edited once the
 * contract has been launched Other configurations will require their own
 * contract to be deployed
 *
 * However, `craftableAmount` can be dynamically updated through the {deposit}
 * and {withdraw} functions which are only accessible to `DEFAULT_ADMIN_ROLE`
 *
 * Each Ingredient has a `consumableType` field.* This field is for the `inputs`
 * elements and ignored by the `outputs` elements. ERC20 and ERC1155 `inputs`
 * elements can be `unaffected` or `burned`. `unaffected` will check for
 * ownership/balance while `burned` will send the asset(s) to the `burnAddress`.
 * ERC721 inputs can be `NTime` or `burned`. `NTime` allows for a specfic
 * `tokenId` to only be used 'n times', as defined by contract deployer.
 *
 * ERC20 `inputs` and `outputs` elements should have one number in the `amounts`
 * array denoting ERC20 token amount requirement.`tokenIds` should be empty.
 * NTime consumable type ERC721 inputs should have empty `tokenIds` and
 * `amounts[0]` equal to `n` - the maximum number of times the input can be
 * used. Burned ERC721 `inputs` elements should have empty `amounts` and
 * `tokenIds` array. This contract accepts *all* `tokenId`s from an ERC721
 * contract as inputs. ERC721 `outputs` elements must have empty `amounts`
 * array. `tokenIds` array length should be `craftableAmount`. The `tokenIds`
 * array will contain the `tokenIds` to be transferred out when {craft} is
 * called. Important to note that output transfers will be from the *end* of the
 * array since `.pop()` is used.
 *
 * ERC1155 `inputs` and `outputs` elements should have the length of `amounts`
 * and `tokenIds` array be the same. The indices will be linked where each index
 * denotes how much of each ERC1155 `tokenId` is required.
 *
 * This module is used through composition. It can be deployed to create
 * crafting logic with asset contracts that are already on chain and active;
 * plug-and-play, so to speak.
 *
 * Configuration for a lootbox requires the developer enter `_crafterContracts`,
 * an address array of deployed Crafter contracts that makes up the pool of
 * potential contracts routed to.* The `probabilities` array must be of the same
 * length, as it describes the probability distribution of the random variable
 * that determines a randomly chosen contract.
 *
 * A VRFBeacon is deployed and used to inject randomness, while a Chainlink
 * Keeper is used to autonomously check if a random number has been returned by
 * the off-chain VRFBeacon coordinator. Upon receiving a random number, the
 * Keeper then calls the _unlock() function to randomly select a Crafter
 * contract and call its `craft()` function.
 */

contract Lootbox is PluginsCore, KeeperCompatibleInterface, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    using AddressUpgradeable for address;

    // Specification + ERC165
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Lootbox/', _version)));

    /**********************
             State
    **********************/

    address[] public crafterContracts;
    uint256[] public probabilities;
    address public vrfBeacon;

    mapping(uint256 => uint256) lootboxIdToEpochBlock;
    uint256 public queueIndex;
    uint256[] private upkeepQueue; //array of lootboxIds

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Create Lootbox instance
     * @param _admin the admin/owner of the contract
     * @param _crafterContracts array of crafterContract address, each with unique recipe
     * @param _probabilities array of cumulative probabilities associated with
     * using a contract from crafterContracts
     * @param _forwarder address for trusted forwarder for open GSN integration
     */
    function initialize(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) external initializer {
        __Lootbox_init(_admin, _crafterContracts, _probabilities, _vrfBeacon, _forwarder);
    }

    /**
     * @dev Initializes contract through beacon proxy (replaces constructor in proxy pattern)
     */
    function proxyInitialize(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) external onlyInitializing {
        __Lootbox_init(_admin, _crafterContracts, _probabilities, _vrfBeacon, _forwarder);
    }

    /**
     * @dev performs validations that `_inputs`  are valid and creates the
     * configuration
     */
    function __Lootbox_init(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_admin, _forwarder);

        __Lootbox_init_unchained(_crafterContracts, _probabilities, _vrfBeacon);
    }

    /**
     * @dev performs validations that `_inputs` and `_outputs` are valid and
     * creates the configuration
     */
    function __Lootbox_init_unchained(
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities,
        address _vrfBeacon
    ) internal onlyInitializing {
        require(
            _probabilities.length == _crafterContracts.length,
            'Lootbox.sol: lengths of probabilities and crafterContracts arrays do not match!'
        );

        crafterContracts = _crafterContracts;
        probabilities = _probabilities;
        vrfBeacon = _vrfBeacon;
    }

    /**********************
         Interaction
    **********************/

    /**
     * @dev Makes a request for random number from VRFBeacon, adds unlock
     * request to queue - specific to lootbox token id
     * @param lootboxId the token ID of the lootbox asset to be unlocked
     * @return requestId the id given to the request by the VRFBeacon
     * @return epochBlockNumber the epoch block number at the time request is made
     */
    function requestUnlock(uint256 lootboxId) external returns (uint256 requestId, uint256 epochBlockNumber) {
        uint256 currEntry = lootboxIdToEpochBlock[lootboxId];
        if (currEntry != 0) return (VRFBeacon(vrfBeacon).getRequestId(currEntry), currEntry); //Each lootbox can only be redeemed once

        (requestId, epochBlockNumber) = VRFBeacon(vrfBeacon).requestRandomness();

        lootboxIdToEpochBlock[lootboxId] = epochBlockNumber;
        upkeepQueue.push(lootboxId);
    }

    /**
     * @dev Run by Chainlink Keeper to check whether random number has been returned by VRFBeacon
     * @return upkeepNeeded whether a random number has been returned
     * @return performData encoding of random number and queue index
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        assert(queueIndex <= upkeepQueue.length);
        if (upkeepQueue.length == queueIndex) return (false, '0x');

        uint256 randomness = VRFBeacon(vrfBeacon).getRandomness(lootboxIdToEpochBlock[upkeepQueue[queueIndex]]);

        if (randomness != 0) return (true, abi.encode(randomness, queueIndex));
        return (false, '0x');
    }

    /**
     * @dev Run by Chainlink Keeper to perform unlock on a lootbox id requiring upkeep
     * @param performData encoding of random number and queue index via checkUpkeep
     */
    function performUpkeep(bytes calldata performData) external override {
        (uint256 randomness, uint256 queueIndexRequest) = abi.decode(performData, (uint256, uint256));

        //make sure that checkUpKeep hasn't run twice on the same queueIndex
        require(queueIndexRequest == queueIndex, 'Lootbox: queueIndex already processed');

        _unlock(upkeepQueue[queueIndex], randomness);

        queueIndex++;
    }

    /**
     * @dev Internal function called by performUpkeep() to call randomly-selected Crafter contract
     * @param lootboxId the id of the lootbox to unlock
     * @param randomSeed the random seed generated by the VRFBeacon to be used
     * to source a random number
     */
    function _unlock(uint256 lootboxId, uint256 randomSeed) internal {
        //randomly choose the crafter contract to call
        uint256 randomNumber = SourceRandom.getSeededRandom(randomSeed, lootboxId);
        uint256 selectedContract = Probability.probabilityDistribution(randomNumber, probabilities);

        //craft outputs to msgSender
        uint256[][] memory inputERC721Id = new uint256[][](1);
        for (uint256 i = 0; i < 1; i++) {
            inputERC721Id[i] = new uint256[](1);
            inputERC721Id[0][0] = lootboxId;
        }

        address selectedCrafter = crafterContracts[selectedContract];

        // low-level call to prevent from reverting. Otherwise, queueIndex will not
        // increment and performUpkeep will be endlessly called,
        // not allowing upkeepQueue to make progress

        (bool success, bytes memory returnData) = selectedCrafter.call(
            abi.encodePacked(abi.encodeWithSignature('craft(uint96,uint256[][])', 1, inputERC721Id), _msgSender())
        );

        if (!success) emit RouterError(lootboxId, _msgSender(), returnData);
    }

    /**
    Getters
    */

    /**
     * @notice Used for testing only
     * @dev Returns epoch block during which requestUnlock was called on a lootbox ID
     * @param lootboxId the ID of the lootbox to unlock
     * @return uint256 the epoch block corresponding to lootboxId
     */
    function getEpochBlock(uint256 lootboxId) public view returns (uint256) {
        return lootboxIdToEpochBlock[lootboxId];
    }

    /**
     * @notice Used for testing only
     * @dev Returns the randomly selected contract from the contracts array
     * @param lootboxId the ID of the lootbox to unlock, used as nonce in random number generation
     * @param randomSeed the random seed taken from checkUpkeep
     * @return selectedContract the randomly selected contract's index in contracts array
     */
    function getRandomContract(uint256 lootboxId, uint256 randomSeed) external view returns (uint256 selectedContract) {
        uint256 randomNumber = SourceRandom.getSeededRandom(randomSeed, lootboxId);
        selectedContract = Probability.probabilityDistribution(randomNumber, probabilities);
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(OwlBase, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
