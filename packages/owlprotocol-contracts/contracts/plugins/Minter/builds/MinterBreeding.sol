//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import '../../../assets/ERC721/ERC721Owl.sol';
import '../MinterCore.sol';
import '../../../utils/SourceRandom.sol';
import '../../../utils/RosalindDNA.sol';

/**
 * @dev Decentralized NFT Minter breeding contract
 *
 * Breeder NFT minter contracts. Every time `breed` or `safeBreed` is called, a new NFT id is automatically generated based on the genetics of both parents.
 *
 * Breeding rules -
 * Breeding configuration -
 * Breeding logic -
 *
 * As all Minter contracts interact with existing NFTs, MinterCore expects two
 * standard functions exposed by the NFT:
 * - `mint(address to, uint256 tokenId)`
 * - `safeMint(address to, uint256 tokenId)`
 *
 * Additionally, Minter contracts must have required permissions for minting. In
 * the case that you're using ERC721Owl, you'll do that with
 * {{ERC721Owl#grantMinter}}.
 */
contract MinterBreeding is MinterCore {
    // Specification + ERC165
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterBreeding/', _version)));

    // Store
    mapping(uint256 => uint256) lastBredTime;
    BreedingRules private _breedingRules;

    // Store breeding details
    struct BreedingRules {
        uint8 requiredParents;
        uint16 generationCooldownMultiplier;
        uint8[] genes;
        uint256 breedCooldownSeconds;
        uint256[] mutationRates;
    }

    event SetBreedingRules(
        uint8 requiredParents,
        uint16 generationCooldownMultiplier,
        uint256 breedCooldownSeconds,
        uint8[] genes,
        uint256[] mutationRates
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // Constructor
    function initialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        BreedingRules calldata breedingRules,
        address _forwarder
    ) external initializer {
        __MinterBreeding_init(
            _admin,
            _mintFeeToken,
            _mintFeeAddress,
            _mintFeeAmount,
            _nftContractAddr,
            breedingRules,
            _forwarder
        );
    }

    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        BreedingRules calldata breedingRules,
        address _forwarder
    ) external onlyInitializing {
        __MinterBreeding_init(
            _admin,
            _mintFeeToken,
            _mintFeeAddress,
            _mintFeeAmount,
            _nftContractAddr,
            breedingRules,
            _forwarder
        );
    }

    function __MinterBreeding_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        BreedingRules calldata breedingRules,
        address _forwarder
    ) internal onlyInitializing {
        __MinterCore_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
        __MinterBreeding_init_unchained(breedingRules);
    }

    function __MinterBreeding_init_unchained(BreedingRules calldata breedingRules) internal onlyInitializing {
        // Call with verifications
        _setBreedingRules(
            breedingRules.requiredParents,
            breedingRules.generationCooldownMultiplier,
            breedingRules.breedCooldownSeconds,
            breedingRules.genes,
            breedingRules.mutationRates
        );
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function breed(uint256[] calldata parents) public returns (uint256 dna) {
        // Breed species
        dna = _breedSpecies(parents);

        // Mint Operation
        MinterCore._mintForFee(_msgSender(), dna);
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function safeBreed(uint256[] calldata parents) public returns (uint256 dna) {
        // Breed species
        dna = _breedSpecies(parents);

        // Mint Operation
        MinterCore._safeMintForFee(_msgSender(), dna);
    }

    function setBreedingRules(
        uint8 requiredParents,
        uint16 generationCooldownMultiplier,
        uint256 breedCooldownSeconds,
        uint8[] memory genes,
        uint256[] memory mutationRates
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setBreedingRules(requiredParents, generationCooldownMultiplier, breedCooldownSeconds, genes, mutationRates);
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function _setBreedingRules(
        uint8 requiredParents,
        uint16 generationCooldownMultiplier,
        uint256 breedCooldownSeconds,
        uint8[] memory genes,
        uint256[] memory mutationRates
    ) private {
        // Initial input checks
        require(genes.length >= 1, 'At least one gene must be specified!');
        require(
            mutationRates.length == 0 || mutationRates.length == genes.length,
            'Mutation rates must be 0 or equal genes.length'
        );

        // Get pointer (easier assignments)
        BreedingRules storage r = _breedingRules;

        // Required parents
        r.requiredParents = requiredParents;

        // Generation cooldowns must not exist or genes MUST start at 8
        require(generationCooldownMultiplier == 0 || genes[0] == 8, 'Generations requires gene[0]=8');
        r.generationCooldownMultiplier = generationCooldownMultiplier;

        // Breed cooldown seconds
        r.breedCooldownSeconds = breedCooldownSeconds;

        // Set array vals
        // Delete if exists
        if (r.genes.length > 0) delete r.genes;
        // Copy genes from memory to storage
        for (uint256 i = 0; i < genes.length; i++) r.genes.push(genes[i]);

        // Delete if exists
        if (r.mutationRates.length > 0) delete r.mutationRates;
        // Copy genes from memory to storage
        for (uint256 i = 0; i < mutationRates.length; i++) r.mutationRates.push(mutationRates[i]);

        emit SetBreedingRules(
            requiredParents,
            generationCooldownMultiplier,
            breedCooldownSeconds,
            genes,
            mutationRates
        );
    }

    /**
     * @dev Internal function to do the heavy lifting for breeding
     * @param parents parents to use for breeding
     */
    function _breedSpecies(uint256[] calldata parents) internal returns (uint256 dna) {
        // Fetch breeding rules
        uint8 requiredParents;
        uint16 generationCooldownMultiplier;
        uint256 breedCooldownSeconds;
        uint8[] memory genes;
        uint256[] memory mutationRates;
        (
            requiredParents,
            generationCooldownMultiplier,
            breedCooldownSeconds,
            genes,
            mutationRates
        ) = getBreedingRules();

        // Make sure we're following rules
        require(parents.length == requiredParents, 'Invalid number of parents!');

        ERC721Owl nft = ERC721Owl(nftContractAddr);
        for (uint256 i = 0; i < parents.length; i++) {
            // Cooldown = regular cooldown.
            // If generations are enabled, += generation * generationMultiplier
            uint256 cooldown = breedCooldownSeconds;
            if (generationCooldownMultiplier != 0) {
                uint8 parentGeneration = RosalindDNA.getGenCount(parents[i]);
                cooldown += parentGeneration * generationCooldownMultiplier;
            }

            // Require not on cooldown
            require(cooldown < block.timestamp - lastBredTime[parents[i]], 'NFT currently on cooldown!');

            // By updating the timestamp right after each check,
            // we prevent the same parent from being entered twice.
            lastBredTime[parents[i]] = block.timestamp;

            // Require ownership of NFTs
            require(_msgSender() == nft.ownerOf(parents[i]), 'You must own all parents!');
        }

        // Get Parent DNA
        uint256[] memory parentsDNA = new uint256[](parents.length);
        for (uint256 i = 0; i < parents.length; i++)
            parentsDNA[i] = IERC721OwlAttributes(nftContractAddr).getDna(parents[i]);

        // Generate random seed and breed
        // TODO - replace with VRF
        uint256 randomSeed = SourceRandom.getRandomDebug();
        if (mutationRates.length == 0) dna = RosalindDNA.breedDNASimple(parentsDNA, genes, randomSeed);
        else dna = RosalindDNA.breedDNAWithMutations(parentsDNA, genes, randomSeed, mutationRates);

        // Generation Counting
        if (generationCooldownMultiplier != 0) dna = RosalindDNA.setGenCount(dna, parentsDNA);

        return dna;
    }

    /**
     * @dev Internal function to do the heavy lifting for breeding
     * @return requiredParents number of parents required
     * @return generationCooldownMultiplier generation cooldowns
     * @return breedCooldownSeconds number of seconds to cooldown
     * @return genes 256-bit gene split locations
     * @return mutationRates mutation rate locations
     */
    function getBreedingRules()
        public
        view
        returns (
            uint8 requiredParents,
            uint16 generationCooldownMultiplier,
            uint256 breedCooldownSeconds,
            uint8[] memory genes,
            uint256[] memory mutationRates
        )
    {
        BreedingRules storage rules = _breedingRules;

        // Require parents (2 by default)
        requiredParents = rules.requiredParents;

        // Generation cooldown multiplier
        generationCooldownMultiplier = rules.generationCooldownMultiplier;

        // Cooldown (7 days by default)
        breedCooldownSeconds = rules.breedCooldownSeconds;

        // Pickup gene splits (from storage configuration), read into memory
        genes = new uint8[](rules.genes.length);
        for (uint256 i = 0; i < genes.length; i++) genes[i] = rules.genes[i];

        // Grab mutation rates (none by default)
        mutationRates = new uint256[](rules.mutationRates.length);
        for (uint256 i = 0; i < mutationRates.length; i++) mutationRates[i] = rules.mutationRates[i];
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
        uint16 generationCooldownMultiplier,
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
            uint16 generationCooldownMultiplier,
            uint256 breedCooldownSeconds,
            uint8[] memory genes,
            uint256[] memory mutationRates
        );
}

interface IERC721OwlAttributes {
    /**
     * @dev Getter for dna of tokenId
     * @param tokenId whose dna to change
     * @return dna of tokenId
     */
    function getDna(uint256 tokenId) external view returns (uint256);
}
