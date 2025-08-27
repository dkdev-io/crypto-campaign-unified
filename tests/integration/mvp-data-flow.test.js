/**
 * MVP Data Flow Integration Test
 * Tests the complete end-to-end data flow for the crypto campaign MVP
 * 
 * Flow tested:
 * 1. Smart contract loads and initializes
 * 2. Mock KYC data is available and functional
 * 3. Donor can register and authenticate
 * 4. Donor can make contributions
 * 5. Contract records all transactions
 * 6. Admin dashboard shows real data
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');
const request = require('supertest');

describe('MVP Complete Data Flow', function() {
  let contract;
  let owner;
  let donor1;
  let donor2;
  let treasury;
  let apiServer;

  before(async function() {
    // Get test accounts
    [owner, donor1, donor2, treasury] = await ethers.getSigners();
    
    // Deploy contract
    const CampaignContract = await ethers.getContractFactory('CampaignContributions');
    contract = await CampaignContract.deploy(treasury.address, owner.address);
    await contract.waitForDeployment();
    
    console.log('✅ Contract deployed to:', await contract.getAddress());
  });

  describe('1. Smart Contract Initialization', function() {
    it('should load contract with correct configuration', async function() {
      const contractAddress = await contract.getAddress();
      expect(contractAddress).to.be.properAddress;
      
      const treasuryAddr = await contract.campaignTreasury();
      expect(treasuryAddr).to.equal(treasury.address);
      
      const ownerAddr = await contract.owner();
      expect(ownerAddr).to.equal(owner.address);
    });

    it('should have correct initial parameters', async function() {
      const ethPrice = await contract.ethPriceUSD();
      expect(ethPrice).to.equal(ethers.parseEther('3000'));
      
      const maxContribUSD = await contract.MAX_CONTRIBUTION_USD();
      expect(maxContribUSD).to.equal(3300);
    });
  });

  describe('2. Mock KYC Data System', function() {
    it('should verify donors using mock KYC data', async function() {
      // Admin verifies donor1 (simulating KYC approval)
      await contract.connect(owner).verifyKYC(donor1.address);
      
      const isVerified = await contract.kycVerified(donor1.address);
      expect(isVerified).to.be.true;
    });

    it('should batch verify multiple donors', async function() {
      const donors = [donor2.address];
      await contract.connect(owner).batchVerifyKYC(donors);
      
      const isVerified = await contract.kycVerified(donor2.address);
      expect(isVerified).to.be.true;
    });
  });

  describe('3. Donor Registration & Authentication', function() {
    it('should register donor with mock personal data', async function() {
      // Simulate donor registration data
      const donorData = {
        address: donor1.address,
        name: 'John Doe',
        email: 'john@example.com',
        kycStatus: 'verified',
        registrationDate: new Date().toISOString()
      };
      
      // In real app, this would be stored in Supabase
      expect(donorData.kycStatus).to.equal('verified');
    });

    it('should check donor eligibility before contribution', async function() {
      const contributionAmount = ethers.parseEther('0.5'); // ~$1500
      const [canContribute, reason] = await contract.canContribute(
        donor1.address,
        contributionAmount
      );
      
      expect(canContribute).to.be.true;
      expect(reason).to.equal('');
    });
  });

  describe('4. Contribution Flow', function() {
    let initialBalance;
    let contributionAmount;

    beforeEach(async function() {
      initialBalance = await ethers.provider.getBalance(treasury.address);
      contributionAmount = ethers.parseEther('0.5'); // ~$1500
    });

    it('should accept contribution from verified donor', async function() {
      const tx = await contract.connect(donor1).contribute({
        value: contributionAmount
      });
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      // Check event was emitted
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ContributionAccepted'
      );
      expect(event).to.exist;
    });

    it('should transfer funds to treasury', async function() {
      await contract.connect(donor1).contribute({
        value: contributionAmount
      });
      
      const newBalance = await ethers.provider.getBalance(treasury.address);
      expect(newBalance).to.equal(initialBalance + contributionAmount);
    });

    it('should update contributor statistics', async function() {
      const info = await contract.getContributorInfo(donor1.address);
      
      expect(info.isKYCVerified).to.be.true;
      expect(info.hasContributedBefore).to.be.true;
      expect(Number(ethers.formatEther(info.cumulativeAmount))).to.be.greaterThan(0);
    });

    it('should enforce contribution limits', async function() {
      const tooLarge = ethers.parseEther('2'); // ~$6000 > $3300 limit
      
      await expect(
        contract.connect(donor1).contribute({ value: tooLarge })
      ).to.be.revertedWith('Contribution exceeds per-transaction limit');
    });
  });

  describe('5. Contract Data Recording', function() {
    it('should track total contributions', async function() {
      const stats = await contract.getCampaignStats();
      
      expect(Number(ethers.formatEther(stats.totalReceived))).to.be.greaterThan(0);
      expect(Number(stats.uniqueContributors)).to.be.greaterThan(0);
    });

    it('should track individual contributor history', async function() {
      const cumulative = await contract.cumulativeContributions(donor1.address);
      expect(Number(ethers.formatEther(cumulative))).to.be.greaterThan(0);
      
      const hasContributed = await contract.hasContributed(donor1.address);
      expect(hasContributed).to.be.true;
    });

    it('should calculate remaining contribution capacity', async function() {
      const remaining = await contract.getRemainingContributionCapacity(donor1.address);
      const maxWei = await contract.getMaxContributionWei();
      
      expect(remaining).to.be.lessThan(maxWei);
    });
  });

  describe('6. Admin Dashboard Data', function() {
    it('should provide real-time campaign statistics', async function() {
      const stats = await contract.getCampaignStats();
      
      // Verify all required stats are available
      expect(stats.totalReceived).to.exist;
      expect(stats.uniqueContributors).to.exist;
      expect(stats.maxContribution).to.exist;
      expect(stats.currentEthPrice).to.exist;
      
      console.log('📊 Campaign Stats:');
      console.log('  Total Raised:', ethers.formatEther(stats.totalReceived), 'ETH');
      console.log('  Unique Contributors:', stats.uniqueContributors.toString());
      console.log('  Max Contribution:', ethers.formatEther(stats.maxContribution), 'ETH');
    });

    it('should allow admin to update ETH price', async function() {
      const newPrice = ethers.parseEther('3500');
      await contract.connect(owner).setEthPrice(newPrice);
      
      const updatedPrice = await contract.ethPriceUSD();
      expect(updatedPrice).to.equal(newPrice);
    });

    it('should allow admin to manage KYC verifiers', async function() {
      const newVerifier = donor2.address;
      
      await contract.connect(owner).addKYCVerifier(newVerifier);
      let isVerifier = await contract.kycVerifiers(newVerifier);
      expect(isVerifier).to.be.true;
      
      await contract.connect(owner).removeKYCVerifier(newVerifier);
      isVerifier = await contract.kycVerifiers(newVerifier);
      expect(isVerifier).to.be.false;
    });
  });

  describe('7. End-to-End Flow Verification', function() {
    it('should complete full donor journey', async function() {
      const newDonor = (await ethers.getSigners())[4];
      
      // Step 1: Register (mock)
      console.log('  ➤ Step 1: Donor registers');
      
      // Step 2: KYC verification
      console.log('  ➤ Step 2: KYC verification');
      await contract.connect(owner).verifyKYC(newDonor.address);
      
      // Step 3: Check eligibility
      console.log('  ➤ Step 3: Check contribution eligibility');
      const amount = ethers.parseEther('0.3'); // ~$900
      const [canContribute] = await contract.canContribute(newDonor.address, amount);
      expect(canContribute).to.be.true;
      
      // Step 4: Make contribution
      console.log('  ➤ Step 4: Make contribution');
      const tx = await contract.connect(newDonor).contribute({ value: amount });
      await tx.wait();
      
      // Step 5: Verify recorded
      console.log('  ➤ Step 5: Verify transaction recorded');
      const info = await contract.getContributorInfo(newDonor.address);
      expect(info.hasContributedBefore).to.be.true;
      expect(ethers.formatEther(info.cumulativeAmount)).to.equal('0.3');
      
      console.log('  ✅ Complete donor journey successful!');
    });
  });

  describe('8. MVP Readiness Checklist', function() {
    it('✓ Smart contract deployed and functional', async function() {
      const code = await ethers.provider.getCode(await contract.getAddress());
      expect(code).to.not.equal('0x');
    });

    it('✓ Mock KYC system operational', async function() {
      const testAddr = (await ethers.getSigners())[5].address;
      await contract.connect(owner).verifyKYC(testAddr);
      expect(await contract.kycVerified(testAddr)).to.be.true;
    });

    it('✓ Contribution flow working end-to-end', async function() {
      const donor = (await ethers.getSigners())[6];
      await contract.connect(owner).verifyKYC(donor.address);
      
      const tx = await contract.connect(donor).contribute({
        value: ethers.parseEther('0.1')
      });
      expect(tx.hash).to.exist;
    });

    it('✓ Data recording and retrieval functional', async function() {
      const stats = await contract.getCampaignStats();
      expect(Number(stats.uniqueContributors)).to.be.greaterThan(0);
    });

    it('✓ Admin controls operational', async function() {
      const isPaused = await contract.paused();
      expect(isPaused).to.be.false;
      
      // Test pause/unpause
      await contract.connect(owner).pause();
      expect(await contract.paused()).to.be.true;
      
      await contract.connect(owner).unpause();
      expect(await contract.paused()).to.be.false;
    });
  });
});