#!/usr/bin/env node

/**
 * Chart Generator for Form Testing Results
 * Creates visual charts and analysis of test results
 */

const fs = require('fs');

class ChartGenerator {
  constructor() {
    this.results = null;
  }

  loadResults(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      this.results = JSON.parse(data);
      console.log(`✅ Loaded ${this.results.length} test results`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to load results: ${error.message}`);
      return false;
    }
  }

  generateBasicChart() {
    if (!this.results) {
      console.error('❌ No results loaded');
      return;
    }

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const successRate = ((successful.length / this.results.length) * 100).toFixed(1);

    console.log('\n📊 FORM TESTING RESULTS CHART');
    console.log('='.repeat(60));
    
    // ASCII Bar Chart
    const maxWidth = 50;
    const successWidth = Math.round((successful.length / this.results.length) * maxWidth);
    const failWidth = maxWidth - successWidth;

    console.log('\nSuccess Rate Visualization:');
    console.log(`✅ Success [${successWidth > 0 ? '█'.repeat(successWidth) : ''}${' '.repeat(Math.max(0, 25 - successWidth))}] ${successful.length}/${this.results.length} (${successRate}%)`);
    console.log(`❌ Failed  [${failWidth > 0 ? '█'.repeat(failWidth) : ''}${' '.repeat(Math.max(0, 25 - failWidth))}] ${failed.length}/${this.results.length} (${(100 - successRate).toFixed(1)}%)`);

    // Field Success Analysis
    console.log('\n📝 FIELD FILLING SUCCESS RATES:');
    console.log('-'.repeat(40));
    
    const fieldStats = {};
    this.results.forEach(result => {
      if (result.steps && result.steps.formFilling && result.steps.formFilling.fieldMap) {
        Object.keys(result.steps.formFilling.fieldMap).forEach(field => {
          if (!fieldStats[field]) fieldStats[field] = 0;
          fieldStats[field]++;
        });
      }
    });

    Object.entries(fieldStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        const rate = ((count / this.results.length) * 100).toFixed(1);
        const barWidth = Math.round((count / this.results.length) * 30);
        const bar = '█'.repeat(barWidth) + '░'.repeat(30 - barWidth);
        console.log(`${field.padEnd(25)} [${bar}] ${count}/${this.results.length} (${rate}%)`);
      });

    // Performance Analysis
    console.log('\n⏱️  PERFORMANCE METRICS:');
    console.log('-'.repeat(30));
    
    const durations = this.results.map(r => r.duration).filter(d => d);
    if (durations.length > 0) {
      const avgDuration = (durations.reduce((a, b) => a + b, 0) / durations.length / 1000).toFixed(2);
      const minDuration = (Math.min(...durations) / 1000).toFixed(2);
      const maxDuration = (Math.max(...durations) / 1000).toFixed(2);
      
      console.log(`Average test time: ${avgDuration}s`);
      console.log(`Fastest test: ${minDuration}s`);
      console.log(`Slowest test: ${maxDuration}s`);
    }

    // Error Analysis
    if (failed.length > 0) {
      console.log('\n💥 ERROR ANALYSIS:');
      console.log('-'.repeat(25));
      
      const errorStats = {};
      failed.forEach(result => {
        const error = result.error || result.steps?.submission?.error || 'Unknown error';
        const errorType = this.categorizeError(error);
        if (!errorStats[errorType]) errorStats[errorType] = 0;
        errorStats[errorType]++;
      });

      Object.entries(errorStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([error, count]) => {
          const rate = ((count / failed.length) * 100).toFixed(1);
          console.log(`${error.padEnd(20)}: ${count} (${rate}%)`);
        });
    }

    // Test Progress Timeline
    console.log('\n📈 TESTING TIMELINE:');
    console.log('-'.repeat(30));
    
    if (this.results.length >= 10) {
      const batchSize = Math.ceil(this.results.length / 10);
      for (let i = 0; i < 10; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, this.results.length);
        const batch = this.results.slice(start, end);
        const batchSuccess = batch.filter(r => r.success).length;
        const batchRate = ((batchSuccess / batch.length) * 100).toFixed(0);
        
        const indicator = batchRate >= 80 ? '🟢' : batchRate >= 60 ? '🟡' : batchRate >= 40 ? '🟠' : '🔴';
        console.log(`Batch ${(i + 1).toString().padStart(2)}: ${indicator} ${batchSuccess}/${batch.length} (${batchRate}%)`);
      }
    }

    return {
      totalTests: this.results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: parseFloat(successRate),
      fieldStats,
      errorStats: failed.length > 0 ? this.getErrorStats(failed) : {},
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    };
  }

  categorizeError(error) {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('timeout') || errorLower.includes('navigation')) return 'Navigation/Timeout';
    if (errorLower.includes('form') || errorLower.includes('input')) return 'Form Issues';
    if (errorLower.includes('submit') || errorLower.includes('button')) return 'Submission Issues';
    if (errorLower.includes('selector') || errorLower.includes('element')) return 'Element Not Found';
    return 'Other';
  }

  getErrorStats(failed) {
    const errorStats = {};
    failed.forEach(result => {
      const error = result.error || result.steps?.submission?.error || 'Unknown error';
      const errorType = this.categorizeError(error);
      if (!errorStats[errorType]) errorStats[errorType] = 0;
      errorStats[errorType]++;
    });
    return errorStats;
  }

  generateDetailedReport() {
    if (!this.results) return;

    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateBasicChart(),
      testDetails: this.results.map(result => ({
        persona: result.persona,
        success: result.success,
        duration: result.duration,
        fieldsAttempted: result.steps?.formFilling?.attempted || 0,
        fieldsSuccessful: result.steps?.formFilling?.successful || 0,
        error: result.error || null
      })),
      insights: this.generateInsights()
    };

    // Save detailed report
    const reportPath = `test-results/detailed-chart-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📁 Detailed report saved: ${reportPath}`);

    return report;
  }

  generateInsights() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    const insights = [];

    // Success rate insight
    const successRate = (successful.length / this.results.length) * 100;
    if (successRate >= 90) {
      insights.push('🎉 Excellent success rate - form is working very well');
    } else if (successRate >= 70) {
      insights.push('✅ Good success rate - minor issues to address');
    } else if (successRate >= 50) {
      insights.push('⚠️ Moderate success rate - several issues need attention');
    } else {
      insights.push('🚨 Low success rate - major form issues require immediate attention');
    }

    // Field filling insights
    const avgFieldsAttempted = this.results.reduce((sum, r) => sum + (r.steps?.formFilling?.attempted || 0), 0) / this.results.length;
    const avgFieldsSuccessful = this.results.reduce((sum, r) => sum + (r.steps?.formFilling?.successful || 0), 0) / this.results.length;
    
    if (avgFieldsSuccessful < avgFieldsAttempted * 0.5) {
      insights.push('📝 Form field detection needs improvement - many fields not being filled');
    }

    // Performance insights
    const durations = this.results.map(r => r.duration).filter(d => d);
    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avgDuration > 30000) {
        insights.push('⏰ Tests are running slowly - consider optimization');
      }
    }

    return insights;
  }
}

// CLI usage
async function main() {
  const generator = new ChartGenerator();
  
  // Find the most recent test results file
  const testResultsDir = 'test-results';
  if (!fs.existsSync(testResultsDir)) {
    console.error('❌ No test results directory found');
    return;
  }

  const files = fs.readdirSync(testResultsDir)
    .filter(f => f.startsWith('ultimate-form-test-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No test result files found');
    return;
  }

  const latestFile = `${testResultsDir}/${files[0]}`;
  console.log(`📊 Analyzing results from: ${latestFile}`);

  if (generator.loadResults(latestFile)) {
    const summary = generator.generateBasicChart();
    const detailedReport = generator.generateDetailedReport();
    
    console.log('\n🎯 KEY INSIGHTS:');
    detailedReport.insights.forEach(insight => console.log(`  ${insight}`));
  }
}

if (require.main === module) {
  main();
}

module.exports = ChartGenerator;