//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

import '../MinterCore.sol';
import './IMinterBreeding.sol';
import '../../Utils/SourceRandom.sol';
import '../../Utils/RosalindDNA.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterBreeding is MinterCore {
    uint8 public constant defaultGenesNum = 8;
    uint8 public constant defaultRequiredParents = 2;
    uint256 public constant defaultBreedingCooldownSeconds = 604800; // 7 days

    // Store data
    mapping(uint256 => BreedingRules) private _breedingRules;

    // Store breeding details
    struct BreedingRules {
        uint8 requiredParents;
        uint256 breedCooldownSeconds;
        uint8[] genes;
        uint256[] mutationRates;
        mapping(uint256 => uint256) lastBredTime;
    }

    // Events
    event MintSpecies(uint256 indexed speciesId, address to, uint256 tokenId, uint256[] parents);
    event SetBreedingRules(
        uint256 speciesId,
        uint8 requiredParents,
        uint256 breedCooldownSeconds,
        uint8[] genes,
        uint256[] mutationRates
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    // Constructor
    function initialize() public override initializer {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterBreeding');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterBreeding).interfaceId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function breed(uint256 speciesId, uint256[] calldata parents)
        public
        speciesExists(speciesId)
        returns (uint256 tokenId)
    {
        // Breed species
        tokenId = _breedSpecies(speciesId, parents, msg.sender);

        // Mint Operation
        MinterCore._mintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId, parents);

        return tokenId;
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function safeBreed(uint256 speciesId, uint256[] calldata parents)
        public
        speciesExists(speciesId)
        returns (uint256 tokenId)
    {
        // Breed species
        tokenId = _breedSpecies(speciesId, parents, msg.sender);

        // Mint Operation
        MinterCore._safeMintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId, parents);

        return tokenId;
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function setBreedingRules(
        uint256 speciesId,
        uint8 requiredParents,
        uint256 breedCooldownSeconds,
        uint8[] memory genes,
        uint256[] memory mutationRates
    ) public speciesExists(speciesId) returns (uint256 tokenId) {
        // Breed species
        BreedingRules storage r = _breedingRules[speciesId];

        // Set values
        r.requiredParents = requiredParents;
        r.breedCooldownSeconds = breedCooldownSeconds;

        // Delete arrays in case they exist
        if (r.genes.length > 0) delete r.genes;
        if (r.mutationRates.length > 0) delete r.mutationRates;

        // Set array vals
        for (uint256 i = 0; i < genes.length; i++) r.genes.push(genes[i]);
        for (uint256 i = 0; i < mutationRates.length; i++) r.mutationRates.push(mutationRates[i]);

        emit SetBreedingRules(speciesId, requiredParents, breedCooldownSeconds, genes, mutationRates);

        return tokenId;
    }

    /**
     * @dev Returns the current breeding rules used for a species
     * @param speciesId species identifier
     */
    function getBreedingRules(uint256 speciesId)
        public
        view
        speciesExists(speciesId)
        returns (
            uint8 requiredParents,
            uint256 breedCooldownSeconds,
            uint8[] memory genes,
            uint256[] memory mutationRates
        )
    {
        (requiredParents, breedCooldownSeconds, genes, mutationRates) = _getBreedingRules(speciesId);
    }

    /**
     * @dev Internal function to do the heavy lifting for breeding
     * @param speciesId address of associated NFT
     * @param parents parents to use for breeding
     * @param caller owner of parent NFTs (this will be verified)
     * @return tokenId new token id
     */
    function _breedSpecies(
        uint256 speciesId,
        uint256[] calldata parents,
        address caller
    ) internal returns (uint256 tokenId) {
        // Generate random seed
        uint256 randomSeed = SourceRandom.getRandomDebug();

        // Fetch breeding rules
        uint8 requiredParents;
        uint256 breedCooldownSeconds;
        uint8[] memory genes;
        uint256[] memory mutationRates;
        (requiredParents, breedCooldownSeconds, genes, mutationRates) = _getBreedingRules(speciesId);

        // Make sure we're following rules
        require(parents.length == requiredParents, 'Invalid number of parents!');
        IERC721 nft = IERC721(species[speciesId].contractAddr);
        for (uint256 i = 0; i < parents.length; i++) {
            // Require not on cooldown
            require(
                breedCooldownSeconds < block.timestamp - _breedingRules[speciesId].lastBredTime[parents[i]],
                'NFT currently on cooldown!'
            );
            // By updating the timestamp right after each check,
            // we prevent the same parent from being entered twice.
            _breedingRules[speciesId].lastBredTime[parents[i]] = block.timestamp;

            // Require ownership of NFTs
            require(caller == nft.ownerOf(parents[i]), 'You must own all parents!');
        }

        // Call breeding
        if (mutationRates.length == 0) tokenId = RosalindDNA.breedDNASimple(parents, genes, randomSeed);
        else tokenId = RosalindDNA.breedDNAWithMutations(parents, genes, randomSeed, mutationRates);
    }

    /**
     * @dev Internal function to do the heavy lifting for breeding
     * @param speciesId species identifier
     * @return requiredParents number of parents required (defaults to 2)
     * @return breedCooldownSeconds number of seconds to cooldown (defaults to 7 days)
     * @return genes 256-bit gene split locations (defaults to 8 32-bit genes)
     * @return mutationRates mutation rate locations (defaults to none)
     */
    function _getBreedingRules(uint256 speciesId)
        internal
        view
        returns (
            uint8 requiredParents,
            uint256 breedCooldownSeconds,
            uint8[] memory genes,
            uint256[] memory mutationRates
        )
    {
        BreedingRules storage rules = _breedingRules[speciesId];

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
}
