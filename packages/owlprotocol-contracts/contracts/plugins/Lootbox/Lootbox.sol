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

import '../../OwlBase.sol';
import '../../random/VRFBeacon.sol';
import '../PluginsLib.sol';
import '../../utils/SourceRandom.sol';
import '../../utils/Probability.sol';
import '../Crafter/ICrafter.sol';

contract Lootbox is OwlBase, KeeperCompatibleInterface, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    using AddressUpgradeable for address;

    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Lootbox/', version)));

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
     * @param _probabilities array of cumulative probabilities associated with using a contract from crafterContracts
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

    function proxyInitialize(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) external onlyInitializing {
        __Lootbox_init(_admin, _crafterContracts, _probabilities, _vrfBeacon, _forwarder);
    }

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

        _unlock(upkeepQueue[queueIndex], randomness);

        queueIndex++;
    }

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

        // try catch to prevent from reverting. queueIndex will not
        // increment and performUpkeep will be endlessly called,
        // not allowing upkeepQueue to make progress

        (bool success, bytes memory returnData) = selectedCrafter.call(
            abi.encodePacked(abi.encodeWithSignature('craft(uint96,uint256[][])', 1, inputERC721Id), _msgSender())
        );

        emit PluginsLib.RouterError(lootboxId, _msgSender(), returnData);
    }

    /**
    Getters
    */
    function getEpochBlock(uint256 lootboxId) public view returns (uint256) {
        return lootboxIdToEpochBlock[lootboxId];
    }

    // used for testing
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
        override(AccessControlUpgradeable, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
