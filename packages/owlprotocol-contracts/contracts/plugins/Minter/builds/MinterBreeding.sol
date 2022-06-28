//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '../../../assets/ERC721/ERC721Owl.sol';
import '../MinterCore.sol';
import '../../../utils/SourceRandom.sol';
import '../../../utils/RosalindDNA.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterBreeding is MinterCore, OwnableUpgradeable, UUPSUpgradeable {
    uint8 public constant defaultGenesNum = 8;
    uint8 public constant defaultRequiredParents = 2;
    uint256 public constant defaultBreedingCooldownSeconds = 604800; // 7 days

    // Store breeding details
    struct BreedingRules {
        uint8 requiredParents;
        uint16 generationCooldownMultiplier;
        uint8[] genes;
        uint256 breedCooldownSeconds;
        uint256[] mutationRates;
    }

    mapping(uint256 => uint256) lastBredTime;
    BreedingRules private _breedingRules;

    event SetBreedingRules(uint8 requiredParents, uint256 breedCooldownSeconds, uint8[] genes, uint256[] mutationRates);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {
        _disableInitializers();
    }

    // Constructor
    function initialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        BreedingRules calldata breedingRules_
    ) external initializer {
        __MinterBreeding_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, breedingRules_);
    }

    function proxyIntiialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        BreedingRules calldata breedingRules_
    ) external onlyInitializing {
        __MinterBreeding_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, breedingRules_);
    }

    function __MinterBreeding_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        BreedingRules calldata breedingRules_
    ) internal onlyInitializing {
        __MinterBreeding_init_unchained(_admin, breedingRules_);
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);

        __Ownable_init();
    }

    function __MinterBreeding_init_unchained(address _admin, BreedingRules calldata breedingRules_)
        internal
        onlyInitializing
    {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterBreeding');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterBreeding).interfaceId);

        _breedingRules = breedingRules_;
        _transferOwnership(_admin);
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function breed(uint256[] calldata parents) public returns (uint256 tokenId) {
        // Check if user enabled generational species
        bool gensEnabled = (_breedingRules.generationCooldownMultiplier != 0);

        // Breed species
        if (gensEnabled) tokenId = RosalindDNA.breedDNAGenCount(tokenId, parents);
        else tokenId = _breedSpecies(parents, msg.sender);

        // Mint Operation
        MinterCore._mintForFee(msg.sender, tokenId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function safeBreed(uint256[] calldata parents) public returns (uint256 tokenId) {
        // Check if user enabled generational species
        bool gensEnabled = (_breedingRules.generationCooldownMultiplier != 0);

        // Breed species
        if (gensEnabled) tokenId = RosalindDNA.breedDNAGenCount(tokenId, parents);
        else tokenId = _breedSpecies(parents, msg.sender);

        // Mint Operation
        MinterCore._safeMintForFee(msg.sender, tokenId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function setBreedingRules(
        uint8 requiredParents,
        uint16 generationCooldownMultiplier,
        uint256 breedCooldownSeconds,
        uint8[] memory genes,
        uint256[] memory mutationRates
    ) public onlyOwner {
        // Breed species
        BreedingRules storage r = _breedingRules;

        // Set values
        r.requiredParents = requiredParents;
        r.generationCooldownMultiplier = generationCooldownMultiplier;
        if (generationCooldownMultiplier != 0)
            require(genes[0] == 0 && genes[1] == 8, 'Generations requires gene[0]=8');
        r.breedCooldownSeconds = breedCooldownSeconds;

        // Delete arrays in case they exist
        if (r.genes.length > 0) delete r.genes;
        if (r.mutationRates.length > 0) delete r.mutationRates;

        // Set array vals
        for (uint256 i = 0; i < genes.length; i++) r.genes.push(genes[i]);
        for (uint256 i = 0; i < mutationRates.length; i++) r.mutationRates.push(mutationRates[i]);

        emit SetBreedingRules(requiredParents, breedCooldownSeconds, genes, mutationRates);
    }

    /**
     * @dev Returns the current breeding rules used for a species
     */
    function getBreedingRules()
        public
        view
        returns (
            uint8 requiredParents,
            uint256 breedCooldownSeconds,
            uint8[] memory genes,
            uint256[] memory mutationRates
        )
    {
        (requiredParents, breedCooldownSeconds, genes, mutationRates) = _getBreedingRules();
    }

    /**
     * @dev Internal function to do the heavy lifting for breeding
     * @param parents parents to use for breeding
     * @param caller owner of parent NFTs (this will be verified)
     */
    function _breedSpecies(uint256[] calldata parents, address caller) internal returns (uint256 tokenId) {
        // Fetch breeding rules
        uint8 requiredParents;
        uint8[] memory genes;
        uint256[] memory mutationRates;
        uint256 breedCooldownSeconds;
        uint16 generationCooldownMultiplier = _breedingRules.generationCooldownMultiplier;
        (requiredParents, breedCooldownSeconds, genes, mutationRates) = _getBreedingRules();

        // Make sure we're following rules

        require(parents.length == requiredParents, 'Invalid number of parents!');
        ERC721Owl nft = ERC721Owl(nftContractAddr);
        for (uint256 i = 0; i < parents.length; i++) {
            uint8 parentGeneration = RosalindDNA.getGenCount(parents[i]);
            // Require not on cooldown
            require(
                breedCooldownSeconds + parentGeneration * generationCooldownMultiplier <
                    block.timestamp - lastBredTime[parents[i]],
                'NFT currently on cooldown!'
            );
            // By updating the timestamp right after each check,
            // we prevent the same parent from being entered twice.
            lastBredTime[parents[i]] = block.timestamp;

            // Require ownership of NFTs
            require(caller == nft.ownerOf(parents[i]), 'You must own all parents!');
        }

        // Breed the NFT

        // Generate random seed
        uint256 randomSeed = SourceRandom.getRandomDebug();
        if (mutationRates.length == 0) tokenId = RosalindDNA.breedDNASimple(parents, genes, randomSeed);
        else tokenId = RosalindDNA.breedDNAWithMutations(parents, genes, randomSeed, mutationRates);
    }

    /**
     * @dev Internal function to do the heavy lifting for breeding
     * @return requiredParents number of parents required (defaults to 2)
     * @return breedCooldownSeconds number of seconds to cooldown (defaults to 7 days)
     * @return genes 256-bit gene split locations (defaults to 8 32-bit genes)
     * @return mutationRates mutation rate locations (defaults to none)
     */
    function _getBreedingRules()
        internal
        view
        returns (
            uint8 requiredParents,
            uint256 breedCooldownSeconds,
            uint8[] memory genes,
            uint256[] memory mutationRates
        )
    {
        BreedingRules storage rules = _breedingRules;

        // Require parents (2 by default)
        requiredParents = rules.requiredParents;
        if (requiredParents == 0) requiredParents = defaultRequiredParents;

        // Cooldown (7 days by default)
        breedCooldownSeconds = rules.breedCooldownSeconds;
        if (breedCooldownSeconds == 0) breedCooldownSeconds = defaultBreedingCooldownSeconds;

        // Genes (8 equal strands by default)
        uint8 genesNum = uint8(rules.genes.length);
        if (genesNum == 0) genesNum = 8;
        genes = new uint8[](genesNum);

        if (rules.genes.length == 0)
            // Calculate gene splits (i.e. [0, 32, 64...])
            for (uint256 i = 0; i < defaultGenesNum; i++) genes[i] = uint8(i * (256 / defaultGenesNum));
        // Pickup gene splits (from storage configuration)
        else for (uint256 i = 0; i < genesNum; i++) genes[i] = rules.genes[i];

        // Grab mutation rates (none by default)
        mutationRates = new uint256[](rules.mutationRates.length);
        if (mutationRates.length != 0) {
            require(mutationRates.length == genes.length, 'mutation rates length and genes length must match.');
            // Copy over mutation data
            for (uint256 i = 0; i < mutationRates.length; i++) mutationRates[i] = rules.mutationRates[i];
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}

interface IMinterBreeding is IERC165Upgradeable {
    /**
     * @dev Create a new type of species and define attributes.
     */
    function breed(uint256[] calldata parents) external returns (uint256 tokenId);

    /**
     * @dev Create a new type of species and define attributes.
     * @return tokenId minted token id
     */
    function safeBreed(uint256[] calldata parents) external returns (uint256 tokenId);

    /**
     * @dev Create a new type of species and define attributes.
     * @return tokenId minted token id
     */
    function setBreedingRules(
        uint8 requiredParents,
        uint256 breedCooldownSeconds,
        uint8[] memory genes,
        uint256[] memory mutationRates
    ) external returns (uint256 tokenId);

    /**
     * @dev Returns the current breeding rules used for a species
     */
    function getBreedingRules()
        external
        view
        returns (
            uint8 requiredParents,
            uint256 breedCooldownSeconds,
            uint8[] memory genes,
            uint256[] memory mutationRates
        );
}
