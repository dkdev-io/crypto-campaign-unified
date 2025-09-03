# Smart Contract Testing Plan - CampaignContributions

## Contract Overview
The CampaignContributions.sol smart contract enforces FEC-compliant campaign contribution rules:
- **$3,300 maximum** per wallet (both per-transaction and cumulative)
- **KYC verification required** before contributions
- **Treasury receives funds** automatically
- **Full audit trail** of all attempts

## Testing Prerequisites

### 1. Deploy Contract (if not already deployed)
```bash
# Via thirdweb CLI
npx thirdweb deploy

# Or via Hardhat
npx hardhat run contracts/scripts/deploy.js --network sepolia
```

### 2. Required Test Wallets
- **Owner wallet**: Contract deployer with admin rights
- **KYC Verifier wallet**: Can verify contributor KYC
- **Treasury wallet**: Receives all contributions
- **Test contributor wallets** (at least 3):
  - Wallet A: For normal flow testing
  - Wallet B: For limit testing
  - Wallet C: For rejection testing

## Test Scenarios

### Test 1: KYC Verification Flow
**Objective**: Verify KYC system prevents unverified contributions

1. **Setup**:
   - Use unverified test wallet
   - Have some test ETH ready

2. **Test Steps**:
   ```javascript
   // Step 1: Attempt contribution without KYC (should fail)
   await contract.contribute({ value: ethers.parseEther("0.1") })
   // Expected: Transaction reverts with "CampaignContributions: contributor must complete KYC verification"

   // Step 2: Verify KYC (as KYC verifier)
   await contract.connect(kycVerifier).verifyKYC(contributorAddress)
   // Expected: KYCStatusUpdated event emitted

   // Step 3: Check KYC status
   const isVerified = await contract.kycVerified(contributorAddress)
   // Expected: Returns true

   // Step 4: Retry contribution (should succeed)
   await contract.contribute({ value: ethers.parseEther("0.1") })
   // Expected: ContributionAccepted event emitted
   ```

3. **Validation**:
   - Check event logs for KYCStatusUpdated
   - Verify kycVerified mapping updated
   - Confirm contribution only works after KYC

### Test 2: Contribution Limits ($3,300 Max)
**Objective**: Verify both per-transaction and cumulative limits

1. **Setup**:
   - KYC-verified wallet
   - Current ETH price in contract (default $3,000/ETH)
   - Max contribution = 1.1 ETH ($3,300 / $3,000)

2. **Test Steps**:
   ```javascript
   // Step 1: Check current limits
   const maxWei = await contract.getMaxContributionWei()
   console.log("Max contribution:", ethers.formatEther(maxWei), "ETH")

   // Step 2: Attempt over-limit contribution (should fail)
   await contract.contribute({ value: ethers.parseEther("2.0") })
   // Expected: Reverts with "CampaignContributions: contribution exceeds per-transaction limit"

   // Step 3: Make valid contribution (half of max)
   await contract.contribute({ value: ethers.parseEther("0.55") })
   // Expected: Success, ContributionAccepted event

   // Step 4: Check remaining capacity
   const remaining = await contract.getRemainingContributionCapacity(contributorAddress)
   console.log("Remaining capacity:", ethers.formatEther(remaining), "ETH")

   // Step 5: Attempt another half (should succeed)
   await contract.contribute({ value: ethers.parseEther("0.55") })
   // Expected: Success, total now at 1.1 ETH

   // Step 6: Attempt any additional amount (should fail)
   await contract.contribute({ value: ethers.parseEther("0.01") })
   // Expected: Reverts with "CampaignContributions: contribution would exceed cumulative limit"
   ```

3. **Validation**:
   - Verify cumulativeContributions mapping
   - Check getRemainingContributionCapacity returns 0
   - Confirm total contributions = max allowed

### Test 3: Cumulative Tracking
**Objective**: Verify cumulative contributions tracked correctly

1. **Setup**:
   - Fresh KYC-verified wallet
   - Multiple small contributions

2. **Test Steps**:
   ```javascript
   // Make 5 contributions of 0.2 ETH each
   for (let i = 0; i < 5; i++) {
     await contract.contribute({ value: ethers.parseEther("0.2") })
     
     const info = await contract.getContributorInfo(contributorAddress)
     console.log(`After contribution ${i+1}:`)
     console.log("  Cumulative:", ethers.formatEther(info.cumulativeAmount))
     console.log("  Remaining:", ethers.formatEther(info.remainingCapacity))
   }

   // 6th contribution should fail (would exceed 1.1 ETH limit)
   await contract.contribute({ value: ethers.parseEther("0.2") })
   // Expected: Reverts
   ```

3. **Validation**:
   - Each contribution updates cumulative total
   - Remaining capacity decreases correctly
   - Cannot exceed $3,300 total

### Test 4: Treasury Fund Transfer
**Objective**: Verify funds reach treasury address

1. **Setup**:
   - Note treasury balance before
   - KYC-verified contributor

2. **Test Steps**:
   ```javascript
   // Step 1: Check treasury balance
   const balanceBefore = await ethers.provider.getBalance(treasuryAddress)

   // Step 2: Make contribution
   const amount = ethers.parseEther("0.5")
   await contract.contribute({ value: amount })

   // Step 3: Check treasury received funds
   const balanceAfter = await ethers.provider.getBalance(treasuryAddress)
   const received = balanceAfter - balanceBefore

   console.log("Treasury received:", ethers.formatEther(received), "ETH")
   // Expected: Exactly 0.5 ETH increase
   ```

3. **Validation**:
   - Treasury balance increases by exact contribution
   - No funds remain in contract
   - Transfer happens immediately

### Test 5: Direct ETH Transfer (receive function)
**Objective**: Test automatic contribution via direct transfer

1. **Test Steps**:
   ```javascript
   // For KYC verified wallet with remaining capacity
   await signer.sendTransaction({
     to: contractAddress,
     value: ethers.parseEther("0.1")
   })
   // Expected: Processed as contribution if all conditions met

   // For non-KYC wallet
   await nonKycSigner.sendTransaction({
     to: contractAddress,
     value: ethers.parseEther("0.1")
   })
   // Expected: Reverts with rejection message
   ```

### Test 6: Admin Functions
**Objective**: Test owner-only functions

1. **Test Steps**:
   ```javascript
   // As owner
   await contract.connect(owner).pause()
   // Expected: Contract paused, contributions blocked

   await contract.connect(owner).setEthPrice(ethers.parseEther("4000"))
   // Expected: Max contribution updated to 0.825 ETH

   // As non-owner (should fail)
   await contract.connect(contributor).pause()
   // Expected: Reverts with ownership error
   ```

## Testing via Frontend (lovable.app)

### URL: https://testy-pink-chancellor.lovable.app

1. **Connect Wallet**:
   - Use MetaMask or compatible wallet
   - Switch to correct network (Sepolia/Mainnet)

2. **Test Form Submission**:
   - Fill out donor information
   - Enter contribution amount
   - Submit and check MetaMask popup

3. **Verify Contract Interaction**:
   - Check transaction details show correct contract
   - Verify amount matches form input
   - Confirm treasury as recipient

4. **Check Transaction Status**:
   - Monitor Etherscan for confirmation
   - Verify events emitted correctly
   - Check contributor info updated

## Automated Testing Script

```javascript
// Save as: test-deployed-contract.js
const { ethers } = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  const abi = require("./artifacts/contracts/src/CampaignContributions.sol/CampaignContributions.json").abi;
  
  const contract = await ethers.getContractAt(abi, CONTRACT_ADDRESS);
  
  // Run all test scenarios
  console.log("Running contract tests...");
  
  // Test 1: Check deployment
  const treasury = await contract.campaignTreasury();
  console.log("✓ Contract deployed, treasury:", treasury);
  
  // Test 2: Check limits
  const maxWei = await contract.getMaxContributionWei();
  console.log("✓ Max contribution:", ethers.formatEther(maxWei), "ETH");
  
  // Add more tests as needed
}

main().catch(console.error);
```

## Critical Validation Points

1. **KYC Enforcement**: No contributions without verification
2. **Limit Enforcement**: Cannot exceed $3,300 cumulative
3. **Treasury Receipt**: All funds reach treasury address
4. **Event Emission**: All actions logged for audit
5. **Admin Controls**: Only owner can pause/configure

## Security Considerations

- Never test with real campaign funds
- Use testnet (Sepolia) for initial testing
- Verify contract address matches deployment
- Check all events in block explorer
- Monitor gas costs for optimization

## Post-Testing Checklist

- [ ] KYC system blocks unverified users
- [ ] $3,300 limit enforced (per-tx and cumulative)
- [ ] Treasury receives all contributions
- [ ] Events logged correctly for audit
- [ ] Admin functions restricted to owner
- [ ] Frontend integration working
- [ ] Gas costs acceptable
- [ ] Error messages clear and helpful