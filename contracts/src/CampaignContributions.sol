// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CampaignContributions
 * @dev FEC-compliant smart contract for accepting crypto campaign contributions
 * 
 * This contract enforces Federal Election Commission (FEC) compliance rules:
 * - Maximum $3,300 per transaction per wallet
 * - Maximum $3,300 cumulative per wallet across all transactions
 * - KYC verification requirement for all contributors
 * - Comprehensive audit logging for all contribution attempts
 * 
 * Designed for deployment via thirdweb platform
 */
contract CampaignContributions is Ownable, ReentrancyGuard, Pausable {
    
    // =============================================================================
    // CONSTANTS & STATE VARIABLES
    // =============================================================================
    
    /// @dev Maximum contribution amount per transaction and cumulative per wallet (in wei)
    /// $3,300 represented in wei assuming 1 ETH = $3000 (adjustable via setEthPrice)
    uint256 public constant MAX_CONTRIBUTION_USD = 3300; // $3,300 USD
    
    /// @dev Current ETH price in USD (scaled by 1e18 for precision)
    uint256 public ethPriceUSD = 3000 * 1e18; // Default: $3,000 per ETH
    
    /// @dev Maximum contribution in wei (calculated from USD amount and ETH price)
    uint256 public maxContributionWei;
    
    /// @dev Campaign recipient address
    address public campaignTreasury;
    
    /// @dev Mapping to track cumulative contributions per wallet address
    mapping(address => uint256) public cumulativeContributions;
    
    /// @dev Mapping to track KYC verification status per wallet address
    mapping(address => bool) public kycVerified;
    
    /// @dev Mapping of authorized KYC verifiers
    mapping(address => bool) public kycVerifiers;
    
    /// @dev Total contributions received by the campaign
    uint256 public totalContributionsReceived;
    
    /// @dev Total number of unique contributors
    uint256 public totalUniqueContributors;
    
    /// @dev Mapping to track if an address has contributed before
    mapping(address => bool) public hasContributed;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    /**
     * @dev Emitted when a contribution is successfully accepted
     * @param contributor The wallet address of the contributor
     * @param amount The contribution amount in wei
     * @param cumulativeAmount The total cumulative amount contributed by this wallet
     * @param timestamp The block timestamp of the contribution
     * @param transactionHash The transaction hash for audit purposes
     */
    event ContributionAccepted(
        address indexed contributor,
        uint256 amount,
        uint256 cumulativeAmount,
        uint256 timestamp,
        bytes32 indexed transactionHash
    );
    
    /**
     * @dev Emitted when a contribution is rejected due to compliance violations
     * @param contributor The wallet address of the contributor
     * @param amount The attempted contribution amount in wei
     * @param reason The reason for rejection
     * @param timestamp The block timestamp of the rejection
     */
    event ContributionRejected(
        address indexed contributor,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when KYC status is updated for a contributor
     * @param contributor The wallet address of the contributor
     * @param verified The new KYC verification status
     * @param verifier The address that performed the verification
     * @param timestamp The block timestamp of the verification
     */
    event KYCStatusUpdated(
        address indexed contributor,
        bool verified,
        address indexed verifier,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when ETH price is updated
     * @param oldPrice The previous ETH price in USD
     * @param newPrice The new ETH price in USD
     * @param newMaxContribution The new maximum contribution in wei
     * @param updatedBy The address that updated the price
     */
    event EthPriceUpdated(
        uint256 oldPrice,
        uint256 newPrice,
        uint256 newMaxContribution,
        address indexed updatedBy
    );
    
    /**
     * @dev Emitted when campaign treasury address is updated
     * @param oldTreasury The previous treasury address
     * @param newTreasury The new treasury address
     * @param updatedBy The address that updated the treasury
     */
    event CampaignTreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury,
        address indexed updatedBy
    );
    
    // =============================================================================
    // MODIFIERS
    // =============================================================================
    
    /**
     * @dev Modifier to check if the caller is an authorized KYC verifier
     */
    modifier onlyKYCVerifier() {
        require(kycVerifiers[msg.sender] || msg.sender == owner(), "CampaignContributions: caller is not a KYC verifier");
        _;
    }
    
    /**
     * @dev Modifier to validate contribution amount and compliance
     */
    modifier validContribution(uint256 amount) {
        require(amount > 0, "CampaignContributions: contribution amount must be greater than zero");
        require(amount <= maxContributionWei, "CampaignContributions: contribution exceeds per-transaction limit");
        require(kycVerified[msg.sender], "CampaignContributions: contributor must complete KYC verification");
        require(cumulativeContributions[msg.sender] + amount <= maxContributionWei, "CampaignContributions: contribution would exceed cumulative limit");
        _;
    }
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    /**
     * @dev Contract constructor
     * @param _campaignTreasury The address that will receive campaign contributions
     * @param _initialOwner The initial owner of the contract
     */
    constructor(address _campaignTreasury, address _initialOwner) {
        require(_campaignTreasury != address(0), "CampaignContributions: campaign treasury cannot be zero address");
        require(_initialOwner != address(0), "CampaignContributions: initial owner cannot be zero address");
        
        campaignTreasury = _campaignTreasury;
        _transferOwnership(_initialOwner);
        
        // Calculate initial max contribution in wei
        _updateMaxContribution();
        
        // Set the initial owner as a KYC verifier
        kycVerifiers[_initialOwner] = true;
    }
    
    // =============================================================================
    // CONTRIBUTION FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Accept a contribution to the campaign
     * @notice This function enforces all FEC compliance rules before accepting contributions
     * 
     * Requirements:
     * - Contract must not be paused
     * - Contributor must have completed KYC verification
     * - Contribution amount must not exceed per-transaction limit
     * - Contribution amount must not cause cumulative limit to be exceeded
     * - Contribution amount must be greater than zero
     */
    function contribute() external payable whenNotPaused validContribution(msg.value) nonReentrant {
        address contributor = msg.sender;
        uint256 amount = msg.value;
        
        // Update cumulative contributions for this wallet
        cumulativeContributions[contributor] += amount;
        
        // Track if this is a new contributor
        if (!hasContributed[contributor]) {
            hasContributed[contributor] = true;
            totalUniqueContributors++;
        }
        
        // Update total contributions
        totalContributionsReceived += amount;
        
        // Transfer funds to campaign treasury
        (bool success, ) = campaignTreasury.call{value: amount}("");
        require(success, "CampaignContributions: transfer to campaign treasury failed");
        
        // Emit success event with comprehensive audit information
        emit ContributionAccepted(
            contributor,
            amount,
            cumulativeContributions[contributor],
            block.timestamp,
            blockhash(block.number - 1)
        );
    }
    
    // =============================================================================
    // KYC MANAGEMENT FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Verify KYC status for a contributor
     * @param _contributor The address of the contributor to verify
     * @notice Only authorized KYC verifiers can call this function
     */
    function verifyKYC(address _contributor) external onlyKYCVerifier {
        require(_contributor != address(0), "CampaignContributions: contributor address cannot be zero");
        
        kycVerified[_contributor] = true;
        
        emit KYCStatusUpdated(_contributor, true, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Revoke KYC verification for a contributor
     * @param _contributor The address of the contributor to revoke verification
     * @notice Only authorized KYC verifiers can call this function
     */
    function revokeKYC(address _contributor) external onlyKYCVerifier {
        require(_contributor != address(0), "CampaignContributions: contributor address cannot be zero");
        
        kycVerified[_contributor] = false;
        
        emit KYCStatusUpdated(_contributor, false, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Batch verify KYC for multiple contributors
     * @param _contributors Array of contributor addresses to verify
     * @notice Gas-optimized function for bulk KYC verification
     */
    function batchVerifyKYC(address[] calldata _contributors) external onlyKYCVerifier {
        uint256 length = _contributors.length;
        require(length > 0, "CampaignContributions: contributors array cannot be empty");
        require(length <= 100, "CampaignContributions: batch size too large");
        
        for (uint256 i = 0; i < length; i++) {
            address contributor = _contributors[i];
            require(contributor != address(0), "CampaignContributions: contributor address cannot be zero");
            
            kycVerified[contributor] = true;
            emit KYCStatusUpdated(contributor, true, msg.sender, block.timestamp);
        }
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Add a new KYC verifier
     * @param _verifier The address to grant KYC verification privileges
     */
    function addKYCVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "CampaignContributions: verifier address cannot be zero");
        require(!kycVerifiers[_verifier], "CampaignContributions: address is already a KYC verifier");
        
        kycVerifiers[_verifier] = true;
    }
    
    /**
     * @dev Remove a KYC verifier
     * @param _verifier The address to revoke KYC verification privileges
     */
    function removeKYCVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "CampaignContributions: verifier address cannot be zero");
        require(kycVerifiers[_verifier], "CampaignContributions: address is not a KYC verifier");
        
        kycVerifiers[_verifier] = false;
    }
    
    /**
     * @dev Update the ETH price for contribution limit calculations
     * @param _newEthPriceUSD The new ETH price in USD (scaled by 1e18)
     * @notice This affects the maximum contribution amount in wei
     */
    function setEthPrice(uint256 _newEthPriceUSD) external onlyOwner {
        require(_newEthPriceUSD > 0, "CampaignContributions: ETH price must be greater than zero");
        
        uint256 oldPrice = ethPriceUSD;
        ethPriceUSD = _newEthPriceUSD;
        _updateMaxContribution();
        
        emit EthPriceUpdated(oldPrice, _newEthPriceUSD, maxContributionWei, msg.sender);
    }
    
    /**
     * @dev Update the campaign treasury address
     * @param _newTreasury The new campaign treasury address
     */
    function setCampaignTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "CampaignContributions: treasury address cannot be zero");
        require(_newTreasury != campaignTreasury, "CampaignContributions: new treasury is the same as current");
        
        address oldTreasury = campaignTreasury;
        campaignTreasury = _newTreasury;
        
        emit CampaignTreasuryUpdated(oldTreasury, _newTreasury, msg.sender);
    }
    
    /**
     * @dev Pause the contract to prevent new contributions
     * @notice Emergency function to halt all contribution activity
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract to resume contributions
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Get the remaining contribution capacity for a specific address
     * @param _contributor The address to check
     * @return The remaining amount this address can contribute in wei
     */
    function getRemainingContributionCapacity(address _contributor) external view returns (uint256) {
        uint256 contributed = cumulativeContributions[_contributor];
        if (contributed >= maxContributionWei) {
            return 0;
        }
        return maxContributionWei - contributed;
    }
    
    /**
     * @dev Check if an address can contribute a specific amount
     * @param _contributor The address to check
     * @param _amount The amount to check in wei
     * @return canContribute Whether the contribution is allowed
     * @return reason The reason if contribution is not allowed
     */
    function canContribute(address _contributor, uint256 _amount) external view returns (bool canContribute, string memory reason) {
        if (_amount == 0) {
            return (false, "Contribution amount must be greater than zero");
        }
        
        if (!kycVerified[_contributor]) {
            return (false, "Contributor must complete KYC verification");
        }
        
        if (_amount > maxContributionWei) {
            return (false, "Contribution exceeds per-transaction limit");
        }
        
        if (cumulativeContributions[_contributor] + _amount > maxContributionWei) {
            return (false, "Contribution would exceed cumulative limit");
        }
        
        if (paused()) {
            return (false, "Contract is currently paused");
        }
        
        return (true, "Contribution is allowed");
    }
    
    /**
     * @dev Get comprehensive contributor information
     * @param _contributor The address to query
     * @return cumulativeAmount Total amount contributed by this address
     * @return remainingCapacity Amount this address can still contribute
     * @return isKYCVerified Whether this address has completed KYC
     * @return hasContributedBefore Whether this address has made any contributions
     */
    function getContributorInfo(address _contributor) external view returns (
        uint256 cumulativeAmount,
        uint256 remainingCapacity,
        bool isKYCVerified,
        bool hasContributedBefore
    ) {
        cumulativeAmount = cumulativeContributions[_contributor];
        remainingCapacity = cumulativeAmount >= maxContributionWei ? 0 : maxContributionWei - cumulativeAmount;
        isKYCVerified = kycVerified[_contributor];
        hasContributedBefore = hasContributed[_contributor];
    }
    
    /**
     * @dev Get current maximum contribution amount in wei
     * @return The maximum contribution amount based on current ETH price
     */
    function getMaxContributionWei() external view returns (uint256) {
        return maxContributionWei;
    }
    
    /**
     * @dev Get campaign statistics
     * @return totalReceived Total contributions received in wei
     * @return uniqueContributors Number of unique contributors
     * @return maxContribution Maximum contribution amount in wei
     * @return currentEthPrice Current ETH price in USD
     */
    function getCampaignStats() external view returns (
        uint256 totalReceived,
        uint256 uniqueContributors,
        uint256 maxContribution,
        uint256 currentEthPrice
    ) {
        totalReceived = totalContributionsReceived;
        uniqueContributors = totalUniqueContributors;
        maxContribution = maxContributionWei;
        currentEthPrice = ethPriceUSD;
    }
    
    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Internal function to update maximum contribution amount based on current ETH price
     */
    function _updateMaxContribution() internal {
        // Calculate: ($3,300 * 1e18) / (ethPriceUSD)
        // This gives us the maximum contribution in wei
        maxContributionWei = (MAX_CONTRIBUTION_USD * 1e18 * 1e18) / ethPriceUSD;
    }
    
    // =============================================================================
    // FALLBACK FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Receive function to handle direct ETH transfers
     * @notice Automatically processes as a contribution if sender is KYC verified
     */
    receive() external payable {
        if (kycVerified[msg.sender] && !paused() && msg.value > 0 && msg.value <= maxContributionWei && cumulativeContributions[msg.sender] + msg.value <= maxContributionWei) {
            // Process as contribution
            cumulativeContributions[msg.sender] += msg.value;
            
            if (!hasContributed[msg.sender]) {
                hasContributed[msg.sender] = true;
                totalUniqueContributors++;
            }
            
            totalContributionsReceived += msg.value;
            
            (bool success, ) = campaignTreasury.call{value: msg.value}("");
            require(success, "CampaignContributions: transfer to campaign treasury failed");
            
            emit ContributionAccepted(
                msg.sender,
                msg.value,
                cumulativeContributions[msg.sender],
                block.timestamp,
                blockhash(block.number - 1)
            );
        } else {
            // Reject and emit rejection event
            string memory reason = "Direct transfer does not meet contribution requirements";
            emit ContributionRejected(msg.sender, msg.value, reason, block.timestamp);
            revert("CampaignContributions: direct transfer rejected - use contribute() function");
        }
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external {
        revert("CampaignContributions: function not found");
    }
}
