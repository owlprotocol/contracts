//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './ERC721MintableCode.sol';
import '../Utils/CloneFactory.sol';

/**
 * ERC721Mintable.sol minimal proxy contract, as per EIP-1167
 */
contract ERC721Proxy is CloneFactory {
    address public ADMIN;
    address codeAddr;

    event NewClone(address proxyAddr);

    constructor(address _codeAddr) {
        ADMIN = msg.sender;
        codeAddr = _codeAddr;
    }

    function createProxy(
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    ) external {
        require(msg.sender == ADMIN, 'Sender is not admin');
        address proxy = createClone(codeAddr);
        ERC721MintableCode(proxy).initialize(_name, _symbol, _baseURI, msg.sender);

        emit NewClone(proxy);
    }
}
