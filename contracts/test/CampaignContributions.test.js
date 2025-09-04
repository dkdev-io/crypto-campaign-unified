const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CampaignContributions', function () {
  let campaignContract;
  let owner, treasury, contributor1, contributor2, kycVerifier;
  let initialEthPrice = ethers.parseUnits('3000', 18); // $3000 per ETH

  beforeEach(async function () {
    // Get signers
    [owner, treasury, contributor1, contributor2, kycVerifier] = await ethers.getSigners();

    // Deploy contract
    const CampaignContributions = await ethers.getContractFactory('CampaignContributions');
    campaignContract = await CampaignContributions.deploy(treasury.address, owner.address);
    await campaignContract.waitForDeployment();

    // Add KYC verifier
    await campaignContract.addKYCVerifier(kycVerifier.address);
  });

  describe('Deployment', function () {
    it('Should set the correct owner and treasury', async function () {
      expect(await campaignContract.owner()).to.equal(owner.address);
      expect(await campaignContract.campaignTreasury()).to.equal(treasury.address);
    });

    it('Should set initial ETH price and max contribution', async function () {
      const ethPrice = await campaignContract.ethPriceUSD();
      expect(ethPrice).to.equal(initialEthPrice);

      const maxContribution = await campaignContract.getMaxContributionWei();
      // $3,300 / $3,000 = 1.1 ETH
      expect(maxContribution).to.equal(ethers.parseEther('1.1'));
    });

    it('Should set owner as initial KYC verifier', async function () {
      expect(await campaignContract.kycVerifiers(owner.address)).to.be.true;
    });
  });

  describe('KYC Management', function () {
    it('Should allow KYC verifier to verify a contributor', async function () {
      await campaignContract.connect(kycVerifier).verifyKYC(contributor1.address);
      expect(await campaignContract.kycVerified(contributor1.address)).to.be.true;
    });

    it('Should emit KYCStatusUpdated event when verifying', async function () {
      await expect(campaignContract.connect(kycVerifier).verifyKYC(contributor1.address))
        .to.emit(campaignContract, 'KYCStatusUpdated')
        .withArgs(
          contributor1.address,
          true,
          kycVerifier.address,
          anyValue // timestamp
        );
    });

    it('Should allow batch KYC verification', async function () {
      const contributors = [contributor1.address, contributor2.address];

      await campaignContract.connect(kycVerifier).batchVerifyKYC(contributors);

      expect(await campaignContract.kycVerified(contributor1.address)).to.be.true;
      expect(await campaignContract.kycVerified(contributor2.address)).to.be.true;
    });

    it('Should prevent non-verifier from doing KYC', async function () {
      await expect(
        campaignContract.connect(contributor1).verifyKYC(contributor2.address)
      ).to.be.revertedWith('CampaignContributions: caller is not a KYC verifier');
    });
  });

  describe('Contributions', function () {
    beforeEach(async function () {
      // Verify KYC for contributor1
      await campaignContract.connect(kycVerifier).verifyKYC(contributor1.address);
    });

    it('Should accept valid contributions', async function () {
      const contributionAmount = ethers.parseEther('0.5'); // $1,500 worth

      await expect(campaignContract.connect(contributor1).contribute({ value: contributionAmount }))
        .to.emit(campaignContract, 'ContributionAccepted')
        .withArgs(
          contributor1.address,
          contributionAmount,
          contributionAmount, // cumulativeAmount
          anyValue, // timestamp
          anyValue // transactionHash
        );
    });

    it('Should transfer funds to treasury', async function () {
      const contributionAmount = ethers.parseEther('0.5');
      const initialTreasuryBalance = await ethers.provider.getBalance(treasury.address);

      await campaignContract.connect(contributor1).contribute({ value: contributionAmount });

      const finalTreasuryBalance = await ethers.provider.getBalance(treasury.address);
      expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(contributionAmount);
    });

    it('Should update campaign statistics', async function () {
      const contributionAmount = ethers.parseEther('0.5');

      await campaignContract.connect(contributor1).contribute({ value: contributionAmount });

      const [totalReceived, uniqueContributors] = await campaignContract.getCampaignStats();
      expect(totalReceived).to.equal(contributionAmount);
      expect(uniqueContributors).to.equal(1);
    });

    it('Should reject contribution without KYC', async function () {
      const contributionAmount = ethers.parseEther('0.5');

      await expect(
        campaignContract.connect(contributor2).contribute({ value: contributionAmount })
      ).to.be.revertedWith('CampaignContributions: contributor must complete KYC verification');
    });

    it('Should reject contribution exceeding per-transaction limit', async function () {
      const contributionAmount = ethers.parseEther('2.0'); // > $3,300 limit

      await expect(
        campaignContract.connect(contributor1).contribute({ value: contributionAmount })
      ).to.be.revertedWith('CampaignContributions: contribution exceeds per-transaction limit');
    });

    it('Should reject contribution exceeding cumulative limit', async function () {
      const contributionAmount1 = ethers.parseEther('0.8'); // $2,400
      const contributionAmount2 = ethers.parseEther('0.5'); // $1,500, total $3,900 > $3,300

      await campaignContract.connect(contributor1).contribute({ value: contributionAmount1 });

      await expect(
        campaignContract.connect(contributor1).contribute({ value: contributionAmount2 })
      ).to.be.revertedWith('CampaignContributions: contribution would exceed cumulative limit');
    });

    it('Should allow multiple contributions within limits', async function () {
      const contributionAmount1 = ethers.parseEther('0.5'); // $1,500
      const contributionAmount2 = ethers.parseEther('0.6'); // $1,800, total $3,300

      await campaignContract.connect(contributor1).contribute({ value: contributionAmount1 });
      await campaignContract.connect(contributor1).contribute({ value: contributionAmount2 });

      const [, , , contributorInfo] = await campaignContract.getContributorInfo(
        contributor1.address
      );
      expect(contributorInfo).to.be.true; // hasContributed
    });
  });

  describe('View Functions', function () {
    beforeEach(async function () {
      await campaignContract.connect(kycVerifier).verifyKYC(contributor1.address);
    });

    it('Should return correct contributor info', async function () {
      const contributionAmount = ethers.parseEther('0.5');
      await campaignContract.connect(contributor1).contribute({ value: contributionAmount });

      const [cumulativeAmount, remainingCapacity, isKYCVerified, hasContributed] =
        await campaignContract.getContributorInfo(contributor1.address);

      expect(cumulativeAmount).to.equal(contributionAmount);
      expect(remainingCapacity).to.equal(ethers.parseEther('0.6')); // 1.1 - 0.5
      expect(isKYCVerified).to.be.true;
      expect(hasContributed).to.be.true;
    });

    it('Should correctly check contribution eligibility', async function () {
      const contributionAmount = ethers.parseEther('0.5');

      const [canContribute, reason] = await campaignContract.canContribute(
        contributor1.address,
        contributionAmount
      );

      expect(canContribute).to.be.true;
      expect(reason).to.equal('Contribution is allowed');
    });

    it('Should return correct campaign stats', async function () {
      const contributionAmount = ethers.parseEther('0.5');
      await campaignContract.connect(contributor1).contribute({ value: contributionAmount });

      const [totalReceived, uniqueContributors, maxContribution, currentEthPrice] =
        await campaignContract.getCampaignStats();

      expect(totalReceived).to.equal(contributionAmount);
      expect(uniqueContributors).to.equal(1);
      expect(maxContribution).to.equal(ethers.parseEther('1.1'));
      expect(currentEthPrice).to.equal(initialEthPrice);
    });
  });

  describe('Admin Functions', function () {
    it('Should allow owner to update ETH price', async function () {
      const newPrice = ethers.parseUnits('4000', 18); // $4000 per ETH

      await expect(campaignContract.setEthPrice(newPrice))
        .to.emit(campaignContract, 'EthPriceUpdated')
        .withArgs(
          initialEthPrice, // oldPrice
          newPrice, // newPrice
          anyValue, // newMaxContribution
          owner.address // updatedBy
        );

      // New max contribution should be $3,300 / $4,000 = 0.825 ETH
      const newMaxContribution = await campaignContract.getMaxContributionWei();
      expect(newMaxContribution).to.equal(ethers.parseEther('0.825'));
    });

    it('Should allow owner to update treasury address', async function () {
      const [, , , , , newTreasury] = await ethers.getSigners(); // Get a different signer

      await expect(campaignContract.setCampaignTreasury(newTreasury.address))
        .to.emit(campaignContract, 'CampaignTreasuryUpdated')
        .withArgs(
          treasury.address, // oldTreasury
          newTreasury.address, // newTreasury
          owner.address // updatedBy
        );

      expect(await campaignContract.campaignTreasury()).to.equal(newTreasury.address);
    });

    it('Should allow owner to pause and unpause', async function () {
      await campaignContract.pause();
      expect(await campaignContract.paused()).to.be.true;

      await campaignContract.unpause();
      expect(await campaignContract.paused()).to.be.false;
    });

    it('Should prevent contributions when paused', async function () {
      await campaignContract.connect(kycVerifier).verifyKYC(contributor1.address);
      await campaignContract.pause();

      const contributionAmount = ethers.parseEther('0.5');
      await expect(
        campaignContract.connect(contributor1).contribute({ value: contributionAmount })
      ).to.be.revertedWithCustomError(campaignContract, 'EnforcedPause');
    });
  });

  describe('Edge Cases', function () {
    it('Should handle zero contributions', async function () {
      await campaignContract.connect(kycVerifier).verifyKYC(contributor1.address);

      await expect(
        campaignContract.connect(contributor1).contribute({ value: 0 })
      ).to.be.revertedWith('CampaignContributions: contribution amount must be greater than zero');
    });

    it('Should handle receive() function for direct transfers', async function () {
      await campaignContract.connect(kycVerifier).verifyKYC(contributor1.address);
      const contributionAmount = ethers.parseEther('0.5');

      // Direct transfer should work for KYC-verified users
      await expect(
        contributor1.sendTransaction({
          to: await campaignContract.getAddress(),
          value: contributionAmount,
        })
      ).to.emit(campaignContract, 'ContributionAccepted');
    });

    it('Should reject direct transfers for non-KYC users', async function () {
      const contributionAmount = ethers.parseEther('0.5');

      await expect(
        contributor2.sendTransaction({
          to: await campaignContract.getAddress(),
          value: contributionAmount,
        })
      ).to.be.revertedWith(
        'CampaignContributions: direct transfer rejected - use contribute() function'
      );
    });
  });
});

// Helper for testing events with variable values like timestamps and hashes
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
