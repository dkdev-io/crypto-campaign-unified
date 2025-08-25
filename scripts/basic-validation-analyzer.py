#!/usr/bin/env python3

"""
Basic Validation Data Analyzer
Uses only standard library to analyze donation validation cases
"""

import csv
import json
from collections import defaultdict

def analyze_validation_cases():
    print('🔍 ANALYZING DONATION DATA FOR VALIDATION EDGE CASES')
    print('=' * 60)
    
    # Load donors data
    donors = []
    with open('../data/donors.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['contribution_amount'] = float(row['contribution_amount'])
            donors.append(row)
    
    # Load KYC data
    kyc = []
    with open('../data/kyc.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            kyc.append(row)
    
    # Load prospects data
    prospects = []
    with open('../data/prospects.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            prospects.append(row)
    
    print(f'📊 Loaded {len(donors)} donations, {len(kyc)} KYC records, {len(prospects)} prospects')
    
    validation_failures = []
    
    # CHECK 1: Individual contributions over $3300
    print(f'\n🚨 CHECK 1: CONTRIBUTIONS OVER $3300 LIMIT')
    over_limit = [d for d in donors if d['contribution_amount'] > 3300]
    print(f'Found {len(over_limit)} contributions over $3300')
    
    for donor in over_limit:
        failure_case = {
            'unique_id': donor['unique_id'],
            'name': f"{donor['first_name']} {donor['last_name']}",
            'failure_type': 'over_individual_limit',
            'amount': donor['contribution_amount'],
            'reason': f'Individual contribution ${donor["contribution_amount"]} exceeds $3300 limit'
        }
        validation_failures.append(failure_case)
        print(f'  ❌ {donor["first_name"]} {donor["last_name"]}: ${donor["contribution_amount"]}')
    
    # CHECK 2: Contributions exactly at $3300 (edge case)
    at_limit = [d for d in donors if d['contribution_amount'] == 3300]
    print(f'\n💰 CHECK 2: CONTRIBUTIONS EXACTLY AT $3300 LIMIT')
    print(f'Found {len(at_limit)} contributions at $3300 (edge case - should be allowed)')
    for donor in at_limit:
        print(f'  ⚠️ {donor["first_name"]} {donor["last_name"]}: ${donor["contribution_amount"]}')
    
    # CHECK 3: Cumulative contributions by person
    print(f'\n📊 CHECK 3: CUMULATIVE CONTRIBUTION ANALYSIS')
    
    # Calculate cumulative amounts per person
    cumulative = defaultdict(lambda: {'total': 0, 'count': 0, 'first_name': '', 'last_name': ''})
    
    for donor in donors:
        uid = donor['unique_id']
        cumulative[uid]['total'] += donor['contribution_amount']
        cumulative[uid]['count'] += 1
        cumulative[uid]['first_name'] = donor['first_name']
        cumulative[uid]['last_name'] = donor['last_name']
    
    # Find people over cumulative limit
    over_cumulative = [(uid, data) for uid, data in cumulative.items() if data['total'] > 3300]
    print(f'Found {len(over_cumulative)} donors over cumulative $3300 limit')
    
    for uid, data in over_cumulative:
        failure_case = {
            'unique_id': uid,
            'name': f"{data['first_name']} {data['last_name']}",
            'failure_type': 'over_cumulative_limit',
            'amount': data['total'],
            'reason': f'Cumulative contributions ${data["total"]:.2f} exceed $3300 limit ({data["count"]} donations)'
        }
        validation_failures.append(failure_case)
        print(f'  ❌ {data["first_name"]} {data["last_name"]} (ID: {uid}): ${data["total"]:.2f} across {data["count"]} contributions')
    
    # Find people near limit who would go over with new $100 donation
    near_limit = [(uid, data) for uid, data in cumulative.items() 
                  if data['total'] > 3200 and data['total'] <= 3300]
    
    print(f'\n⚠️ CHECK 4: DONORS NEAR LIMIT (would fail with $100+ donation)')
    print(f'Found {len(near_limit)} donors who would exceed limit with new donation')
    
    for uid, data in near_limit:
        remaining = 3300 - data['total']
        failure_case = {
            'unique_id': uid,
            'name': f"{data['first_name']} {data['last_name']}",
            'failure_type': 'would_exceed_with_new_donation',
            'current_amount': data['total'],
            'remaining_allowed': remaining,
            'reason': f'Current total ${data["total"]:.2f}, would exceed limit with donation over ${remaining:.2f}'
        }
        validation_failures.append(failure_case)
        print(f'  ⚠️ {data["first_name"]} {data["last_name"]}: ${data["total"]:.2f} (only ${remaining:.2f} remaining)')
    
    # CHECK 5: KYC rejection cases  
    print(f'\n🚫 CHECK 5: KYC REJECTION CASES')
    
    # Create prospect lookup
    prospect_lookup = {p['unique_id']: p for p in prospects}
    
    kyc_failed = [k for k in kyc if k['kyc_status'].lower() in ['failed', 'pending', 'no', 'rejected', 'denied']]
    
    print(f'Found {len(kyc_failed)} KYC rejection cases')
    
    for kyc_record in kyc_failed:
        uid = kyc_record['unique_id']
        if uid in prospect_lookup:
            prospect = prospect_lookup[uid]
            failure_case = {
                'unique_id': uid,
                'name': f"{prospect['first_name']} {prospect['last_name']}",
                'failure_type': 'kyc_rejection',
                'kyc_status': kyc_record['kyc_status'],
                'reason': f'KYC status: {kyc_record["kyc_status"]} - donation should be blocked'
            }
            validation_failures.append(failure_case)
            print(f'  ❌ {prospect["first_name"]} {prospect["last_name"]} (ID: {uid}): KYC {kyc_record["kyc_status"]}')
    
    # SUMMARY
    print(f'\n📋 VALIDATION FAILURE SUMMARY')
    print('=' * 40)
    
    failure_types = {}
    for f in validation_failures:
        ftype = f['failure_type']
        failure_types[ftype] = failure_types.get(ftype, 0) + 1
    
    print(f'Total validation failures expected: {len(validation_failures)}')
    for ftype, count in failure_types.items():
        print(f'{ftype.replace("_", " ").title()}: {count}')
    
    # Calculate expected success rate
    total_prospects = len(prospects)
    expected_failures = len(validation_failures)
    expected_successes = total_prospects - expected_failures
    expected_success_rate = (expected_successes / total_prospects) * 100
    
    print(f'\n🎯 EXPECTED TEST RESULTS:')
    print(f'Total prospects: {total_prospects}')
    print(f'Expected failures: {expected_failures}')
    print(f'Expected successes: {expected_successes}')
    print(f'Expected success rate: {expected_success_rate:.1f}%')
    
    # Save validation failure cases
    with open('test-results/validation-failures.json', 'w') as f:
        json.dump(validation_failures, f, indent=2)
    
    print(f'\n📁 Validation failure cases saved to: test-results/validation-failures.json')
    
    if len(validation_failures) == 0:
        print('\n🚨 WARNING: No validation failures found!')
        print('This suggests either:')
        print('1. The data is too clean (unrealistic)')
        print('2. The form is not validating properly') 
        print('3. The test agent is not detecting validation failures')
    else:
        print(f'\n✅ Found {len(validation_failures)} expected validation failures')
        print('This is realistic - some donations should be rejected!')
    
    return validation_failures

if __name__ == "__main__":
    analyze_validation_cases()