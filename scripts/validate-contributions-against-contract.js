const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class ContributionValidator {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'test-data.db'));
        
        // Smart contract rules from CampaignContributions.sol
        this.MAX_CONTRIBUTION_USD = 3300; // $3,300 USD
        this.ETH_PRICE_USD = 3000; // $3,000 per ETH (contract default)
        this.maxContributionWei = (this.MAX_CONTRIBUTION_USD * 1e18 * 1e18) / (this.ETH_PRICE_USD * 1e18);
        this.maxContributionETH = this.MAX_CONTRIBUTION_USD / this.ETH_PRICE_USD; // 1.1 ETH
        
    }

    async validateAllContributions() {
        
        // Get all donors with their contributions and KYC status
        const contributions = await this.getAllContributionsWithKYC();
        
        
        let validCount = 0;
        let invalidCount = 0;
        const rejectionReasons = {};
        const cumulativeContributions = {}; // Track cumulative per wallet
        
        console.log('🧪 Validation Results:');
        
        for (const contrib of contributions) {
            const validation = this.validateSingleContribution(contrib, cumulativeContributions);
            
            if (validation.valid) {
                validCount++;
                
                // Update cumulative tracking
                if (!cumulativeContributions[contrib.wallet]) {
                    cumulativeContributions[contrib.wallet] = 0;
                }
                cumulativeContributions[contrib.wallet] += parseFloat(contrib.contribution_amount);
            } else {
                invalidCount++;
                
                // Track rejection reasons
                if (!rejectionReasons[validation.reason]) {
                    rejectionReasons[validation.reason] = 0;
                }
                rejectionReasons[validation.reason]++;
            }
        }
        
        this.generateValidationReport(validCount, invalidCount, rejectionReasons, contributions.length);
    }

    async getAllContributionsWithKYC() {
        return new Promise((resolve, reject) => {
            const query = `
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
            `;
            
            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    validateSingleContribution(contribution, cumulativeTracker) {
        const amount = parseFloat(contribution.contribution_amount);
        const wallet = contribution.wallet;
        const kycPassed = contribution.kyc_passed === 1 || contribution.kyc_passed === true;
        
        // Rule 1: KYC verification required
        if (!kycPassed) {
            return {
                valid: false,
                reason: 'KYC verification required but not completed'
            };
        }
        
        // Rule 2: Amount must be greater than 0
        if (amount <= 0) {
            return {
                valid: false,
                reason: 'Contribution amount must be greater than zero'
            };
        }
        
        // Rule 3: Per-transaction limit ($3,300)
        if (amount > this.MAX_CONTRIBUTION_USD) {
            return {
                valid: false,
                reason: `Exceeds per-transaction limit of $${this.MAX_CONTRIBUTION_USD}`
            };
        }
        
        // Rule 4: Cumulative limit per wallet ($3,300)
        const currentCumulative = cumulativeTracker[wallet] || 0;
        const newCumulative = currentCumulative + amount;
        
        if (newCumulative > this.MAX_CONTRIBUTION_USD) {
            return {
                valid: false,
                reason: `Would exceed cumulative limit of $${this.MAX_CONTRIBUTION_USD} (current: $${currentCumulative.toFixed(2)}, attempting: $${amount})`
            };
        }
        
        // All validations passed
        return { valid: true };
    }

    generateValidationReport(valid, invalid, reasons, total) {
        console.log('\n📊 VALIDATION SUMMARY:');
        console.log(`   📈 Success Rate: ${Math.round(valid/total*100)}%`);
        
        if (Object.keys(reasons).length > 0) {
            for (const [reason, count] of Object.entries(reasons)) {
            }
        }
        
        // Additional analysis
        this.performAdditionalAnalysis();
    }

    async performAdditionalAnalysis() {
        
        // Create new database connection for additional analysis
        const analysisDb = new sqlite3.Database(path.join(__dirname, 'test-data.db'));
        
        // KYC status breakdown
        const kycStats = await new Promise((resolve, reject) => {
            analysisDb.get(`
                SELECT 
                    COUNT(*) as total_kyc,
                    SUM(CASE WHEN kyc_passed = 1 THEN 1 ELSE 0 END) as kyc_passed,
                    SUM(CASE WHEN kyc_passed = 0 THEN 1 ELSE 0 END) as kyc_failed
                FROM kyc
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        
        // Contribution amount analysis
        const amountStats = await new Promise((resolve, reject) => {
            analysisDb.all(`
                SELECT 
                    contribution_amount,
                    COUNT(*) as count
                FROM campaign_donors 
                WHERE contribution_amount > 3300
                GROUP BY contribution_amount
                ORDER BY contribution_amount DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (amountStats.length > 0) {
            amountStats.forEach(stat => {
            });
        }
        
        // Wallet-level cumulative analysis
        const walletStats = await new Promise((resolve, reject) => {
            analysisDb.all(`
                SELECT 
                    wallet,
                    SUM(contribution_amount) as total_contributed,
                    COUNT(*) as contribution_count
                FROM campaign_donors
                GROUP BY wallet
                HAVING total_contributed > 3300
                ORDER BY total_contributed DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (walletStats.length > 0) {
            walletStats.slice(0, 10).forEach(stat => {
            });
        }
        
        analysisDb.close();
    }

    async cleanup() {
        this.db.close();
    }
}

// Run validation
if (require.main === module) {
    const validator = new ContributionValidator();
    validator.validateAllContributions()
        .then(() => {
            return validator.cleanup();
        })
        .catch((error) => {
            console.error('💥 Validation failed:', error);
            validator.cleanup();
        });
}

module.exports = ContributionValidator;