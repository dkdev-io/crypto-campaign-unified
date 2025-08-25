#!/usr/bin/env python3

"""
Validation Data Analyzer
Identifies edge cases that should cause form validation failures
"""

import pandas as pd
import json

def analyze_validation_cases():
    print('🔍 ANALYZING DONATION DATA FOR VALIDATION EDGE CASES')
    print('=' * 60)
    
    # Load data
    donors_df = pd.read_csv('../data/donors.csv')
    kyc_df = pd.read_csv('../data/kyc.csv')
    prospects_df = pd.read_csv('../data/prospects.csv')
    
    print(f'📊 Loaded {len(donors_df)} donations, {len(kyc_df)} KYC records, {len(prospects_df)} prospects')
    
    validation_failures = []
    
    # CHECK 1: Individual contributions over $3300
    print(f'\n🚨 CHECK 1: CONTRIBUTIONS OVER $3300 LIMIT')
    over_limit = donors_df[donors_df['contribution_amount'] > 3300]
    print(f'Found {len(over_limit)} contributions over $3300')
    
    for _, row in over_limit.iterrows():
        failure_case = {
            'unique_id': row['unique_id'],
            'name': f"{row['first_name']} {row['last_name']}",
            'failure_type': 'over_individual_limit',
            'amount': row['contribution_amount'],
            'reason': f'Individual contribution ${row["contribution_amount"]} exceeds $3300 limit'
        }
        validation_failures.append(failure_case)
        print(f'  ❌ {row["first_name"]} {row["last_name"]}: ${row["contribution_amount"]}')
    
    # CHECK 2: Contributions exactly at $3300 (edge case)
    at_limit = donors_df[donors_df['contribution_amount'] == 3300]
    print(f'\n💰 CHECK 2: CONTRIBUTIONS EXACTLY AT $3300 LIMIT')
    print(f'Found {len(at_limit)} contributions at $3300 (edge case)')
    for _, row in at_limit.iterrows():
        print(f'  ⚠️ {row["first_name"]} {row["last_name"]}: ${row["contribution_amount"]} (should be allowed)')
    
    # CHECK 3: Cumulative contributions by person over limit
    print(f'\n📊 CHECK 3: CUMULATIVE CONTRIBUTION ANALYSIS')
    cumulative = donors_df.groupby('unique_id').agg({
        'first_name': 'first',
        'last_name': 'first',
        'contribution_amount': ['sum', 'count']
    }).round(2)
    
    cumulative.columns = ['first_name', 'last_name', 'total_amount', 'num_contributions']
    cumulative = cumulative.reset_index()
    
    # People already over cumulative limit
    over_cumulative = cumulative[cumulative['total_amount'] > 3300]
    print(f'Found {len(over_cumulative)} donors over cumulative $3300 limit')
    for _, row in over_cumulative.iterrows():
        failure_case = {
            'unique_id': row['unique_id'],
            'name': f"{row['first_name']} {row['last_name']}",
            'failure_type': 'over_cumulative_limit',
            'amount': row['total_amount'],
            'reason': f'Cumulative contributions ${row["total_amount"]} exceed $3300 limit ({row["num_contributions"]} donations)'
        }
        validation_failures.append(failure_case)
        print(f'  ❌ {row["first_name"]} {row["last_name"]} (ID: {row["unique_id"]}): ${row["total_amount"]} across {row["num_contributions"]} contributions')
    
    # People who would go over limit with new $100 donation
    near_limit = cumulative[(cumulative['total_amount'] > 3200) & (cumulative['total_amount'] <= 3300)]
    print(f'\n⚠️ CHECK 4: DONORS NEAR LIMIT (would fail with $100+ donation)')
    print(f'Found {len(near_limit)} donors who would exceed limit with new donation')
    for _, row in near_limit.iterrows():
        remaining = 3300 - row['total_amount']
        failure_case = {
            'unique_id': row['unique_id'],
            'name': f"{row['first_name']} {row['last_name']}",
            'failure_type': 'would_exceed_with_new_donation',
            'current_amount': row['total_amount'],
            'remaining_allowed': remaining,
            'reason': f'Current total ${row["total_amount"]}, would exceed limit with donation over ${remaining}'
        }
        validation_failures.append(failure_case)
        print(f'  ⚠️ {row["first_name"]} {row["last_name"]}: ${row["total_amount"]} (only ${remaining} remaining)')
    
    # CHECK 5: KYC rejection cases
    print(f'\n🚫 CHECK 5: KYC REJECTION CASES')
    kyc_failed = kyc_df[kyc_df['kyc_status'].str.lower() == 'failed']
    kyc_pending = kyc_df[kyc_df['kyc_status'].str.lower() == 'pending'] 
    kyc_no = kyc_df[kyc_df['kyc_status'].str.lower().isin(['no', 'rejected', 'denied'])]
    
    print(f'KYC Failed: {len(kyc_failed)}')
    print(f'KYC Pending: {len(kyc_pending)}')
    print(f'KYC No/Rejected: {len(kyc_no)}')
    
    # Add KYC failures
    for _, row in pd.concat([kyc_failed, kyc_pending, kyc_no]).iterrows():
        # Get prospect name
        prospect = prospects_df[prospects_df['unique_id'] == row['unique_id']]
        if not prospect.empty:
            prospect_row = prospect.iloc[0]
            failure_case = {
                'unique_id': row['unique_id'],
                'name': f"{prospect_row['first_name']} {prospect_row['last_name']}",
                'failure_type': 'kyc_rejection',
                'kyc_status': row['kyc_status'],
                'reason': f'KYC status: {row["kyc_status"]} - donation should be blocked'
            }
            validation_failures.append(failure_case)
            print(f'  ❌ {prospect_row["first_name"]} {prospect_row["last_name"]} (ID: {row["unique_id"]}): KYC {row["kyc_status"]}')
    
    # SUMMARY
    print(f'\n📋 VALIDATION FAILURE SUMMARY')
    print('=' * 40)
    print(f'Total validation failures expected: {len(validation_failures)}')
    print(f'Individual over limit: {len([f for f in validation_failures if f["failure_type"] == "over_individual_limit"])}')
    print(f'Cumulative over limit: {len([f for f in validation_failures if f["failure_type"] == "over_cumulative_limit"])}')
    print(f'Would exceed with new donation: {len([f for f in validation_failures if f["failure_type"] == "would_exceed_with_new_donation"])}')
    print(f'KYC rejections: {len([f for f in validation_failures if f["failure_type"] == "kyc_rejection"])}')
    
    # Calculate expected success rate
    total_prospects = len(prospects_df)
    expected_failures = len(validation_failures)
    expected_successes = total_prospects - expected_failures
    expected_success_rate = (expected_successes / total_prospects) * 100
    
    print(f'\n🎯 EXPECTED TEST RESULTS:')
    print(f'Total prospects: {total_prospects}')
    print(f'Expected failures: {expected_failures}')
    print(f'Expected successes: {expected_successes}')
    print(f'Expected success rate: {expected_success_rate:.1f}%')
    
    # Save validation failure cases for testing
    with open('test-results/validation-failures.json', 'w') as f:
        json.dump(validation_failures, f, indent=2)
    
    print(f'\n📁 Validation failure cases saved to: test-results/validation-failures.json')
    
    if len(validation_failures) == 0:
        print('\n🚨 WARNING: No validation failures found - this suggests the data is too clean!')
        print('Real-world testing should have some failures due to validation rules.')
    else:
        print(f'\n✅ Found {len(validation_failures)} expected validation failures')
        print('This is realistic - some donations should be rejected!')
    
    return validation_failures

if __name__ == "__main__":
    analyze_validation_cases()