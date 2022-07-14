// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '../OwlBase.sol';
import '../assets/ERC721/ERC721OwlExpiring.sol';

/**
 * @dev This Rent contract serves as a middleman and allows owners of NFTs to lock their assets in this
 * smart contract for a fixed epoch period. The contract then mints a new identical "shadow" NFT on a separate
 * smart contract. This "shadow" NFT can be sold and transferred like any other NFT when being rented. However,
 * after the epoch is finished, the "shadow" NFT is destroyed and the original NFT is returned to its original owner.
 * This contract can handle multiple rentals at a time and keeps track of rental instances using a rentId. This contract
 * is great for allowing owners of NFTs to earn income by renting out their assets and incentivizes renters to get a
 * chance to temporarily own a cool NFT.
 */
contract Rent is OwlBase, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://Rent/', version)));

    /**********************
             Types
    **********************/
    event Create(
        uint256 indexed rentId,
        address indexed owner,
        address indexed renter,
        uint256 nftId,
        uint256 timePeriods,
        uint256 pricePerPeriod,
        uint256 expireTimePerPeriod
    );
    event Pay(uint256 indexed rentId, uint256 amountPaid);
    event End(uint256 indexed rentId, uint256 amountPaid);
    event Claim(address owner, uint256 amountClaimed);

    //Rental Terms Struct - outlines all terms for a rental instance
    struct RentalTerms {
        uint256 nftId; //NFT ID used in minting the "shadow" NFT
        address owner; //owner of original NFT
        address renter; //renter that will temporarily own the "shadow" NFT
        bool ended; //keeps track of rental duration
        uint256 timePeriods; //number of rental periods to pay
        uint256 pricePerPeriod; //price of each rental period
        uint256 expireTimePerPeriod; //expire time per rental period which will dictate rent duration
    }

    address public acceptableToken; //ERC20 token that is acceptable for payment
    address public shadowAddr; //address of where the shadow NFT is minted
    address public contractAddr; //address of original NFT
    uint256 numRentals; //number of Rentals made that is updated each time createRental is called

    mapping(uint256 => RentalTerms) public rentTermsId; //maps a rentId to its specific Rental Terms Struct
    mapping(uint256 => uint256) timePeriodsPaid; //maps the rental id to the number of time periods paid for that rental
    mapping(address => uint256) balances; //maps an owner to the balances they can claim at any point

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializing the Rent contract
     * @param _admin address of the launcher, which is this contract
     * @param _acceptableToken accepted ERC20 token for payment
     * @param _contractAddr contract address for original NFT
     * @param _shadowAddr address where "shadow" NFT is minted
     * @param _forwarder address for trusted forwarder for openGSN
     */
    function initialize(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr,
        address _forwarder
    ) external initializer {
        __Rent_init(_admin, _acceptableToken, _contractAddr, _shadowAddr, _forwarder);
    }

    function proxyInitialize(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr,
        address _forwarder
    ) external onlyInitializing {
        __Rent_init(_admin, _acceptableToken, _contractAddr, _shadowAddr, _forwarder);
    }

    function __Rent_init(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_admin, _forwarder);

        __Rent_init_unchained(_admin, _acceptableToken, _contractAddr, _shadowAddr);
    }

    function __Rent_init_unchained(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr
    ) internal onlyInitializing {
        acceptableToken = _acceptableToken;
        contractAddr = _contractAddr;
        shadowAddr = _shadowAddr;
        numRentals = 0;
    }

    /**********************
         Interaction
    **********************/

    /**
     * @dev Creates a single Rental based on the inputted Rental Term Struct that outlines all of the terms
     * for that specific rental instance.
     * Updates the various mappings and gives the Rental an ID.
     * Increments the number of Rentals handled by this contract
     * @param rentalTerm inputted rental term struct
     */
    function createRental(RentalTerms calldata rentalTerm) external {
        rentTermsId[numRentals] = rentalTerm; //maps ID = numRentals to the passed in rentalTerm
        timePeriodsPaid[numRentals] = 0; //initial number of rent periods paid for this Rental set to 0

        //Transfers the NFT from the owner defined in the inputted rentalTerm to this contract address
        IERC721Upgradeable(contractAddr).safeTransferFrom(rentalTerm.owner, address(this), rentalTerm.nftId);

        emit Create(
            numRentals,
            rentalTerm.owner,
            rentalTerm.renter,
            rentalTerm.nftId,
            rentalTerm.timePeriods,
            rentalTerm.pricePerPeriod,
            rentalTerm.expireTimePerPeriod
        );
        numRentals++; //increment rentId counter and the number of Rentals handled by this contract
    }

    /**
     * @notice this function can only be called at the very start of a Rental process. It must be called
     * to mint the shadow NFT
     * @dev Starts the payment process for the Rental with rentId with it's first payment
     * @param rentId inputted Rental ID that is used in the mapping to get the corresponding rental term struct
     */
    function startRent(uint256 rentId) external payable {
        //startRent should be called by the renter
        require(timePeriodsPaid[rentId] == 0, 'rent has already been started'); //makes sure no rent has been payed yet
        RentalTerms memory r = rentTermsId[rentId]; //uses mapping to get the corresponding rental term struct based on rentId

        payRent(rentId, 1); //calls the payRent method to pay rent for 1 time period only
        ERC721OwlExpiring(shadowAddr).mint(r.renter, r.nftId, r.expireTimePerPeriod); //mints "shadow" NFT on the separate address

        emit Pay(rentId, r.pricePerPeriod);
    }

    /**
     * @dev function that allows a renter to pay rent for any number of time periods
     * @param rentId inputted Rental ID that is used in the mapping to get the corresponding rental term struct
     * @param timePeriodsToPay allows the renter to decide how many time periods they want to pay for at once
     */
    function payRent(uint256 rentId, uint256 timePeriodsToPay) public payable {
        //payRent should be called by the renter
        require(_msgSender() == rentTermsId[rentId].renter, 'you are not the renter and cannot pay rent');
        require(!rentTermsId[rentId].ended, 'Rent has been terminated'); //rent cannot be terminated and rent duration must not be expired
        require(
            timePeriodsPaid[rentId] + timePeriodsToPay <= rentTermsId[rentId].timePeriods,
            'you are trying to pay for extra periods!'
        ); //renter must only be able to pay for at most the number of time periods that are defined in its corresponding rental terms struct

        //updates the number of time periods already paid by the renter
        timePeriodsPaid[rentId] += timePeriodsToPay;

        //updates the balances that the owner can claim based on how many periods are paid and their price
        RentalTerms memory r = rentTermsId[rentId];
        balances[r.owner] += timePeriodsToPay * r.pricePerPeriod;

        //transfers the price in ERC20 tokens owed by the renter to this contract
        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            r.renter,
            address(this),
            timePeriodsToPay * r.pricePerPeriod
        );

        //updates the "shadow" address with the rent duration based on how much has been paid
        //ensures that "shadow" NFT will not be destroyed yet because rent has been paid
        ERC721OwlExpiring(shadowAddr).extendExpiry(rentId, timePeriodsToPay * r.expireTimePerPeriod);

        emit Pay(rentId, timePeriodsToPay * r.pricePerPeriod);
    }

    /**
     * @notice this function only updates the boolean for the rent status (ended vs not) and
     * transfers the ownership of the NFT back to its owner. It does not give funds to the owner in ERC20 tokens
     * @dev this function allows the owner to end the rental at any point in time
     * @param rentalId inputted Rental ID that is used in the mapping to get the corresponding rental term struct
     */
    function endRental(uint256 rentalId) external payable {
        //endRental can only be paid by the owner
        require(_msgSender() == rentTermsId[rentalId].owner, 'you are not the owner and cannot end the rental');

        rentTermsId[rentalId].ended = true;

        //transfers ownership of the original NFT from this contract back to the respectful owner
        IERC721Upgradeable(contractAddr).safeTransferFrom(
            address(this),
            rentTermsId[rentalId].owner,
            rentTermsId[rentalId].nftId
        );

        emit End(rentalId, timePeriodsPaid[rentalId] * rentTermsId[rentalId].pricePerPeriod);
    }

    /**
     * @dev this function enables the owner to claim the balances paid by the renter
     */
    function ownerClaim() external payable {
        uint256 bal = balances[_msgSender()]; //temporarily holds all funds for the owner calling this function
        balances[_msgSender()] = 0; //resets funds to 0 after owner claims balances

        //transfers all funds to the owner calling this function in ERC20 tokens
        IERC20Upgradeable(acceptableToken).transfer(_msgSender(), bal);

        emit Claim(_msgSender(), bal);
    }

    /**
    Getters
    */

    /**
     * @dev gets a rental instance based on the inputted rentId
     * @param rentId inputted rental term struct id
     */
    function getRental(uint256 rentId) external view returns (RentalTerms memory) {
        //returns a rental based on the rentalId using the mapping
        return rentTermsId[rentId];
    }

    /**
     * @dev gets the number of rentals created on this contract
     */
    function getNumRentals() external view returns (uint256) {
        return numRentals;
    }

    /**
     * @dev gets the number of time periods paid by a renter for a specific Rental based on the inputted rentId
     * @param rentalId inputted rental term struct id
     */
    function getTimePeriodsPaid(uint256 rentalId) external view returns (uint256) {
        //returns number of time periods paid based on the rentalId using the mapping
        return timePeriodsPaid[rentalId];
    }

    /**
     * @dev gets how many time periods are left to pay for a specific Rental
     * @param rentalId inputted rental term struct id
     */
    function getTimePeriodsLeftToPay(uint256 rentalId) external view returns (uint256) {
        //returns number of time periods left to pay in a specific Rental
        return rentTermsId[rentalId].timePeriods - timePeriodsPaid[rentalId];
    }

    /**
     * @dev gets the total balance that is claimable by an owner
     * @param owner owner of a Rental that can call this function to see how much they can claim
     */
    function getBalance(address owner) external view returns (uint256) {
        //returns claimable funds for an owner
        return balances[owner];
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlUpgradeable, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}
