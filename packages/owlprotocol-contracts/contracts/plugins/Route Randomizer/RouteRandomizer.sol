// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '@chainlink/contracts/src/v0.8/KeeperCompatible.sol';

import '../../OwlBase.sol';
import '../../random/VRFBeacon.sol';
import '../PluginsLib.sol';
import '../../utils/SourceRandom.sol';
import '../../utils/Probability.sol';

contract RouteRandomizer is OwlBase, KeeperCompatibleInterface, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://RouteRandomizer/', version)));

    /**********************
             State
    **********************/

    address[] public crafterContracts;
    bytes[] public signatures;
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
     * @dev Create RouteRandomizer instance
     * @param _admin the admin/owner of the contract
     * @param _contracts array of contract addresses to route to, each instance is defined with unique recipe
     * @param _signatures bytes array representing function signatures for each contract
     * @param _probabilities array of cumulative proababilities associated with using a contract from contracts
     * @param _forwarder address for trusted forwarder for open GSN integration
     */
    function initialize(
        address _admin,
        address[] calldata _contracts,
        bytes[] calldata _signatures,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) external initializer {
        __RouteRandomizer_init(_admin, _contracts, _signatures, _probabilities, _vrfBeacon, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        address[] calldata _contracts,
        bytes[] calldata _signatures,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) external onlyInitializing {
        __RouteRandomizer_init(_admin, _contracts, _signatures, _probabilities, _vrfBeacon, _forwarder);
    }

    function __RouteRandomizer_init(
        address _admin,
        address[] calldata _contracts,
        bytes[] calldata _signatures,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_admin, _forwarder);

        __RouteRandomizer_init_unchained(_admin, _contracts, _signatures, _probabilities, _vrfBeacon, _forwarder);
    }

    function __RouteRandomizer_init_unchained(
        address _admin,
        address[] calldata _contracts,
        bytes[] calldata _signatures,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) internal onlyInitializing {}

    /**********************
         Interaction
    **********************/

    function requestUnlock(uint256 lootboxId) external returns (uint256 requestId, uint256 blockNumber) {
        uint256 currEntry = lootboxIdToEpochBlock[lootboxId];
        if (currEntry != 0) return (VRFBeacon(vrfBeacon).getRequestId(currEntry), currEntry); //Each lootbox can only be redeemed once

        (requestId, blockNumber) = VRFBeacon(vrfBeacon).requestRandomness();

        lootboxIdToEpochBlock[lootboxId] = blockNumber;
        upkeepQueue.push(lootboxId);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        assert(queueIndex <= upkeepQueue.length);
        if (upkeepQueue.length == queueIndex) return (false, '0x');

        uint256 randomness = VRFBeacon(vrfBeacon).getRandomness(lootboxIdToEpochBlock[upkeepQueue[queueIndex]]);

        if (randomness != 0) return (true, abi.encode(randomness, queueIndex));
        return (false, '0x');
    }

    function performUpkeep(bytes calldata performData) external override {
        (uint256 randomness, uint256 queueIndexRequest) = abi.decode(performData, (uint256, uint256));

        //make sure that checkUpKeep hasn't run twice on the same queueIndex
        require(queueIndexRequest == queueIndex, 'Lootbox: queueIndex already processed');

        // _unlock(upkeepQueue[queueIndex], randomness);

        queueIndex++;
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
        override(ERC1155ReceiverUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
