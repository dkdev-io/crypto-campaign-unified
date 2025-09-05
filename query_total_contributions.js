#!/usr/bin/env node

// Query total contributions from FEC API for comparison with processing fees

const API_KEY = 'F7QA9sKDcXZOjuqz2nk7DzZXLenyzf3GEYaZqpFD';
const BASE_URL = 'https://api.open.fec.gov/v1';

async function getTotalContributions(year, label) {
  try {
    console.log(`\n=== ${label} ===`);
    
    // Query Schedule A (receipts/contributions)
    const url = `${BASE_URL}/schedules/schedule_a/?two_year_transaction_period=${year}&per_page=100`;
    
    console.log('Querying contributions data...');
    
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
    
    console.log(`Total contribution transactions: ${data.pagination.count.toLocaleString()}`);
    console.log(`Pages available: ${data.pagination.pages.toLocaleString()}`);
    
    // Calculate total from a representative sample
    let sampleTotal = 0;
    let sampleCount = 0;
    const maxPages = Math.min(100, data.pagination.pages); // Sample from first 100 pages
    
    console.log(`Sampling from first ${maxPages} pages...`);
    
    for (let page = 1; page <= maxPages; page++) {
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
          if (transaction.contribution_receipt_amount) {
            sampleTotal += parseFloat(transaction.contribution_receipt_amount);
            sampleCount++;
          }
        }
      }
      
      if (page % 10 === 0) {
        console.log(`  Processed ${page} pages...`);
      }
      
      // Add small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const avgContribution = sampleCount > 0 ? sampleTotal / sampleCount : 0;
    const estimatedTotal = avgContribution * data.pagination.count;
    
    console.log(`Sample statistics:`);
    console.log(`  Sample size: ${sampleCount.toLocaleString()} transactions`);
    console.log(`  Sample total: $${sampleTotal.toLocaleString()}`);
    console.log(`  Average contribution: $${avgContribution.toFixed(2)}`);
    console.log(`  Estimated total contributions: $${estimatedTotal.toLocaleString()}`);
    
    return {
      year: year,
      label: label,
      totalTransactions: data.pagination.count,
      sampleSize: sampleCount,
      sampleTotal: sampleTotal,
      averageContribution: avgContribution,
      estimatedTotal: estimatedTotal
    };
    
  } catch (error) {
    console.error(`Error querying contributions for ${label}:`, error.message);
    return { year, label, error: error.message };
  }
}

async function main() {
  console.log('FEC Total Contributions Analysis');
  console.log('================================');
  
  try {
    // Query both cycles
    const results2023_24 = await getTotalContributions(2024, '2023-2024 Election Cycle');
    const results2024_25 = await getTotalContributions(2026, '2024-2025 Election Cycle');
    
    // Summary
    console.log('\n=== SUMMARY ===');
    
    if (!results2023_24.error) {
      console.log(`2023-2024 Cycle:`);
      console.log(`  Total transactions: ${results2023_24.totalTransactions.toLocaleString()}`);
      console.log(`  Estimated total: $${results2023_24.estimatedTotal.toLocaleString()}`);
    }
    
    if (!results2024_25.error) {
      console.log(`2024-2025 Cycle:`);
      console.log(`  Total transactions: ${results2024_25.totalTransactions.toLocaleString()}`);
      console.log(`  Estimated total: $${results2024_25.estimatedTotal.toLocaleString()}`);
    }
    
    if (!results2023_24.error && !results2024_25.error) {
      const grandTotal = results2023_24.estimatedTotal + results2024_25.estimatedTotal;
      console.log(`\nGRAND TOTAL: $${grandTotal.toLocaleString()}`);
      
      // Processing fee comparison
      const processingFees2023_24 = 191212980.84;
      const processingFees2024_25 = 82707933.839;
      const totalProcessingFees = processingFees2023_24 + processingFees2024_25;
      
      console.log('\n=== PROCESSING FEE COMPARISON ===');
      console.log(`Total contributions: $${grandTotal.toLocaleString()}`);
      console.log(`Total processing fees: $${totalProcessingFees.toLocaleString()}`);
      console.log(`Processing fee percentage: ${((totalProcessingFees / grandTotal) * 100).toFixed(2)}%`);
      
      console.log(`\n2023-2024 Cycle:`);
      console.log(`  Processing fee %: ${((processingFees2023_24 / results2023_24.estimatedTotal) * 100).toFixed(2)}%`);
      
      console.log(`2024-2025 Cycle:`);
      console.log(`  Processing fee %: ${((processingFees2024_25 / results2024_25.estimatedTotal) * 100).toFixed(2)}%`);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

main().catch(console.error);