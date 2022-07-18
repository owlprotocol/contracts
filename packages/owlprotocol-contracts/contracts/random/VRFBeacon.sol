// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

import './RandomBeacon.sol';

import 'hardhat/console.sol';

contract VRFBeacon is VRFConsumerBaseV2, RandomBeacon {
    event Fulfilled(uint256 indexed requestId, uint256 indexed randomNumber);
    event Requested(uint256 indexed requestId);

    VRFCoordinatorV2Interface COORDINATOR;
    bytes32 internal keyHash;

    uint64 s_subscriptionId;
    uint32 callbackGasLimit;
    uint32 numWords = 1;

    mapping(uint256 => uint256) public blockNumberToRequestId;
    mapping(uint256 => uint256) public requestIdToRandomness;

    /**
     * Constructor inherits VRFConsumerBase
     */
    constructor(
        uint64 _subscriptionId,
        address _vrf,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint8 _epochPeriod
    ) VRFConsumerBaseV2(_vrf) RandomBeacon(_epochPeriod) {
        require(_epochPeriod < 100 && _epochPeriod > 3, 'VRFBeaocn: invalid number for _epoch period');
        s_subscriptionId = _subscriptionId;
        COORDINATOR = VRFCoordinatorV2Interface(_vrf);
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        EPOCH_PERIOD = _epochPeriod;
    }

    function getRequestId(uint256 blockNumber) external view returns (uint256) {
        uint256 epochBlockNumber = blockNumber - (blockNumber % EPOCH_PERIOD);
        return blockNumberToRequestId[epochBlockNumber];
    }

    function getRandomness(uint256 blockNumber) external view override returns (uint256) {
        uint256 epochBlockNumber = blockNumber - (blockNumber % EPOCH_PERIOD);
        return requestIdToRandomness[blockNumberToRequestId[epochBlockNumber]];
    }

    /**
     * Requests randomness from a block hash
     */
    function requestRandomness() public returns (uint256, uint256) {
        // Max request per EPOCH
        uint256 epochBlockNumber = block.number - (block.number % EPOCH_PERIOD);

        uint256 currRequestId = blockNumberToRequestId[epochBlockNumber];
        if (currRequestId != 0) return (currRequestId, epochBlockNumber);

        uint16 reqConf = uint16(uint256(EPOCH_PERIOD) - (block.number % uint256(EPOCH_PERIOD)));

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            // If reqConf is lower than 3, submit 3.
            // If reqConf is higher than 200, submit 200.
            // Otherwise, submit reqConf
            reqConf < 3 ? 3 : reqConf > 200 ? 200 : reqConf,
            callbackGasLimit,
            numWords
        );
        blockNumberToRequestId[epochBlockNumber] = requestId;

        return (requestId, epochBlockNumber);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        requestIdToRandomness[requestId] = randomWords[0];

        emit Fulfilled(requestId, randomWords[0]);
    }
}
