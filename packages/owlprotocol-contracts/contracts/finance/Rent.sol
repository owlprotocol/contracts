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

import '../assets/ERC721/ERC721OwlExpiring.sol';

import 'hardhat/console.sol';

contract Rent is ERC721HolderUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
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

    //Rental Terms Struct
    struct RentalTerms {
        uint256 nftId;
        address owner;
        address renter;
        bool ended;
        uint256 timePeriods; //number of rental periods to pay
        uint256 pricePerPeriod; //price of each rental period
        uint256 expireTimePerPeriod; //expire time per rental period
    }

    address public acceptableToken;
    address public shadowAddr; //address of where the shadow NFT is minted
    address public contractAddr; //address of original NFT
    uint256 numRentals; //number of Rentals made

    mapping(uint256 => RentalTerms) public rentTermsId; //maps a rent ID to its specific Rental Terms
    mapping(uint256 => uint256) timePeriodsPaid; //maps the rental id to the number of time periods paid
    mapping(address => uint256) balances; //maps an owner to the balances they can claim

    /**********************
        Initialization
    **********************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Create Renting instance
     * @param _admin launcher (us)
     * @param _acceptableToken accepted ERC20 token for payment
     * @param _contractAddr contract address for NFT
     * @param _shadowAddr address where shadow NFT is minted
     */
    function initialize(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr
    ) external initializer {
        __Rent_init(_admin, _acceptableToken, _contractAddr, _shadowAddr);
    }

    function proxyInitialize(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr
    ) external onlyInitializing {
        __Rent_init(_admin, _acceptableToken, _contractAddr, _shadowAddr);
    }

    function __Rent_init(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr
    ) internal onlyInitializing {
        __Ownable_init();
        __Rent_init_unchained(_admin, _acceptableToken, _contractAddr, _shadowAddr);
    }

    function __Rent_init_unchained(
        address _admin,
        address _acceptableToken,
        address _contractAddr,
        address _shadowAddr
    ) internal onlyInitializing {
        _transferOwnership(_admin);
        acceptableToken = _acceptableToken;
        contractAddr = _contractAddr;
        shadowAddr = _shadowAddr;
        numRentals = 0;
    }

    /**********************
         Interaction
    **********************/

    function createRental(RentalTerms calldata rentalTerm) external {
        rentTermsId[numRentals] = rentalTerm; //maps ID = numRentals to passed in rentalTerm
        timePeriodsPaid[numRentals] = 0; //initial number of rent periods paid set to 0

        //transfer nft from rental term from the owner to this contract address
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
        numRentals++; //increment rentId counter
    }

    function startRent(uint256 rentId) external payable {
        //should be called by the renter
        require(timePeriodsPaid[rentId] == 0, 'rent has already been started');
        RentalTerms memory r = rentTermsId[rentId];

        payRent(rentId, 1);
        ERC721OwlExpiring(shadowAddr).mint(r.renter, r.nftId, r.expireTimePerPeriod); //mints shadow nft

        emit Pay(rentId, r.pricePerPeriod);
    }

    function payRent(uint256 rentId, uint256 timePeriodsToPay) public payable {
        require(_msgSender() == rentTermsId[rentId].renter, 'you are not the renter and cannot pay rent');
        require(!rentTermsId[rentId].ended, 'Rent has been terminated');
        require(
            timePeriodsPaid[rentId] + timePeriodsToPay <= rentTermsId[rentId].timePeriods,
            'you are trying to pay for extra periods!'
        );

        timePeriodsPaid[rentId] += timePeriodsToPay;
        RentalTerms memory r = rentTermsId[rentId];
        balances[r.owner] += timePeriodsToPay * r.pricePerPeriod;

        SafeERC20Upgradeable.safeTransferFrom(
            IERC20Upgradeable(acceptableToken),
            r.renter,
            address(this),
            timePeriodsToPay * r.pricePerPeriod
        );

        ERC721OwlExpiring(shadowAddr).extendExpiry(rentId, timePeriodsToPay * r.expireTimePerPeriod);

        emit Pay(rentId, timePeriodsToPay * r.pricePerPeriod);
    }

    function endRental(uint256 rentalId) external payable {
        //make sure its owner calling function and transfer nft back to them from this contract
        require(_msgSender() == rentTermsId[rentalId].owner, 'you are not the owner and cannot end the rental');

        rentTermsId[rentalId].ended = true;

        IERC721Upgradeable(contractAddr).safeTransferFrom(
            address(this),
            rentTermsId[rentalId].owner,
            rentTermsId[rentalId].nftId
        );

        emit End(rentalId, timePeriodsPaid[rentalId] * rentTermsId[rentalId].pricePerPeriod);
    }

    function ownerClaim() external payable {
        uint256 bal = balances[_msgSender()];
        balances[_msgSender()] = 0;
        IERC20Upgradeable(acceptableToken).transfer(_msgSender(), bal);

        emit Claim(_msgSender(), bal);
    }

    /**
    Getters
    */

    function getRental(uint256 rentId) external view returns (RentalTerms memory) {
        //returns a rental based on the rentalId
        return rentTermsId[rentId];
    }

    function getNumRentals() external view returns (uint256) {
        return numRentals;
    }

    function getTimePeriodsPaid(uint256 rentalId) external view returns (uint256) {
        //returns number of time periods paid based on the rentalId
        return timePeriodsPaid[rentalId];
    }

    function getTimePeriodsLeftToPay(uint256 rentalId) external view returns (uint256) {
        //returns number of time periods left to pay
        return rentTermsId[rentalId].timePeriods - timePeriodsPaid[rentalId];
    }

    function getBalance(address owner) external view returns (uint256) {
        //returns claimable funds for an owner
        return balances[owner];
    }

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
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == ERC165TAG;
    }
}
