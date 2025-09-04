const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DetailedViolationAnalysis {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'test-data.db'));
    this.MAX_CONTRIBUTION_USD = 3300; // $3,300 USD limit
  }

  async analyzeAllViolations() {
    // Get all contributions with KYC status, sorted by wallet and date
    const contributions = await new Promise((resolve, reject) => {
      this.db.all(
        `
                SELECT 
                    d.unique_id,
                    d.first_name,
                    d.last_name,
                    d.wallet,
                    d.contribution_amount,
                    d.contribution_date,
                    COALESCE(k.kyc_passed, 0) as kyc_passed
                FROM campaign_donors d
                LEFT JOIN kyc k ON d.unique_id = k.unique_id
                ORDER BY d.wallet, d.contribution_date
            `,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const violations = {
      kyc_not_passed: 0,
      exceeds_per_transaction: 0,
      exceeds_cumulative: 0,
      valid: 0,
    };

    const walletTotals = {};
    let cumulativeViolations = [];

    for (const contrib of contributions) {
      const amount = parseFloat(contrib.contribution_amount);
      const wallet = contrib.wallet;
      const kycPassed = contrib.kyc_passed === 1;

      // Initialize wallet tracking
      if (!walletTotals[wallet]) {
        walletTotals[wallet] = 0;
      }

      let violationType = null;

      // Check KYC first
      if (!kycPassed) {
        violations.kyc_not_passed++;
        violationType = 'KYC_FAILED';
      }
      // Check per-transaction limit
      else if (amount > this.MAX_CONTRIBUTION_USD) {
        violations.exceeds_per_transaction++;
        violationType = 'EXCEEDS_PER_TRANSACTION';
      }
      // Check cumulative limit
      else if (walletTotals[wallet] + amount > this.MAX_CONTRIBUTION_USD) {
        violations.exceeds_cumulative++;
        violationType = 'EXCEEDS_CUMULATIVE';
        cumulativeViolations.push({
          ...contrib,
          amount,
          previousTotal: walletTotals[wallet],
          wouldBeTotal: walletTotals[wallet] + amount,
        });
      }
      // Valid contribution
      else {
        violations.valid++;
        violationType = 'VALID';
      }

      // Update wallet total only for valid contributions
      if (violationType === 'VALID') {
        walletTotals[wallet] += amount;
      }

      // Log significant violations
      if (violationType === 'EXCEEDS_PER_TRANSACTION') {
      } else if (violationType === 'EXCEEDS_CUMULATIVE') {
      }
    }

    // Generate comprehensive report
    this.generateDetailedReport(violations, cumulativeViolations, contributions.length);

    // Additional wallet-level analysis
    await this.analyzeWalletPatterns();
  }

  generateDetailedReport(violations, cumulativeViolations, totalContributions) {
    const totalInvalid =
      violations.kyc_not_passed +
      violations.exceeds_per_transaction +
      violations.exceeds_cumulative;

    if (cumulativeViolations.length > 0) {
      cumulativeViolations.forEach((violation) => {});
    }
  }

  async analyzeWalletPatterns() {
    // Find wallets that would exceed limits if all contributions were processed
    const walletTotals = await new Promise((resolve, reject) => {
      this.db.all(
        `
                SELECT 
                    wallet,
                    COUNT(*) as contribution_count,
                    SUM(contribution_amount) as total_attempted,
                    SUM(CASE WHEN k.kyc_passed = 1 THEN contribution_amount ELSE 0 END) as kyc_valid_total
                FROM campaign_donors d
                LEFT JOIN kyc k ON d.unique_id = k.unique_id
                GROUP BY wallet
                ORDER BY total_attempted DESC
            `,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    let walletsOverLimit = 0;
    let walletsWithKYCValid = 0;

    walletTotals.slice(0, 10).forEach((wallet, index) => {
      const overLimit = wallet.total_attempted > this.MAX_CONTRIBUTION_USD;
      const kycValidOver = wallet.kyc_valid_total > this.MAX_CONTRIBUTION_USD;

      if (overLimit) walletsOverLimit++;
      if (kycValidOver) walletsWithKYCValid++;
    });

    console.log(`\n📊 Wallet Summary:`);
  }

  async cleanup() {
    this.db.close();
  }
}

// Run analysis
if (require.main === module) {
  const analyzer = new DetailedViolationAnalysis();
  analyzer
    .analyzeAllViolations()
    .then(() => {
      return analyzer.cleanup();
    })
    .catch((error) => {
      console.error('💥 Analysis failed:', error);
      analyzer.cleanup();
    });
}

module.exports = DetailedViolationAnalysis;
