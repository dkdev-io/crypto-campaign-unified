const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class LocalTestDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, 'test-data.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  // Initialize database tables
  async initializeTables() {
    return new Promise((resolve, reject) => {
      const createTables = `
                -- Create prospects table
                CREATE TABLE IF NOT EXISTS campaign_prospects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    unique_id TEXT UNIQUE,
                    first_name TEXT,
                    last_name TEXT,
                    address_line_1 TEXT,
                    address_line_2 TEXT,
                    city TEXT,
                    state TEXT,
                    zip TEXT,
                    phone TEXT,
                    employer TEXT,
                    occupation TEXT,
                    wallet TEXT
                );

                -- Create donors table
                CREATE TABLE IF NOT EXISTS campaign_donors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    unique_id TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    address_line_1 TEXT,
                    address_line_2 TEXT,
                    city TEXT,
                    state TEXT,
                    zip TEXT,
                    phone TEXT,
                    employer TEXT,
                    occupation TEXT,
                    wallet TEXT,
                    contribution_amount REAL,
                    contribution_date TEXT
                );

                -- Create KYC table
                CREATE TABLE IF NOT EXISTS kyc (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    unique_id TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    kyc_passed BOOLEAN
                );
            `;

      this.db.exec(createTables, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Tables created successfully');
          resolve();
        }
      });
    });
  }

  // Helper function to read CSV file
  async readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  // Load prospects data
  async loadProspects() {
    try {
      const prospectsData = await this.readCSV(path.join(__dirname, '../data/prospects.csv'));

      const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO campaign_prospects 
                (unique_id, first_name, last_name, address_line_1, address_line_2, city, state, zip, phone, employer, occupation, wallet)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

      for (const row of prospectsData) {
        stmt.run([
          row.unique_id,
          row.first_name,
          row.last_name,
          row.address_line_1,
          row.address_line_2 || null,
          row.city,
          row.state,
          row.zip,
          row.phone_number,
          row.employer,
          row.occupation,
          row.wallet_address,
        ]);
      }
      stmt.finalize();

      console.log(`✅ Successfully loaded ${prospectsData.length} prospects`);
      return prospectsData.length;
    } catch (error) {
      console.error('❌ Error loading prospects:', error);
      throw error;
    }
  }

  // Load donors data
  async loadDonors() {
    try {
      const donorsData = await this.readCSV(path.join(__dirname, '../data/donors.csv'));

      const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO campaign_donors 
                (unique_id, first_name, last_name, address_line_1, address_line_2, city, state, zip, phone, employer, occupation, wallet, contribution_amount, contribution_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

      for (const row of donorsData) {
        stmt.run([
          row.unique_id,
          row.first_name,
          row.last_name,
          row.address_line_1,
          row.address_line_2 || null,
          row.city,
          row.state,
          row.zip,
          row.phone_number,
          row.employer,
          row.occupation,
          row.wallet_address,
          parseFloat(row.contribution_amount),
          row.contribution_date,
        ]);
      }
      stmt.finalize();

      console.log(`✅ Successfully loaded ${donorsData.length} donor contributions`);
      return donorsData.length;
    } catch (error) {
      console.error('❌ Error loading donors:', error);
      throw error;
    }
  }

  // Load KYC data
  async loadKYC() {
    try {
      const kycData = await this.readCSV(path.join(__dirname, '../data/kyc.csv'));

      const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO kyc 
                (unique_id, first_name, last_name, kyc_passed)
                VALUES (?, ?, ?, ?)
            `);

      for (const row of kycData) {
        stmt.run([
          row.unique_id,
          row.first_name,
          row.last_name,
          row.kyc_status === 'Yes' || row.kyc_status === 'yes' || row.kyc_passed === true ? 1 : 0,
        ]);
      }
      stmt.finalize();

      console.log(`✅ Successfully loaded ${kycData.length} KYC records`);
      return kycData.length;
    } catch (error) {
      console.error('❌ Error loading KYC:', error);
      throw error;
    }
  }

  // Verify data counts after loading
  async verifyDataCounts() {
    return new Promise((resolve) => {
      const queries = [
        'SELECT COUNT(*) as count FROM campaign_prospects',
        'SELECT COUNT(*) as count FROM campaign_donors',
        'SELECT COUNT(*) as count FROM kyc',
      ];

      const tables = ['campaign_prospects', 'campaign_donors', 'kyc'];
      const results = {};
      let completed = 0;

      queries.forEach((query, index) => {
        this.db.get(query, (err, row) => {
          if (err) {
            console.error(`❌ Error checking ${tables[index]}:`, err);
            results[tables[index]] = 'Error';
          } else {
            results[tables[index]] = row.count;
          }
          completed++;
          if (completed === queries.length) {
            resolve(results);
          }
        });
      });
    });
  }

  // Check for overlapping donor-prospects (should be 38)
  async checkDonorProspectOverlap() {
    return new Promise((resolve, reject) => {
      const query = `
                SELECT COUNT(DISTINCT d.unique_id) as overlap_count
                FROM campaign_donors d
                INNER JOIN campaign_prospects p ON d.unique_id = p.unique_id
            `;

      this.db.get(query, (err, row) => {
        if (err) {
          console.error('❌ Error checking overlaps:', err);
          reject(err);
        } else {
          resolve(row.overlap_count);
        }
      });
    });
  }

  // Main execution function
  async loadAllData() {
    console.log('🚀 Starting local database setup...\n');

    try {
      // Initialize tables
      await this.initializeTables();

      // Load all data
      const prospectsCount = await this.loadProspects();
      const donorsCount = await this.loadDonors();
      const kycCount = await this.loadKYC();

      // Verify counts
      await this.verifyDataCounts();

      // Check overlaps
      await this.checkDonorProspectOverlap();

      console.log('\n✅ Local database setup completed successfully!');
      console.log(
        `📈 Summary: ${prospectsCount} prospects, ${donorsCount} donations, ${kycCount} KYC records`
      );
    } catch (error) {
      console.error('\n❌ Database setup failed:', error);
      throw error;
    } finally {
      this.db.close();
    }
  }

  // Get random prospect for testing
  async getRandomProspect() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM campaign_prospects ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get random donor for testing
  async getRandomDonor() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM campaign_donors ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

// Execute the database setup
if (require.main === module) {
  const db = new LocalTestDatabase();
  db.loadAllData()
    .then(() => {})
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = LocalTestDatabase;
