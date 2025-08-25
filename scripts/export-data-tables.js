const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DataExporter {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'test-data.db'));
        this.exportDir = path.join(__dirname, 'exported-data');
    }

    async exportAllTables() {
        console.log('📊 DATA TABLE EXPORT TOOL');
        console.log('=' .repeat(60));
        
        // Create export directory
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir);
        }

        // Export each table
        await this.exportTable('campaign_prospects');
        await this.exportTable('campaign_donors');
        await this.exportTable('kyc');
        
        // Create merged view with all relationships
        await this.exportMergedView();
        
        // Create validation summary
        await this.exportValidationSummary();
        
        console.log('\n✅ All data exported successfully!');
        console.log(`📁 Files saved in: ${this.exportDir}`);
        console.log('\n📋 Available files:');
        console.log('   - campaign_prospects.csv (150 records)');
        console.log('   - campaign_donors.csv (215 records)');
        console.log('   - kyc.csv (150 records)');
        console.log('   - merged_donor_kyc_view.csv (all donors with KYC status)');
        console.log('   - validation_summary.csv (contract compliance analysis)');
        console.log('   - data_summary.json (complete statistics)');
    }

    async exportTable(tableName) {
        return new Promise((resolve, reject) => {
            console.log(`\n📤 Exporting ${tableName}...`);
            
            this.db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                if (err) {
                    console.error(`❌ Error exporting ${tableName}:`, err);
                    reject(err);
                    return;
                }

                if (rows.length === 0) {
                    console.log(`   ⚠️ No data in ${tableName}`);
                    resolve();
                    return;
                }

                // Convert to CSV
                const headers = Object.keys(rows[0]);
                let csv = headers.join(',') + '\n';
                
                rows.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header];
                        // Handle null values and escape quotes
                        if (value === null || value === undefined) return '';
                        const stringValue = String(value);
                        // Escape quotes and wrap in quotes if contains comma or quotes
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    });
                    csv += values.join(',') + '\n';
                });

                // Write to file
                const filePath = path.join(this.exportDir, `${tableName}.csv`);
                fs.writeFileSync(filePath, csv);
                console.log(`   ✅ Exported ${rows.length} records to ${tableName}.csv`);
                resolve();
            });
        });
    }

    async exportMergedView() {
        return new Promise((resolve, reject) => {
            console.log('\n📤 Creating merged donor-KYC view...');
            
            const query = `
                SELECT 
                    d.unique_id,
                    d.first_name,
                    d.last_name,
                    d.wallet,
                    d.contribution_amount,
                    d.contribution_date,
                    d.address_line_1,
                    d.city,
                    d.state,
                    d.zip,
                    d.phone,
                    d.employer,
                    d.occupation,
                    CASE 
                        WHEN k.kyc_passed = 1 THEN 'PASSED'
                        WHEN k.kyc_passed = 0 THEN 'FAILED'
                        ELSE 'NOT_FOUND'
                    END as kyc_status,
                    CASE
                        WHEN k.kyc_passed IS NULL THEN 'NO_KYC_RECORD'
                        WHEN k.kyc_passed = 0 THEN 'KYC_FAILED'
                        WHEN d.contribution_amount > 3300 THEN 'EXCEEDS_PER_TX_LIMIT'
                        WHEN (
                            SELECT SUM(contribution_amount) 
                            FROM campaign_donors d2 
                            WHERE d2.wallet = d.wallet 
                            AND d2.contribution_date <= d.contribution_date
                        ) > 3300 THEN 'EXCEEDS_CUMULATIVE_LIMIT'
                        ELSE 'VALID'
                    END as compliance_status
                FROM campaign_donors d
                LEFT JOIN kyc k ON d.unique_id = k.unique_id
                ORDER BY d.wallet, d.contribution_date
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    console.error('❌ Error creating merged view:', err);
                    reject(err);
                    return;
                }

                // Convert to CSV
                const headers = Object.keys(rows[0]);
                let csv = headers.join(',') + '\n';
                
                rows.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header];
                        if (value === null || value === undefined) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    });
                    csv += values.join(',') + '\n';
                });

                const filePath = path.join(this.exportDir, 'merged_donor_kyc_view.csv');
                fs.writeFileSync(filePath, csv);
                console.log(`   ✅ Created merged view with ${rows.length} records`);
                resolve();
            });
        });
    }

    async exportValidationSummary() {
        return new Promise((resolve, reject) => {
            console.log('\n📤 Creating validation summary...');
            
            const query = `
                SELECT 
                    d.unique_id,
                    d.first_name || ' ' || d.last_name as full_name,
                    d.contribution_amount,
                    CASE 
                        WHEN k.kyc_passed = 1 THEN 'YES' 
                        WHEN k.kyc_passed = 0 THEN 'NO'
                        ELSE 'NO_RECORD' 
                    END as kyc_passed,
                    CASE 
                        WHEN d.contribution_amount > 3300 THEN 'YES' 
                        ELSE 'NO' 
                    END as exceeds_single_limit,
                    (
                        SELECT SUM(contribution_amount) 
                        FROM campaign_donors d2 
                        WHERE d2.wallet = d.wallet 
                        AND d2.contribution_date <= d.contribution_date
                    ) as cumulative_total,
                    CASE 
                        WHEN (
                            SELECT SUM(contribution_amount) 
                            FROM campaign_donors d2 
                            WHERE d2.wallet = d.wallet 
                            AND d2.contribution_date <= d.contribution_date
                        ) > 3300 THEN 'YES' 
                        ELSE 'NO' 
                    END as exceeds_cumulative_limit,
                    CASE
                        WHEN k.kyc_passed IS NULL OR k.kyc_passed = 0 THEN 'REJECTED: KYC Failed'
                        WHEN d.contribution_amount > 3300 THEN 'REJECTED: Over $3,300 single limit'
                        WHEN (
                            SELECT SUM(contribution_amount) 
                            FROM campaign_donors d2 
                            WHERE d2.wallet = d.wallet 
                            AND d2.contribution_date <= d.contribution_date
                        ) > 3300 THEN 'REJECTED: Would exceed $3,300 cumulative'
                        ELSE 'ACCEPTED'
                    END as contract_decision,
                    d.wallet
                FROM campaign_donors d
                LEFT JOIN kyc k ON d.unique_id = k.unique_id
                ORDER BY contract_decision, d.contribution_amount DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    console.error('❌ Error creating validation summary:', err);
                    reject(err);
                    return;
                }

                // Convert to CSV
                const headers = Object.keys(rows[0]);
                let csv = headers.join(',') + '\n';
                
                rows.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header];
                        if (value === null || value === undefined) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    });
                    csv += values.join(',') + '\n';
                });

                const filePath = path.join(this.exportDir, 'validation_summary.csv');
                fs.writeFileSync(filePath, csv);
                console.log(`   ✅ Created validation summary with ${rows.length} records`);

                // Also create a JSON summary
                this.createJSONSummary(rows);
                resolve();
            });
        });
    }

    createJSONSummary(validationData) {
        const summary = {
            generated_at: new Date().toISOString(),
            total_contributions: validationData.length,
            statistics: {
                accepted: validationData.filter(r => r.contract_decision === 'ACCEPTED').length,
                rejected_kyc: validationData.filter(r => r.contract_decision.includes('KYC')).length,
                rejected_single_limit: validationData.filter(r => r.contract_decision.includes('single limit')).length,
                rejected_cumulative: validationData.filter(r => r.contract_decision.includes('cumulative')).length
            },
            acceptance_rate: `${Math.round(validationData.filter(r => r.contract_decision === 'ACCEPTED').length / validationData.length * 100)}%`,
            rejection_rate: `${Math.round(validationData.filter(r => r.contract_decision !== 'ACCEPTED').length / validationData.length * 100)}%`,
            unique_wallets: [...new Set(validationData.map(r => r.wallet))].length,
            total_amount_attempted: validationData.reduce((sum, r) => sum + parseFloat(r.contribution_amount), 0).toFixed(2),
            total_amount_valid: validationData
                .filter(r => r.contract_decision === 'ACCEPTED')
                .reduce((sum, r) => sum + parseFloat(r.contribution_amount), 0)
                .toFixed(2)
        };

        const filePath = path.join(this.exportDir, 'data_summary.json');
        fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
        console.log('   ✅ Created JSON summary');
    }

    async displaySampleData() {
        console.log('\n📋 SAMPLE DATA PREVIEW:');
        console.log('=' .repeat(60));
        
        // Show sample prospects
        console.log('\n🔍 Sample Prospects (first 5):');
        await new Promise((resolve) => {
            this.db.all('SELECT unique_id, first_name, last_name, wallet FROM campaign_prospects LIMIT 5', (err, rows) => {
                if (!err) {
                    rows.forEach(row => {
                        console.log(`   ${row.unique_id}: ${row.first_name} ${row.last_name} - ${row.wallet.substring(0, 10)}...`);
                    });
                }
                resolve();
            });
        });

        // Show sample donors
        console.log('\n💰 Sample Donors (first 5):');
        await new Promise((resolve) => {
            this.db.all('SELECT unique_id, first_name, last_name, contribution_amount FROM campaign_donors LIMIT 5', (err, rows) => {
                if (!err) {
                    rows.forEach(row => {
                        console.log(`   ${row.unique_id}: ${row.first_name} ${row.last_name} - $${row.contribution_amount}`);
                    });
                }
                resolve();
            });
        });

        // Show KYC summary
        console.log('\n🔐 KYC Summary:');
        await new Promise((resolve) => {
            this.db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN kyc_passed = 1 THEN 1 ELSE 0 END) as passed,
                    SUM(CASE WHEN kyc_passed = 0 THEN 1 ELSE 0 END) as failed
                FROM kyc
            `, (err, row) => {
                if (!err) {
                    console.log(`   Total: ${row.total} | Passed: ${row.passed} | Failed: ${row.failed}`);
                }
                resolve();
            });
        });
    }

    async cleanup() {
        this.db.close();
    }
}

// Run exporter
if (require.main === module) {
    const exporter = new DataExporter();
    (async () => {
        try {
            await exporter.displaySampleData();
            await exporter.exportAllTables();
            await exporter.cleanup();
        } catch (error) {
            console.error('💥 Export failed:', error);
            exporter.cleanup();
        }
    })();
}

module.exports = DataExporter;