// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

import './RandomBeacon.sol';

import 'hardhat/console.sol';

contract VRFBeacon is VRFConsumerBaseV2, RandomBeacon {
    event Fulfilled(uint256 indexed requestId, uint256 randomNumber);
    event Requested(uint256 indexed requestId);

    VRFCoordinatorV2Interface COORDINATOR;
    bytes32 internal keyHash;

    uint64 s_subscriptionId;
    uint32 callbackGasLimit;
    uint16 requestConfirmations = 3;
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
        uint256 _epochPeriod
    ) VRFConsumerBaseV2(_vrf) RandomBeacon(_epochPeriod) {
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
    function requestRandomness(uint256 blockNumber) public returns (uint256) {
        // Max request per EPOCH
        uint256 epochBlockNumber = blockNumber - (blockNumber % EPOCH_PERIOD);
        require(blockNumberToRequestId[epochBlockNumber] == 0, 'VRFBeacon: Already requested!');

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        blockNumberToRequestId[epochBlockNumber] = requestId;

        return requestId;
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        requestIdToRandomness[requestId] = randomWords[0];

        emit Fulfilled(requestId, randomWords[0]);
    }
}
