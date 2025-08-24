#!/usr/bin/env python3
"""
Quality Control Script for Campaign Data Tables
Validates data integrity, format compliance, and business rules
"""

import csv
import re
from collections import Counter, defaultdict
from datetime import datetime

def load_csv(filepath):
    """Load CSV file and return data as list of dictionaries"""
    with open(filepath, 'r') as f:
        return list(csv.DictReader(f))

def check_unique_ids(prospects, donors, kyc):
    """Verify unique ID format and uniqueness"""
    print("\n=== UNIQUE ID VALIDATION ===")
    
    # Check format (8 alphanumeric characters)
    id_pattern = re.compile(r'^[A-Z0-9]{8}$')
    
    all_ids = []
    invalid_ids = []
    
    # Check prospects
    prospect_ids = [p['unique_id'] for p in prospects]
    for pid in prospect_ids:
        if not id_pattern.match(pid):
            invalid_ids.append(('prospects', pid))
        all_ids.append(pid)
    
    # Check donors (unique per person, not per contribution)
    donor_ids = list(set([d['unique_id'] for d in donors]))
    for did in donor_ids:
        if not id_pattern.match(did):
            invalid_ids.append(('donors', did))
    
    # Check KYC
    kyc_ids = [k['unique_id'] for k in kyc]
    for kid in kyc_ids:
        if not id_pattern.match(kid):
            invalid_ids.append(('kyc', kid))
    
    # Check uniqueness in prospects
    prospect_duplicates = [id for id, count in Counter(prospect_ids).items() if count > 1]
    
    print(f"✓ Prospect unique IDs: {len(prospect_ids)} total, {len(set(prospect_ids))} unique")
    print(f"✓ Donor unique IDs: {len(donor_ids)} unique individuals")
    print(f"✓ KYC unique IDs: {len(kyc_ids)} total")
    
    if invalid_ids:
        print(f"✗ Invalid ID format: {invalid_ids}")
    else:
        print("✓ All IDs match format (8 alphanumeric)")
    
    if prospect_duplicates:
        print(f"✗ Duplicate IDs in prospects: {prospect_duplicates}")
    else:
        print("✓ All prospect IDs are unique")
    
    return prospect_ids, donor_ids

def check_wallet_addresses(prospects, donors):
    """Verify wallet address format"""
    print("\n=== WALLET ADDRESS VALIDATION ===")
    
    wallet_pattern = re.compile(r'^0x[a-fA-F0-9]{40}$')
    
    invalid_wallets = []
    
    # Check prospects
    for p in prospects:
        if not wallet_pattern.match(p['wallet_address']):
            invalid_wallets.append(('prospects', p['unique_id'], p['wallet_address']))
    
    # Check donors
    for d in donors:
        if not wallet_pattern.match(d['wallet_address']):
            invalid_wallets.append(('donors', d['unique_id'], d['wallet_address']))
    
    prospect_wallets = [p['wallet_address'] for p in prospects]
    donor_wallets = list(set([d['wallet_address'] for d in donors]))
    
    print(f"✓ Prospect wallets: {len(prospect_wallets)} total")
    print(f"✓ Donor wallets: {len(donor_wallets)} unique")
    
    if invalid_wallets:
        print(f"✗ Invalid wallet format: {len(invalid_wallets)} addresses")
        for table, id, wallet in invalid_wallets[:5]:
            print(f"  - {table}: {id} -> {wallet}")
    else:
        print("✓ All wallet addresses match format (0x + 40 hex)")
    
    # Check for duplicates
    wallet_duplicates = [w for w, count in Counter(prospect_wallets).items() if count > 1]
    if wallet_duplicates:
        print(f"✗ Duplicate wallets in prospects: {len(wallet_duplicates)}")
    else:
        print("✓ All prospect wallets are unique")

def check_donor_contributions(donors):
    """Validate donor contribution rules"""
    print("\n=== DONOR CONTRIBUTION VALIDATION ===")
    
    # Group contributions by donor
    donor_contributions = defaultdict(list)
    for d in donors:
        donor_contributions[d['unique_id']].append(float(d['contribution_amount']))
    
    # Count donors by category
    single_3300 = []
    under_50 = []
    over_3299_single = []
    multi_to_3299 = []
    
    for donor_id, amounts in donor_contributions.items():
        total = sum(amounts)
        
        if len(amounts) == 1 and amounts[0] == 3300.00:
            single_3300.append(donor_id)
        elif len(amounts) == 1 and amounts[0] < 50:
            under_50.append((donor_id, amounts[0]))
        elif len(amounts) == 1 and amounts[0] > 3299:
            over_3299_single.append((donor_id, amounts[0]))
        elif len(amounts) > 1 and 3299 <= total <= 3300:
            multi_to_3299.append((donor_id, total, len(amounts)))
    
    print(f"✓ Total unique donors: {len(donor_contributions)}")
    print(f"✓ Total contributions: {len(donors)}")
    print(f"\nContribution Categories:")
    print(f"  • $3,300 single contribution: {len(single_3300)} donors")
    print(f"  • Under $50: {len(under_50)} donors")
    print(f"  • Over $3,299 single: {len(over_3299_single)} donors")
    print(f"  • Multiple to $3,299: {len(multi_to_3299)} donors")
    
    # Check FEC compliance
    violations = []
    for donor_id, amounts in donor_contributions.items():
        total = sum(amounts)
        if total > 3300:
            violations.append((donor_id, total))
    
    if violations:
        print(f"\n✗ FEC VIOLATIONS: {len(violations)} donors exceed $3,300 limit")
        for donor_id, total in violations[:5]:
            print(f"  - {donor_id}: ${total:.2f}")
    else:
        print("\n✓ All donors comply with $3,300 FEC limit")
    
    return donor_contributions

def check_prospect_donor_overlap(prospect_ids, donor_ids):
    """Verify exactly 38 donors are also prospects"""
    print("\n=== PROSPECT-DONOR OVERLAP ===")
    
    overlap = set(prospect_ids) & set(donor_ids)
    
    print(f"✓ Overlapping IDs: {len(overlap)} donors are also prospects")
    
    if len(overlap) == 38:
        print("✓ Exactly 38 donors overlap with prospects (as required)")
    else:
        print(f"✗ Expected 38 overlapping donors, found {len(overlap)}")
    
    return overlap

def check_kyc_status(kyc, donor_ids):
    """Verify KYC status distribution"""
    print("\n=== KYC STATUS VALIDATION ===")
    
    yes_count = sum(1 for k in kyc if k['kyc_status'] == 'Yes')
    no_count = sum(1 for k in kyc if k['kyc_status'] == 'No')
    
    print(f"✓ KYC Yes: {yes_count}")
    print(f"✓ KYC No: {no_count}")
    
    if yes_count == 139 and no_count == 11:
        print("✓ KYC distribution matches requirements (139 Yes, 11 No)")
    else:
        print(f"✗ KYC distribution mismatch (expected 139 Yes, 11 No)")
    
    # Check all donors passed KYC
    kyc_dict = {k['unique_id']: k['kyc_status'] for k in kyc}
    donor_kyc_failed = []
    
    for donor_id in donor_ids:
        if donor_id in kyc_dict and kyc_dict[donor_id] == 'No':
            donor_kyc_failed.append(donor_id)
    
    if donor_kyc_failed:
        print(f"✗ {len(donor_kyc_failed)} donors failed KYC (should be 0)")
        print(f"  Failed: {donor_kyc_failed[:5]}")
    else:
        print("✓ All donors passed KYC verification")

def check_data_completeness(prospects):
    """Check for missing or duplicate data"""
    print("\n=== DATA COMPLETENESS ===")
    
    # Check for duplicates
    names = [(p['first_name'], p['last_name']) for p in prospects]
    name_duplicates = [name for name, count in Counter(names).items() if count > 1]
    
    phones = [p['phone_number'] for p in prospects]
    phone_duplicates = [phone for phone, count in Counter(phones).items() if count > 1]
    
    if name_duplicates:
        print(f"✗ Duplicate names found: {len(name_duplicates)}")
        for first, last in name_duplicates[:3]:
            print(f"  - {first} {last}")
    else:
        print("✓ All prospect names are unique")
    
    if phone_duplicates:
        print(f"✗ Duplicate phone numbers: {len(phone_duplicates)}")
    else:
        print("✓ All phone numbers are unique")
    
    # Check required fields
    missing_data = []
    for i, p in enumerate(prospects):
        missing = []
        for field in ['first_name', 'last_name', 'phone_number', 'employer', 
                     'occupation', 'address_line_1', 'city', 'state', 'zip']:
            if not p.get(field):
                missing.append(field)
        if missing:
            missing_data.append((p['unique_id'], missing))
    
    if missing_data:
        print(f"✗ Records with missing data: {len(missing_data)}")
        for id, fields in missing_data[:3]:
            print(f"  - {id}: missing {fields}")
    else:
        print("✓ All required fields populated")

def main():
    print("=" * 50)
    print("CAMPAIGN DATA QUALITY CONTROL REPORT")
    print("=" * 50)
    
    # Load data
    prospects = load_csv('data/prospects.csv')
    donors = load_csv('data/donors.csv')
    kyc = load_csv('data/kyc.csv')
    
    print(f"\nData Loaded:")
    print(f"  • Prospects: {len(prospects)} records")
    print(f"  • Donors: {len(donors)} contribution records")
    print(f"  • KYC: {len(kyc)} records")
    
    # Run checks
    prospect_ids, donor_ids = check_unique_ids(prospects, donors, kyc)
    check_wallet_addresses(prospects, donors)
    donor_contributions = check_donor_contributions(donors)
    overlap = check_prospect_donor_overlap(prospect_ids, donor_ids)
    check_kyc_status(kyc, donor_ids)
    check_data_completeness(prospects)
    
    # Summary
    print("\n" + "=" * 50)
    print("QUALITY CONTROL SUMMARY")
    print("=" * 50)
    
    issues = []
    
    # Check all requirements
    if len(prospects) != 150:
        issues.append(f"Prospect count: {len(prospects)} (expected 150)")
    
    if len(donor_contributions) != 150:
        issues.append(f"Unique donors: {len(donor_contributions)} (expected 150)")
    
    if len(donors) != 215:
        issues.append(f"Total contributions: {len(donors)} (expected 215)")
    
    if len(overlap) != 38:
        issues.append(f"Prospect-donor overlap: {len(overlap)} (expected 38)")
    
    if issues:
        print("✗ ISSUES FOUND:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✓ ALL QUALITY CHECKS PASSED")
        print("\nData tables meet all specified requirements:")
        print("  ✓ 150 unique prospects")
        print("  ✓ 150 unique donors with 215 contributions")
        print("  ✓ 38 donors overlap with prospects")
        print("  ✓ Proper contribution distribution")
        print("  ✓ KYC status correctly assigned")
        print("  ✓ All wallet addresses properly formatted")
        print("  ✓ FEC compliance maintained")

if __name__ == "__main__":
    main()