const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DetailedViolationAnalysis {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'test-data.db'));
        this.MAX_CONTRIBUTION_USD = 3300; // $3,300 USD limit
    }

    async analyzeAllViolations() {
        console.log('🔍 DETAILED CONTRACT VIOLATION ANALYSIS');
        console.log('=' .repeat(60));
        
        // Get all contributions with KYC status, sorted by wallet and date
        const contributions = await new Promise((resolve, reject) => {
            this.db.all(`
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
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const violations = {
            kyc_not_passed: 0,
            exceeds_per_transaction: 0,
            exceeds_cumulative: 0,
            valid: 0
        };

        const walletTotals = {};
        let cumulativeViolations = [];

        console.log('🧪 Analyzing each contribution:');
        console.log('');

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
                    wouldBeTotal: walletTotals[wallet] + amount
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
                console.log(`❌ PER_TX_LIMIT  | ${contrib.unique_id} | $${amount} (limit: $${this.MAX_CONTRIBUTION_USD})`);
            } else if (violationType === 'EXCEEDS_CUMULATIVE') {
                console.log(`❌ CUMULATIVE    | ${contrib.unique_id} | $${amount} (wallet total would be: $${(walletTotals[wallet] + amount).toFixed(2)})`);
            }
        }

        // Generate comprehensive report
        this.generateDetailedReport(violations, cumulativeViolations, contributions.length);
        
        // Additional wallet-level analysis
        await this.analyzeWalletPatterns();
    }

    generateDetailedReport(violations, cumulativeViolations, totalContributions) {
        console.log('\n📊 COMPREHENSIVE VIOLATION BREAKDOWN:');
        console.log('=' .repeat(60));
        console.log(`   Total Contributions Analyzed: ${totalContributions}`);
        console.log(`   ✅ Valid (compliant): ${violations.valid} (${Math.round(violations.valid/totalContributions*100)}%)`);
        console.log(`   ❌ KYC failures: ${violations.kyc_not_passed} (${Math.round(violations.kyc_not_passed/totalContributions*100)}%)`);
        console.log(`   ❌ Per-transaction limit violations: ${violations.exceeds_per_transaction} (${Math.round(violations.exceeds_per_transaction/totalContributions*100)}%)`);
        console.log(`   ❌ Cumulative limit violations: ${violations.exceeds_cumulative} (${Math.round(violations.exceeds_cumulative/totalContributions*100)}%)`);
        
        const totalInvalid = violations.kyc_not_passed + violations.exceeds_per_transaction + violations.exceeds_cumulative;
        console.log(`\n   📈 Total Valid: ${violations.valid}/${totalContributions} (${Math.round(violations.valid/totalContributions*100)}%)`);
        console.log(`   📉 Total Invalid: ${totalInvalid}/${totalContributions} (${Math.round(totalInvalid/totalContributions*100)}%)`);

        if (cumulativeViolations.length > 0) {
            console.log(`\n🎯 CUMULATIVE VIOLATIONS DETAILS:`);
            console.log('   These contributions would exceed the $3,300 wallet limit:');
            cumulativeViolations.forEach(violation => {
                console.log(`   - ${violation.unique_id}: $${violation.amount} (previous: $${violation.previousTotal.toFixed(2)} → would total: $${violation.wouldBeTotal.toFixed(2)})`);
            });
        }
    }

    async analyzeWalletPatterns() {
        console.log('\n🔍 WALLET-LEVEL ANALYSIS:');
        console.log('=' .repeat(60));

        // Find wallets that would exceed limits if all contributions were processed
        const walletTotals = await new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    wallet,
                    COUNT(*) as contribution_count,
                    SUM(contribution_amount) as total_attempted,
                    SUM(CASE WHEN k.kyc_passed = 1 THEN contribution_amount ELSE 0 END) as kyc_valid_total
                FROM campaign_donors d
                LEFT JOIN kyc k ON d.unique_id = k.unique_id
                GROUP BY wallet
                ORDER BY total_attempted DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        let walletsOverLimit = 0;
        let walletsWithKYCValid = 0;
        
        console.log('Top 10 wallets by attempted contribution:');
        walletTotals.slice(0, 10).forEach((wallet, index) => {
            const overLimit = wallet.total_attempted > this.MAX_CONTRIBUTION_USD;
            const kycValidOver = wallet.kyc_valid_total > this.MAX_CONTRIBUTION_USD;
            
            if (overLimit) walletsOverLimit++;
            if (kycValidOver) walletsWithKYCValid++;
            
            console.log(`   ${index + 1}. ${wallet.wallet.substring(0, 12)}... | $${wallet.total_attempted.toFixed(2)} (${wallet.contribution_count} contributions) ${overLimit ? '⚠️ OVER LIMIT' : '✅'} | KYC-valid: $${wallet.kyc_valid_total.toFixed(2)} ${kycValidOver ? '⚠️' : '✅'}`);
        });

        console.log(`\n📊 Wallet Summary:`);
        console.log(`   - Total wallets: ${walletTotals.length}`);
        console.log(`   - Wallets attempting >$3,300: ${walletsOverLimit}`);
        console.log(`   - Wallets with KYC-valid contributions >$3,300: ${walletsWithKYCValid}`);
    }

    async cleanup() {
        this.db.close();
    }
}

// Run analysis
if (require.main === module) {
    const analyzer = new DetailedViolationAnalysis();
    analyzer.analyzeAllViolations()
        .then(() => {
            console.log('\n✅ Detailed analysis completed');
            return analyzer.cleanup();
        })
        .catch((error) => {
            console.error('💥 Analysis failed:', error);
            analyzer.cleanup();
        });
}

module.exports = DetailedViolationAnalysis;