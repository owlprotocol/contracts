//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Create2CloneFactory {
    event NewClone(address proxyAddr, address logicAddr, bytes32 salt);

    /**
     * @dev Deploy an EIP-1167 proxy with CREATE2
     * @param logicAddr Address at which logic is stored
     * @param salt for CREATE2 deployment
     * @return result address of newly deployed clone
     */
    function create2Clone(address logicAddr, bytes32 salt) public returns (address result) {
        bytes memory bytecode = getInitBytes(logicAddr);

        assembly {
            result := create2(
                0, //wei
                add(bytecode, 0x20),
                mload(bytecode),
                salt
            )
        }

        require(result != address(0), 'Create2CloneFactory: CREATE2 Failed to deploy');
        emit NewClone(result, logicAddr, salt);
    }

    /**
     * @dev Deploy an EIP-1167 proxy with CREATE2 and call initializer function
     * @param logicAddr Address at which logic is stored
     * @param salt for CREATE2 deployment
     * @param data optional argument for calling initializer function on newly deployed contract.
     */
    function create2AtomicallyClone(
        address logicAddr,
        bytes32 salt,
        bytes memory data
    ) external returns (address result) {
        result = create2Clone(logicAddr, salt);

        //data is optional
        if (data.length > 0) {
            (bool s, ) = result.call(data);
            require(s, 'Create2CloneFactory: Failed to call the proxy');
        }
    }

    /**
     * @dev Use logic adddress to generate EIP-1167 init code
     * @param logicAddr Address at which logic is stored
     * As per, https://medium.com/authereum/bytecode-and-init-code-and-runtime-code-oh-my-7bcd89065904
     * @return init The initial byte code for the address
     */
    function getInitBytes(address logicAddr) public pure returns (bytes memory) {
        require(logicAddr != address(0), 'Create2CloneFactory: logicAddr cannot be stored a the zero address');

        return
            abi.encodePacked(
                hex'3d602d80600a3d3981f3363d3d373d3d3d363d73',
                bytes20(logicAddr),
                hex'5af43d82803e903d91602b57fd5bf3'
            );
    }

    /**
     * @dev Utility function for pre calculating CREATE2 address
     */
    function getCloneAddr(
        address deployer,
        address logicAddr,
        bytes32 salt
    ) external pure returns (address) {
        return
            address(uint160(uint256(keccak256(abi.encodePacked(hex'ff', deployer, salt, getBytecodeHash(logicAddr))))));
    }

    /**
     * @dev Utility function to get bytecode hash for CREATE2
     */
    function getBytecodeHash(address logicAddr) public pure returns (bytes32) {
        return keccak256(getInitBytes(logicAddr));
    }
}
