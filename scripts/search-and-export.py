#!/usr/bin/env python3
"""
Campaign Data Search and Export Tool

Usage:
    python3 search-and-export.py                    # Interactive mode
    python3 search-and-export.py --search "term"    # Search for specific term
    python3 search-and-export.py --export all       # Export everything
    python3 search-and-export.py --combine          # Combine all CSVs into one
"""

import csv
import json
import os
import sys
import argparse
from pathlib import Path

class CampaignDataExplorer:
    def __init__(self):
        self.data_dir = Path(__file__).parent / "exported-data"
        self.data = {
            'prospects': [],
            'donors': [],
            'kyc': [],
            'validation': [],
            'merged': []
        }
        self.load_all_data()
    
    def load_all_data(self):
        """Load all CSV files into memory"""
        files = {
            'prospects': 'campaign_prospects.csv',
            'donors': 'campaign_donors.csv',
            'kyc': 'kyc.csv',
            'validation': 'validation_summary.csv',
            'merged': 'merged_donor_kyc_view.csv'
        }
        
        for key, filename in files.items():
            filepath = self.data_dir / filename
            if filepath.exists():
                with open(filepath, 'r') as f:
                    reader = csv.DictReader(f)
                    self.data[key] = list(reader)
                print(f"✅ Loaded {len(self.data[key])} records from {filename}")
            else:
                print(f"⚠️  File not found: {filename}")
    
    def search(self, term, dataset='all'):
        """Search across all data or specific dataset"""
        results = []
        term_lower = term.lower()
        
        if dataset == 'all':
            datasets_to_search = self.data.keys()
        else:
            datasets_to_search = [dataset] if dataset in self.data else []
        
        for ds in datasets_to_search:
            for record in self.data[ds]:
                # Check if search term appears in any field
                for field, value in record.items():
                    if term_lower in str(value).lower():
                        result = record.copy()
                        result['_dataset'] = ds
                        results.append(result)
                        break
        
        return results
    
    def display_results(self, results, limit=50):
        """Display search results in a formatted way"""
        if not results:
            print("❌ No results found")
            return
        
        print(f"\n📊 Found {len(results)} results (showing first {min(limit, len(results))})")
        print("=" * 80)
        
        for i, result in enumerate(results[:limit], 1):
            print(f"\n[{i}] Dataset: {result.get('_dataset', 'unknown')}")
            
            # Display key fields
            key_fields = ['unique_id', 'first_name', 'last_name', 'contribution_amount', 
                         'kyc_passed', 'contract_decision', 'wallet']
            
            for field in key_fields:
                if field in result:
                    value = result[field]
                    if field == 'contribution_amount' and value:
                        value = f"${float(value):.2f}"
                    elif field == 'wallet' and value:
                        value = value[:10] + '...' if len(value) > 10 else value
                    print(f"  {field}: {value}")
    
    def export_results(self, results, filename='search_results.csv'):
        """Export search results to CSV"""
        if not results:
            print("❌ No results to export")
            return
        
        # Get all unique field names
        fieldnames = set()
        for result in results:
            fieldnames.update(result.keys())
        fieldnames = sorted(list(fieldnames))
        
        with open(filename, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        
        print(f"✅ Exported {len(results)} results to {filename}")
    
    def combine_all_data(self):
        """Combine all datasets into a single CSV"""
        all_records = []
        
        # Add dataset identifier to each record
        for dataset_name, records in self.data.items():
            for record in records:
                record_copy = record.copy()
                record_copy['dataset_source'] = dataset_name
                all_records.append(record_copy)
        
        # Get all unique field names
        fieldnames = set()
        for record in all_records:
            fieldnames.update(record.keys())
        fieldnames = sorted(list(fieldnames))
        
        # Write combined file
        output_file = 'combined_all_data.csv'
        with open(output_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_records)
        
        print(f"✅ Combined {len(all_records)} records into {output_file}")
        return output_file
    
    def generate_statistics(self):
        """Generate and display statistics"""
        stats = {
            'total_prospects': len(self.data['prospects']),
            'total_donors': len(self.data['donors']),
            'total_contributions': len(self.data['donors']),
            'unique_donors': len(set(d['unique_id'] for d in self.data['donors'])),
            'kyc_passed': sum(1 for k in self.data['kyc'] if k.get('kyc_passed') == '1'),
            'kyc_failed': sum(1 for k in self.data['kyc'] if k.get('kyc_passed') == '0'),
        }
        
        # Calculate validation stats if available
        if self.data['validation']:
            stats['valid_contributions'] = sum(1 for v in self.data['validation'] 
                                              if v.get('contract_decision') == 'ACCEPTED')
            stats['invalid_contributions'] = sum(1 for v in self.data['validation'] 
                                                if v.get('contract_decision') != 'ACCEPTED')
            
            # Calculate total amounts
            total_amount = 0
            valid_amount = 0
            for v in self.data['validation']:
                try:
                    amount = float(v.get('contribution_amount', 0))
                    total_amount += amount
                    if v.get('contract_decision') == 'ACCEPTED':
                        valid_amount += amount
                except:
                    pass
            
            stats['total_amount_attempted'] = f"${total_amount:.2f}"
            stats['total_amount_valid'] = f"${valid_amount:.2f}"
            stats['success_rate'] = f"{(stats['valid_contributions'] / len(self.data['validation']) * 100):.1f}%"
        
        print("\n📊 CAMPAIGN DATA STATISTICS")
        print("=" * 50)
        for key, value in stats.items():
            print(f"{key.replace('_', ' ').title()}: {value}")
        
        # Save stats to JSON
        with open('campaign_statistics.json', 'w') as f:
            json.dump(stats, f, indent=2)
        print(f"\n✅ Statistics saved to campaign_statistics.json")
    
    def interactive_mode(self):
        """Run interactive search mode"""
        print("\n🔍 INTERACTIVE SEARCH MODE")
        print("Commands: search <term>, filter <field>=<value>, export, stats, combine, quit")
        print("=" * 60)
        
        while True:
            try:
                command = input("\n> ").strip()
                
                if command == 'quit' or command == 'exit':
                    break
                elif command == 'stats':
                    self.generate_statistics()
                elif command == 'combine':
                    self.combine_all_data()
                elif command.startswith('search '):
                    term = command[7:]
                    results = self.search(term)
                    self.display_results(results)
                    
                    if results and input("\nExport results? (y/n): ").lower() == 'y':
                        filename = input("Filename (default: search_results.csv): ").strip()
                        if not filename:
                            filename = 'search_results.csv'
                        self.export_results(results, filename)
                
                elif command.startswith('filter '):
                    filter_expr = command[7:]
                    if '=' in filter_expr:
                        field, value = filter_expr.split('=', 1)
                        results = []
                        for dataset in self.data.values():
                            for record in dataset:
                                if record.get(field.strip()) == value.strip():
                                    results.append(record)
                        self.display_results(results)
                
                elif command == 'export':
                    self.combine_all_data()
                
                elif command == 'help':
                    print("""
Available commands:
  search <term>        - Search for a term across all data
  filter <field>=<val> - Filter by specific field value
  stats               - Show statistics
  combine             - Combine all CSVs into one file
  export              - Export current results
  quit                - Exit the program
                    """)
                else:
                    print("Unknown command. Type 'help' for available commands.")
                    
            except KeyboardInterrupt:
                print("\n\nExiting...")
                break
            except Exception as e:
                print(f"Error: {e}")

def main():
    parser = argparse.ArgumentParser(description='Campaign Data Search and Export Tool')
    parser.add_argument('--search', help='Search for a specific term')
    parser.add_argument('--export', choices=['all', 'prospects', 'donors', 'kyc', 'validation'], 
                       help='Export specific dataset')
    parser.add_argument('--combine', action='store_true', help='Combine all CSVs into one')
    parser.add_argument('--stats', action='store_true', help='Display statistics')
    
    args = parser.parse_args()
    
    explorer = CampaignDataExplorer()
    
    if args.search:
        results = explorer.search(args.search)
        explorer.display_results(results)
        if results:
            explorer.export_results(results, f"search_{args.search.replace(' ', '_')}.csv")
    
    elif args.export:
        if args.export == 'all':
            explorer.combine_all_data()
        else:
            data = explorer.data.get(args.export, [])
            if data:
                explorer.export_results(data, f"{args.export}_export.csv")
    
    elif args.combine:
        explorer.combine_all_data()
    
    elif args.stats:
        explorer.generate_statistics()
    
    else:
        # Run interactive mode
        explorer.interactive_mode()

if __name__ == "__main__":
    main()