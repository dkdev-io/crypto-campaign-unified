#!/usr/bin/env node

// FEC Credit Card Processing Fees Query Script
// Queries FEC API for credit card processing fees in 2023 and 2024

const API_KEY = 'F7QA9sKDcXZOjuqz2nk7DzZXLenyzf3GEYaZqpFD';
const BASE_URL = 'https://api.open.fec.gov/v1';

// Common terms used for credit card processing fees in FEC filings
const PROCESSING_FEE_TERMS = [
  'credit card',
  'processing fee',
  'merchant fee',
  'payment processing',
  'card processing',
  'actblue',  // ActBlue charges processing fees
  'winred',   // WinRed charges processing fees
  'stripe',   // Popular payment processor
  'paypal',   // Popular payment processor
  'square'    // Popular payment processor
];

async function queryFECProcessingFees(year) {
  const results = {};
  let totalAmount = 0;
  let totalTransactions = 0;
  
  console.log(`\n=== Querying ${year} Credit Card Processing Fees ===`);
  
  for (const term of PROCESSING_FEE_TERMS) {
    try {
      console.log(`Searching for: "${term}"...`);
      
      // Query Schedule B (disbursements) for the term
      const url = `${BASE_URL}/schedules/schedule_b/?disbursement_description=${encodeURIComponent(term)}&two_year_transaction_period=${year}&per_page=100`;
      
      const response = await fetch(url, {
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate total amount for this term
      let termAmount = 0;
      if (data.results && data.results.length > 0) {
        // Get all pages to calculate total amount
        const totalPages = Math.min(data.pagination.pages, 50); // Limit to avoid API rate limits
        console.log(`  Found ${data.pagination.count} transactions across ${data.pagination.pages} pages (processing up to ${totalPages} pages)`);
        
        for (let page = 1; page <= totalPages; page++) {
          const pageUrl = `${url}&page=${page}`;
          const pageResponse = await fetch(pageUrl, {
            headers: {
              'X-Api-Key': API_KEY,
              'Content-Type': 'application/json'
            }
          });
          
          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            for (const transaction of pageData.results) {
              if (transaction.disbursement_amount) {
                termAmount += parseFloat(transaction.disbursement_amount);
              }
            }
          }
          
          // Add small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      results[term] = {
        count: data.pagination.count,
        amount: termAmount,
        pages: data.pagination.pages
      };
      
      totalAmount += termAmount;
      totalTransactions += data.pagination.count;
      
      console.log(`  ${term}: $${termAmount.toLocaleString()} (${data.pagination.count} transactions)`);
      
    } catch (error) {
      console.error(`Error querying "${term}":`, error.message);
      results[term] = { error: error.message };
    }
  }
  
  return {
    year: year,
    totalAmount: totalAmount,
    totalTransactions: totalTransactions,
    breakdown: results
  };
}

async function main() {
  console.log('FEC Credit Card Processing Fees Analysis');
  console.log('========================================');
  
  try {
    // Query both years
    const results2023 = await queryFECProcessingFees(2024); // 2024 cycle includes 2023 data
    const results2024 = await queryFECProcessingFees(2026); // 2026 cycle includes 2024 data
    
    // Display results
    console.log('\n\n=== SUMMARY ===');
    console.log(`2023-2024 Cycle: $${results2023.totalAmount.toLocaleString()} (${results2023.totalTransactions.toLocaleString()} transactions)`);
    console.log(`2024-2025 Cycle: $${results2024.totalAmount.toLocaleString()} (${results2024.totalTransactions.toLocaleString()} transactions)`);
    console.log(`TOTAL: $${(results2023.totalAmount + results2024.totalAmount).toLocaleString()}`);
    
    // Detailed breakdown
    console.log('\n=== DETAILED BREAKDOWN ===');
    console.log('\n2023-2024 Cycle:');
    for (const [term, data] of Object.entries(results2023.breakdown)) {
      if (data.amount > 0) {
        console.log(`  ${term}: $${data.amount.toLocaleString()} (${data.count.toLocaleString()} transactions)`);
      }
    }
    
    console.log('\n2024-2025 Cycle:');
    for (const [term, data] of Object.entries(results2024.breakdown)) {
      if (data.amount > 0) {
        console.log(`  ${term}: $${data.amount.toLocaleString()} (${data.count.toLocaleString()} transactions)`);
      }
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

main().catch(console.error);