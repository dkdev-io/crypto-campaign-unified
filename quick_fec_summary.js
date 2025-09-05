#!/usr/bin/env node

// Quick FEC Credit Card Processing Fees Summary
// Gets counts and estimates from FEC API without processing all transactions

const API_KEY = 'F7QA9sKDcXZOjuqz2nk7DzZXLenyzf3GEYaZqpFD';
const BASE_URL = 'https://api.open.fec.gov/v1';

// Key terms for processing fees
const TERMS = [
  'credit card',
  'processing fee',
  'actblue',
  'winred',
  'merchant fee',
  'payment processing'
];

async function getQuickSummary(year, term) {
  try {
    const url = `${BASE_URL}/schedules/schedule_b/?disbursement_description=${encodeURIComponent(term)}&two_year_transaction_period=${year}&per_page=20`;
    
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
    
    // Calculate average from sample
    let sampleTotal = 0;
    let sampleCount = 0;
    
    if (data.results && data.results.length > 0) {
      for (const transaction of data.results) {
        if (transaction.disbursement_amount) {
          sampleTotal += parseFloat(transaction.disbursement_amount);
          sampleCount++;
        }
      }
    }
    
    const avgAmount = sampleCount > 0 ? sampleTotal / sampleCount : 0;
    const estimatedTotal = avgAmount * data.pagination.count;
    
    return {
      term,
      count: data.pagination.count,
      sampleAverage: avgAmount,
      estimatedTotal: estimatedTotal,
      sampleSize: sampleCount
    };
    
  } catch (error) {
    console.error(`Error querying "${term}" for ${year}:`, error.message);
    return { term, error: error.message };
  }
}

async function main() {
  console.log('FEC Credit Card Processing Fees Quick Analysis');
  console.log('===============================================');
  
  const years = [2024, 2026]; // 2024 cycle = 2023-2024, 2026 cycle = 2024-2025
  const yearLabels = ['2023-2024 Election Cycle', '2024-2025 Election Cycle'];
  
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const label = yearLabels[i];
    
    console.log(`\n=== ${label} ===`);
    
    let totalEstimated = 0;
    let totalTransactions = 0;
    
    for (const term of TERMS) {
      console.log(`Analyzing: "${term}"...`);
      
      const result = await getQuickSummary(year, term);
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
        continue;
      }
      
      console.log(`  Count: ${result.count.toLocaleString()} transactions`);
      console.log(`  Sample average: $${result.sampleAverage.toFixed(2)} (from ${result.sampleSize} samples)`);
      console.log(`  Estimated total: $${result.estimatedTotal.toLocaleString()}`);
      console.log('');
      
      totalEstimated += result.estimatedTotal;
      totalTransactions += result.count;
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`${label} TOTALS:`);
    console.log(`  Total transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`  Estimated total amount: $${totalEstimated.toLocaleString()}`);
  }
  
  console.log('\nNOTE: These are estimates based on sample data from each search term.');
  console.log('Actual amounts may vary due to overlapping results and data sampling limitations.');
}

main().catch(console.error);