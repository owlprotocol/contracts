//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import '../Crafter/CraftLib.sol';
import '../Utils/BatchTransfer.sol';

/**
 * @dev Pluggable Crafting Contract.
 */
contract CrafterTransfer is ERC721HolderUpgradeable, OwnableUpgradeable {
    // Events
    event CreateRecipe(
        CraftLib.RecipeInputERC20[] inputsERC20,
        CraftLib.RecipeInputERC721[] inputsERC721,
        CraftLib.RecipeOutputERC20[] outputsERC20,
        CraftLib.RecipeOutputERC721[] outputsERC721
    );
    event RecipeUpdate(uint256 craftableAmount);
    event RecipeCraft(uint256 craftedAmount, uint256 craftableAmount, address indexed user);

    enum ConsumableType {
        unaffected,
        burned
    }

    address public burnAddress;
    uint256 public craftableAmount;
    uint256 public craftedAmount;

    CraftLib.RecipeInputERC20[] public inputsERC20;
    CraftLib.RecipeInputERC721[] public inputsERC721;
    CraftLib.RecipeInputERC1155[] public inputsERC1155;
    CraftLib.RecipeOutputERC20[] public outputsERC20;
    CraftLib.RecipeOutputERC721[] public outputsERC721;
    CraftLib.RecipeOutputERC1155[] public outputsERC1155;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Create recipe
     * @dev Configures crafting recipe with inputs/outputs
     * @param _burnAddress Burn address for burn inputs
     * @param _inputsERC20 ERC20 inputs for recipe
     * @param _inputsERC721 ERC721 inputs for recipe
     * @param _inputsERC1155 ERC1155 inputs for recipe
     * @param _outputsERC20 ERC20 outputs for recipe crafting
     * @param _outputsERC721 ERC721 outputs for recipe crafting
     * @param _outputsERC1155 ERC721 outputs for recipe crafting
     */
    function initialize(
        address _burnAddress,
        CraftLib.RecipeInputERC20[] calldata _inputsERC20,
        CraftLib.RecipeInputERC721[] calldata _inputsERC721,
        CraftLib.RecipeInputERC1155[] calldata _inputsERC1155,
        CraftLib.RecipeOutputERC20[] calldata _outputsERC20,
        CraftLib.RecipeOutputERC721[] calldata _outputsERC721,
        CraftLib.RecipeOutputERC1155[] calldata _outputsERC1155,
        uint256 craftAmount,
        uint256[][] calldata outputsERC721Ids
    ) public initializer {
        require(_burnAddress != address(0), 'burn address must not be 0');
        // Requires
        require(
            _inputsERC20.length > 0 || _inputsERC721.length > 0 || _inputsERC1155.length > 0,
            'A crafting input must be given!'
        );
        require(
            _outputsERC20.length > 0 || _outputsERC721.length > 0 || _outputsERC1155.length > 0,
            'A crafting output must be given!'
        );

        __Ownable_init();

        burnAddress = _burnAddress;

        // ERC20 Inputs
        for (uint256 i = 0; i < _inputsERC20.length; i++) inputsERC20.push(_inputsERC20[i]);
        // ERC721 Inputs
        for (uint256 i = 0; i < inputsERC721.length; i++) inputsERC721.push(inputsERC721[i]);
        // ERC1155 Inputs
        for (uint256 i = 0; i < inputsERC1155.length; i++) inputsERC1155.push(inputsERC1155[i]);
        // ERC20 Outputs
        for (uint256 i = 0; i < outputsERC20.length; i++) outputsERC20.push(outputsERC20[i]);
        // ERC721 Outputs
        for (uint256 i = 0; i < outputsERC721.length; i++) {
            require(
                outputsERC721[i].ids.length == 0,
                'Do not include IDs in initialization. Use `createRecipeWithDeposit`.'
            );
            outputsERC721.push(outputsERC721[i]);
        }
        // ERC1155 Outputs
        for (uint256 i = 0; i < outputsERC1155.length; i++) outputsERC1155.push(outputsERC1155[i]);

        emit CreateRecipe(id, _msgSender(), inputsERC20, inputsERC721, outputsERC20, outputsERC721);

        deposit(craftAmount, outputsERC721Ids);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to deposit recipe outputs
     * @param craftAmount How many times the recipe should be craftable
     * @param _outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     */
    function deposit(uint256 craftAmount, uint256[][] calldata _outputsERC721Ids) public onlyOwner {
        // Requires
        require(
            outputsERC721.length == _outputsERC721Ids.length,
            'Missing ERC721 output item(s)! Please include ALL outputs.'
        );

        // Batch Transfer ERC20
        address[] memory tokenAddresses;
        uint256[] memory tokenAmounts;
        (tokenAddresses, tokenAmounts) = CraftLib._buildBatchTransferERC20(outputsERC20, craftAmount);
        BatchTransfer.transferFromERC20(tokenAddresses, _msgSender(), address(this), tokenAmounts);

        // Batch Transfer ERC721
        address[] memory nftAddresses;
        (nftAddresses, ) = CraftLib._buildBatchTransferERC721(outputsERC721, 0); // withdrawAmount=0
        BatchTransfer.transferFromERC721(nftAddresses, _msgSender(), address(this), _outputsERC721Ids);

        // Add ids to storage
        for (uint256 i = 0; i < _outputsERC721Ids.length; i++)
            for (uint256 j = 0; j < _outputsERC721Ids[i].length; j++)
                outputsERC721[i].ids.push(_outputsERC721Ids[i][j]);

        // Increase craftableAmount (after transfers have confirmed, prevent reentry)
        craftableAmount += craftAmount;

        emit RecipeUpdate(craftableAmount);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param withdrawCraftAmount How many times the craft otuputs should be withdrawn
     */
    function withdraw(uint256 withdrawCraftAmount) public onlyOwner {
        // Requires
        require(withdrawCraftAmount > 0, 'withdrawCraftAmount cannot be 0!');
        require(withdrawCraftAmount <= craftableAmount, 'Not enough resources to withdraw!');
        // Increase craftableAmount (check-effects)
        craftableAmount -= withdrawCraftAmount;

        // Batch Transfer ERC20
        address[] memory tokenAddresses;
        uint256[] memory tokenAmounts;
        (tokenAddresses, tokenAmounts) = CraftLib._buildBatchTransferERC20(outputsERC20, withdrawCraftAmount);
        BatchTransfer.transferFromERC20(tokenAddresses, address(this), _msgSender(), tokenAmounts);

        // Batch Transfer ERC721
        address[] memory nftAddresses;
        uint256[][] memory nftIds;
        (nftAddresses, nftIds) = CraftLib._buildBatchTransferERC721(r.outputsERC721, withdrawCraftAmount);
        BatchTransfer.transferFromERC721(nftAddresses, address(this), _msgSender(), nftIds);

        emit RecipeUpdate(craftableAmount);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param inputERC721Ids Array of pre-approved NFTs for crafting usage
     */
    function craft(uint256[] calldata inputERC721Ids) public {
        require(craftableAmount > 0, 'Not enough resources left for crafting!');
        // Update crafting stats (check-effects)
        craftableAmount--;
        craftedAmount++;
        {
            // Batch Transfer/Verify Input ERC20
            address[] memory addressesERC20;
            uint256[] memory unaffectedAmountsERC20;
            uint256[] memory burnedAmountsERC20;
            (addressesERC20, unaffectedAmountsERC20, burnedAmountsERC20) = CraftLib._splitConsumeablesERC20(
                inputsERC20
            );
            BatchTransfer.assertBalanceERC20(addressesERC20, _msgSender(), unaffectedAmountsERC20);
            BatchTransfer.transferFromERC20(addressesERC20, _msgSender(), burnAddress, burnedAmountsERC20);
        }
        {
            // Batch Transfer/Verify Input ERC721
            address[] memory addressesERC721;
            uint256[][] memory unaffectedAmountsERC721;
            uint256[][] memory burnedAmountsERC721;
            (addressesERC721, unaffectedAmountsERC721, burnedAmountsERC721) = CraftLib._splitConsumeablesERC721(
                inputsERC721,
                inputERC721Ids
            );
            BatchTransfer.assertBalanceERC721(addressesERC721, _msgSender(), unaffectedAmountsERC721);
            BatchTransfer.transferFromERC721(addressesERC721, _msgSender(), burnAddress, burnedAmountsERC721);
        }
        //TODO: ERC1155 inputs

        {
            // Batch Transfer Output ERC20
            address[] memory tokenAddresses;
            uint256[] memory tokenAmounts;
            (tokenAddresses, tokenAmounts) = CraftLib._buildBatchTransferERC20(outputsERC20, 1);
            BatchTransfer.transferFromERC20(tokenAddresses, address(this), _msgSender(), tokenAmounts);
        }

        {
            // Batch Transfer Output ERC721
            address[] memory nftAddresses;
            uint256[][] memory nftIds;
            (nftAddresses, nftIds) = CraftLib._buildBatchTransferERC721(outputsERC721, 1); // craftAmount = 1
            BatchTransfer.transferFromERC721(nftAddresses, address(this), _msgSender(), nftIds);
        }

        //TODO: ERC1155 outputs

        emit RecipeCraft(craftedAmount, craftableAmount, _msgSender());
    }
}
