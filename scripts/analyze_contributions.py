#!/usr/bin/env python3
"""Quick contribution analysis script"""

import csv

with open('data/donors.csv', 'r') as f:
    donors = list(csv.DictReader(f))

# Check contribution amounts
amounts = [float(d['contribution_amount']) for d in donors]
print(f'Total contributions: ${sum(amounts):,.2f}')
print(f'Average contribution: ${sum(amounts)/len(amounts):,.2f}')
print(f'Max contribution: ${max(amounts):,.2f}')
print(f'Min contribution: ${min(amounts):,.2f}')

# Check for $3,300 contributions
exactly_3300 = [d for d in donors if float(d['contribution_amount']) == 3300.00]
print(f'Exactly $3,300 contributions: {len(exactly_3300)}')

# Check unique donors
unique_donors = set(d['unique_id'] for d in donors)
print(f'Unique donors: {len(unique_donors)}')

# Check wallet address format
invalid_wallets = []
for d in donors:
    wallet = d['wallet_address']
    if not wallet.startswith('0x') or len(wallet) != 42:
        invalid_wallets.append(wallet)
    # Check hex characters
    try:
        int(wallet[2:], 16)
    except ValueError:
        invalid_wallets.append(wallet)

print(f'Invalid wallet addresses: {len(invalid_wallets)}')