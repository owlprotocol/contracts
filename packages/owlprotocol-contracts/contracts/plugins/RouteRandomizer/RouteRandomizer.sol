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

contract RouteRandomizer is OwlBase, KeeperCompatibleInterface, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    using AddressUpgradeable for address;

    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://RouteRandomizer/', version)));

    /**********************
             State
    **********************/
    struct RouteElement {
        uint256 epochBlock;
        bytes[] args;
    }

    address[] public contracts;
    bytes[] public signatures;
    uint256[] public probabilities;
    address public vrfBeacon;
    RouteElement[] elements;
    uint256 public queueIndex;

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
        address[] memory _contracts,
        bytes[] memory _signatures,
        uint8[] memory _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) external initializer {
        __RouteRandomizer_init(_admin, _contracts, _signatures, _probabilities, _vrfBeacon, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        address[] memory _contracts,
        bytes[] memory _signatures,
        uint8[] memory _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) external onlyInitializing {
        __RouteRandomizer_init(_admin, _contracts, _signatures, _probabilities, _vrfBeacon, _forwarder);
    }

    function __RouteRandomizer_init(
        address _admin,
        address[] memory _contracts,
        bytes[] memory _signatures,
        uint8[] memory _probabilities,
        address _vrfBeacon,
        address _forwarder
    ) internal onlyInitializing {
        require(_contracts.length == _signatures.length, '_contracts.length != _signatures.length');
        __OwlBase_init(_admin, _forwarder);

        __RouteRandomizer_init_unchained(_contracts, _signatures, _probabilities, _vrfBeacon);
    }

    function __RouteRandomizer_init_unchained(
        address[] memory _contracts,
        bytes[] memory _signatures,
        uint8[] memory _probabilities,
        address _vrfBeacon
    ) internal onlyInitializing {
        contracts = _contracts;
        signatures = _signatures;
        probabilities = _probabilities;
        vrfBeacon = _vrfBeacon;
    }

    /**********************
         Interaction
    **********************/

    function requestRouteRandomize(bytes[] memory argsArr) external returns (uint256 requestId, uint256 blockNumber) {
        (requestId, blockNumber) = VRFBeacon(vrfBeacon).requestRandomness();

        elements.push(RouteElement(blockNumber, argsArr));
    }

    function checkUpkeep(
        bytes memory /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        assert(queueIndex <= elements.length);
        if (elements.length == queueIndex) return (false, '0x');

        uint256 randomness = VRFBeacon(vrfBeacon).getRandomness(elements[queueIndex].epochBlock);

        if (randomness != 0) return (true, abi.encode(randomness, queueIndex));
        return (false, '0x');
    }

    function performUpkeep(bytes memory performData) external override {
        (uint256 randomness, uint256 queueIndexRequest) = abi.decode(performData, (uint256, uint256));

        //make sure that checkUpKeep hasn't run twice on the same queueIndex
        require(queueIndexRequest == queueIndex, 'Lootbox: queueIndex already processed');

        _routeRandomize(elements[queueIndex].args, randomness);
        queueIndex++;
    }

    function _routeRandomize(bytes[] memory argsArr, uint256 randomSeed) internal {
        //randomly choose the crafter transfer contract to call
        uint256 randomNumber = SourceRandom.getSeededRandom(randomSeed, queueIndex);
        uint256 selectedContract = Probability.probabilityDistribution(randomNumber, probabilities);

        uint256 sz = (argsArr[selectedContract].length);

        // bytes memory a;
        // assembly {
        //     let fptr := mload(0x40)
        //     let ptr := add(fptr, 0x20)
        //     mstore(ptr, sload(add(signatures.slot, selectedContract)))
        //     // prettier-ignore
        //     for { let i := 0 } lt(i, sz) { i := add(i, 0x20) } {
        //         mstore(add(ptr, add(i, 0x04)), mload(add(sub(fptr, sz), i)))
        //     }
        //     mstore(add(ptr, add(sz, 0x04)), shl(0x60, caller()))
        //     mstore(fptr, add(sz, 0x20))
        //     mstore(0x40, add(add(sz, 0x40), mload(0x40)))
        //     a := fptr
        // }

        // console.logBytes(a);

        bytes memory finalBytes = abi.encodePacked(
            signatures[selectedContract],
            argsArr[selectedContract],
            _msgSender()
        );

        address routedContract = contracts[selectedContract];

        (bool success, bytes memory returnData) = routedContract.call(finalBytes);
        emit PluginsLib.RouterError(queueIndex, _msgSender(), returnData);
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
