// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '../plugins/Crafter/builds/CrafterTransfer.sol';
import '../plugins/PluginsLib.sol';
import './LootboxLib.sol';
import '../utils/SourceRandom.sol';
import 'hardhat/console.sol';

contract Lootbox is ERC721HolderUpgradeable, ERC1155HolderUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Lootbox/', version)));

    /**********************
             Types
    **********************/
    event Unlock();

    address public admin;
    address[] public crafterContracts;
    uint8[] public probabilities;


    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Create auction instance
     * @param _admin the admin/owner of the contract
     * @param _crafterContracts array of crafterContract address, each with unique recipe
     * @param _probabilities array of cumulative probabilities associated with using a contract from crafterContracts
     */
    function initialize(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities
        
    ) external initializer {
        __EnglishAuction_init(_admin, _crafterContracts, _probabilities);
    }

    function proxyInitialize(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities
       
    ) external onlyInitializing {
        __EnglishAuction_init(_admin,  _crafterContracts, _probabilities);
    }

    function __EnglishAuction_init(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities
        
    ) internal onlyInitializing {
        __Ownable_init();
        _transferOwnership(_admin);

        __EnglishAuction_init_unchained(_admin, _crafterContracts, _probabilities);
    }

    function __EnglishAuction_init_unchained(
        address _admin,
        address[] calldata _crafterContracts,
        uint8[] calldata _probabilities
        
    ) internal onlyInitializing {
        require(probabilities.length == _crafterContracts.length, 'Lootbox.sol: lengths of probabilities and crafterContracts arrays do not match!');
        require(probabilities[probabilities.length - 1] == 100, 'Lootbox.sol: probabilities is not cumulative!');

        admin = _admin;
        crafterContracts = _crafterContracts;
        probabilities = _probabilities;
    }

    /**********************
         Interaction
    **********************/

    function unlock(uint256 lootBoxId) external {
        //randomly choose the crafter transfer contract to call
        uint256 randomSeed = SourceRandom.getRandomDebug() % 100 + 1; //1 to 100
        uint selectedContract;
        for (uint j = 0; j < probabilities.length; j++) {
            if (j == 0) {
                if (randomSeed <= probabilities[j]) 
                    selectedContract = j;
            } else {
                if (randomSeed <= probabilities[j] && randomSeed > probabilities[j-1])
                    selectedContract = j;
            }
        }

        //craft outputs to contract 
        uint256[][] memory inputERC721Id = new uint256[][](1);
        inputERC721Id[0][0] = lootBoxId;
        CrafterTransfer(crafterContracts[selectedContract]).craft(1, inputERC721Id); //craft amount set to one, assuming recipes made for 1 lootbox
        
        // Transfer outputs to _msgSender()
        // why no delegate call to CrafterTransfer?
        PluginsLib.Ingredient[] memory outputs = CrafterTransfer(crafterContracts[selectedContract]).getOutputs();
        
        for (uint256 i = 0; i < outputs.length; i++) {
            PluginsLib.Ingredient memory ingredient = outputs[i];
            if (ingredient.token == PluginsLib.TokenType.erc20) {
                //Transfer ERC20
                SafeERC20Upgradeable.safeTransfer(
                    IERC20Upgradeable(ingredient.contractAddr),
                    _msgSender(),
                    ingredient.amounts[0]
                );
            } else if (ingredient.token == PluginsLib.TokenType.erc721) {
                //Pop token ids from storage

                IERC721Upgradeable(ingredient.contractAddr).safeTransferFrom(
                    address(this),
                    _msgSender(),
                    ingredient.tokenIds[ingredient.tokenIds.length - 1]
                );
                
            } else if (ingredient.token == PluginsLib.TokenType.erc1155) {
                //Transfer ERC1155
                uint256[] memory amounts = new uint256[](ingredient.amounts.length);
                for (uint256 j = 0; j < ingredient.amounts.length; j++) {
                    amounts[j] = ingredient.amounts[j];
                }
                IERC1155Upgradeable(ingredient.contractAddr).safeBatchTransferFrom(
                    address(this),
                    _msgSender(),
                    ingredient.tokenIds,
                    amounts,
                    new bytes(0)
                );
            }
        }
       
        emit Unlock();
    }

    /**
    Getters
    */


    /**
    Upgradeable functions
    */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
