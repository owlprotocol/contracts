// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

import './RandomBeacon.sol';

contract VRFBeacon is VRFConsumerBaseV2, RandomBeacon {
    VRFCoordinatorV2Interface COORDINATOR;
    LinkTokenInterface LINKTOKEN;

    uint64 s_subscriptionId;
    bytes32 internal keyHash;
    uint256 internal fee;

    mapping(uint256 => bytes32) public blockNumberToRequestId;
    mapping(bytes32 => uint256) public requestIdToRandomness;

    /**
     * Constructor inherits VRFConsumerBase
     */
    constructor(
        address _vrf,
        address _link,
        bytes32 _keyHash,
        uint256 _fee,
        uint256 _epochPeriod
    ) VRFConsumerBase(_vrf, _link) RandomBeacon(_epochPeriod) {
        keyHash = _keyHash;
        fee = _fee;
        EPOCH_PERIOD = _epochPeriod;
    }

    function getRandomness(uint256 blockNumber) external view override returns (uint256) {
        return requestIdToRandomness[blockNumberToRequestId[blockNumber]];
    }

    /**
     * Requests randomness from a block hash
     */
    function requestRandomness(uint256 blockNumber) public returns (bytes32) {
        require(LINK.balanceOf(address(this)) > fee, 'Not enough LINK - fill contract with faucet');

        // Max request per EPOCH
        uint256 epochBlockNumber = blockNumber - (blockNumber % EPOCH_PERIOD);
        require(blockNumberToRequestId[epochBlockNumber] == 0, 'Already requested!');

        bytes32 requestId = super.requestRandomness(keyHash, fee);
        blockNumberToRequestId[epochBlockNumber] = requestId;

        return requestId;
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 _requestId, uint256 _randomness) internal override {
        requestIdToRandomness[_requestId] = _randomness;
    }
}
