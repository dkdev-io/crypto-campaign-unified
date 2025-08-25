const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseDebugger {
    constructor() {
        this.dbPath = path.join(__dirname, 'test-data.db');
        this.db = new sqlite3.Database(this.dbPath);
    }

    async debugDatabase() {

        // Check table counts
        await this.checkTableCounts();
        
        // Check sample data
        await this.checkSampleData();
        
        // Check for overlaps with actual unique IDs
        await this.checkActualOverlaps();
        
        this.db.close();
    }

    async checkTableCounts() {
        console.log('📊 Table Counts:');
        
        const tables = ['campaign_prospects', 'campaign_donors', 'kyc'];
        
        for (const table of tables) {
            await new Promise((resolve) => {
                this.db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                    if (err) {
                        console.error(`❌ Error checking ${table}:`, err);
                    } else {
                    }
                    resolve();
                });
            });
        }
    }

    async checkSampleData() {
        
        // Check prospects sample
        await new Promise((resolve) => {
            this.db.all('SELECT unique_id, first_name, last_name FROM campaign_prospects LIMIT 3', (err, rows) => {
                if (err) {
                    console.error('❌ Error getting prospects sample:', err);
                } else {
                }
                resolve();
            });
        });

        // Check donors sample
        await new Promise((resolve) => {
            this.db.all('SELECT unique_id, first_name, last_name, contribution_amount FROM campaign_donors LIMIT 3', (err, rows) => {
                if (err) {
                    console.error('❌ Error getting donors sample:', err);
                } else {
                }
                resolve();
            });
        });
    }

    async checkActualOverlaps() {
        
        // Get all unique IDs from both tables
        const prospectIds = await new Promise((resolve) => {
            this.db.all('SELECT DISTINCT unique_id FROM campaign_prospects', (err, rows) => {
                if (err) {
                    console.error('❌ Error getting prospect IDs:', err);
                    resolve([]);
                } else {
                    resolve(rows.map(r => r.unique_id));
                }
            });
        });

        const donorIds = await new Promise((resolve) => {
            this.db.all('SELECT DISTINCT unique_id FROM campaign_donors', (err, rows) => {
                if (err) {
                    console.error('❌ Error getting donor IDs:', err);
                    resolve([]);
                } else {
                    resolve(rows.map(r => r.unique_id));
                }
            });
        });

        
        // Find overlaps manually
        const overlaps = prospectIds.filter(id => donorIds.includes(id));
        
        if (overlaps.length > 0) {
        }
    }
}

if (require.main === module) {
    const dbDebugger = new DatabaseDebugger();
    dbDebugger.debugDatabase().catch(console.error);
}