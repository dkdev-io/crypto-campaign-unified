#!/usr/bin/env python3
"""
Generate clean campaign data tables with proper validation
"""

import csv
import random
import string
from datetime import datetime, timedelta

# Lists for generating realistic data
first_names = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
    "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Helen", "Mark", "Sandra",
    "Donald", "Donna", "Steven", "Carol", "Kenneth", "Ruth", "Paul", "Sharon", "Joshua", "Michelle",
    "Kevin", "Laura", "Brian", "Emily", "George", "Kimberly", "Edward", "Deborah", "Ronald", "Dorothy",
    "Timothy", "Amy", "Jason", "Angela", "Jeffrey", "Ashley", "Ryan", "Brenda", "Jacob", "Emma",
    "Gary", "Virginia", "Nicholas", "Pamela", "Eric", "Martha", "Jonathan", "Debra", "Stephen", "Amanda",
    "Larry", "Stephanie", "Justin", "Janet", "Scott", "Carolyn", "Brandon", "Christine", "Benjamin", "Marie",
    "Samuel", "Catherine", "Frank", "Frances", "Gregory", "Christina", "Raymond", "Samantha", "Alexander", "Nicole",
    "Patrick", "Rebecca", "Jack", "Julia", "Dennis", "Judy", "Jerry", "Teresa", "Tyler", "Janice",
    "Aaron", "Kelly", "Jose", "Madison", "Nathan", "Grace", "Adam", "Sophia", "Henry", "Victoria",
    "Douglas", "Olivia", "Zachary", "Isabella", "Peter", "Megan", "Kyle", "Charlotte", "Noah", "Evelyn",
    "Ethan", "Abigail", "Jeremy", "Hannah", "Walter", "Rachel", "Keith", "Chloe", "Christian", "Mia",
    "Austin", "Katherine", "Roger", "Sara", "Sean", "Diana", "Carl", "Andrea", "Gerald", "Brittany",
    "Harold", "Natalie", "Jordan", "Julie", "Albert", "Anna", "Willie", "Jacqueline", "Wayne", "Joyce",
    "Mason", "Maria", "Vincent", "Joan", "Ralph", "Heather", "Eugene", "Denise", "Russell", "Diane"
]

last_names = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
    "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
    "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
    "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
    "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez",
    "Powell", "Jenkins", "Perry", "Russell", "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes",
    "Gonzales", "Fisher", "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander", "Hamilton", "Graham",
    "Reynolds", "Griffin", "Wallace", "Moreno", "West", "Cole", "Hayes", "Bryant", "Herrera", "Gibson",
    "Ellis", "Tran", "Medina", "Aguilar", "Stevens", "Murray", "Ford", "Castro", "Marshall", "Owens",
    "Harrison", "Fernandez", "McDonald", "Woods", "Washington", "Kennedy", "Wells", "Vargas", "Henry", "Chen"
]

cities = [
    ("San Francisco", "CA", "94102"), ("Los Angeles", "CA", "90001"), ("New York", "NY", "10001"),
    ("Chicago", "IL", "60601"), ("Houston", "TX", "77001"), ("Phoenix", "AZ", "85001"),
    ("Philadelphia", "PA", "19101"), ("San Antonio", "TX", "78201"), ("San Diego", "CA", "92101"),
    ("Dallas", "TX", "75201"), ("San Jose", "CA", "95101"), ("Austin", "TX", "78701"),
    ("Jacksonville", "FL", "32201"), ("Columbus", "OH", "43201"), ("Charlotte", "NC", "28201"),
    ("Indianapolis", "IN", "46201"), ("Fort Worth", "TX", "76101"), ("Seattle", "WA", "98101"),
    ("Denver", "CO", "80201"), ("Washington", "DC", "20001"), ("Boston", "MA", "02101"),
    ("Nashville", "TN", "37201"), ("Detroit", "MI", "48201"), ("Portland", "OR", "97201"),
    ("Las Vegas", "NV", "89101"), ("Milwaukee", "WI", "53201"), ("Albuquerque", "NM", "87101"),
    ("Tucson", "AZ", "85701"), ("Fresno", "CA", "93701"), ("Sacramento", "CA", "95801"),
    ("Kansas City", "MO", "64101"), ("Omaha", "NE", "68101"), ("Raleigh", "NC", "27601"),
    ("Miami", "FL", "33101"), ("Cleveland", "OH", "44101"), ("Virginia Beach", "VA", "23451"),
    ("Atlanta", "GA", "30301"), ("Oakland", "CA", "94601"), ("Minneapolis", "MN", "55401"),
    ("Tampa", "FL", "33601"), ("Honolulu", "HI", "96801"), ("Anaheim", "CA", "92801")
]

companies = [
    "Tech Solutions Inc", "Global Marketing Corp", "Financial Advisory LLC", "Healthcare Partners",
    "Law Associates", "Education First", "Construction Co", "Retail Giants", "Auto Industries",
    "Media Productions", "Tech Startup", "Fashion House", "Investment Bank", "Real Estate Group",
    "Insurance Corp", "Consulting Firm", "Energy Company", "Biotech Labs", "Aerospace Corp",
    "Publishing House", "Sports Management", "Food Services", "Security Firm", "Travel Agency",
    "Music Label", "Art Gallery", "Gaming Studio", "Pharmacy Chain", "Logistics Co",
    "Hotel Chain", "Airlines", "University", "Hospital Network", "Nonprofit Org",
    "Architecture Firm", "Accounting Firm", "Film Studio", "Telecom Company", "Retail Chain"
]

occupations = [
    "Software Engineer", "Marketing Director", "Financial Analyst", "Physician", "Attorney",
    "Teacher", "Project Manager", "Store Manager", "Mechanical Engineer", "Producer",
    "CEO", "Designer", "Banker", "Real Estate Agent", "Underwriter", "Consultant",
    "Engineer", "Research Scientist", "Systems Analyst", "Editor", "Agent",
    "Restaurant Owner", "Security Consultant", "Travel Agent", "Game Developer",
    "Pharmacist", "Operations Manager", "Hotel Manager", "Pilot", "Professor",
    "Administrator", "Director", "Architect", "CPA", "Network Engineer",
    "Regional Manager", "Product Manager", "Creative Director", "Site Supervisor", "Partner"
]

def generate_unique_id():
    """Generate 8-character alphanumeric ID"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def generate_wallet_address():
    """Generate valid Ethereum wallet address (0x + 40 hex chars)"""
    hex_chars = '0123456789abcdef'
    return '0x' + ''.join(random.choices(hex_chars, k=40))

def generate_phone():
    """Generate phone number"""
    return f"555-{random.randint(1000, 9999)}"

def generate_address():
    """Generate random address"""
    street_num = random.randint(100, 999)
    street_names = ["Oak", "Pine", "Elm", "Maple", "Cedar", "Birch", "Spruce", "Willow", "Ash", "Poplar"]
    street_types = ["Street", "Avenue", "Drive", "Lane", "Road", "Court", "Way", "Boulevard", "Place", "Circle"]
    street = f"{street_num} {random.choice(street_names)} {random.choice(street_types)}"
    
    # 30% chance of apartment/unit
    apt = ""
    if random.random() < 0.3:
        apt_types = ["Apt", "Suite", "Unit", "Floor"]
        apt = f"{random.choice(apt_types)} {random.randint(1, 20)}{random.choice(['', 'A', 'B', 'C', 'D'])}"
    
    return street, apt

def generate_prospects():
    """Generate 150 unique prospects"""
    prospects = []
    used_ids = set()
    used_names = set()
    used_phones = set()
    used_wallets = set()
    
    while len(prospects) < 150:
        # Generate unique ID
        unique_id = generate_unique_id()
        while unique_id in used_ids:
            unique_id = generate_unique_id()
        used_ids.add(unique_id)
        
        # Generate unique name
        first = random.choice(first_names)
        last = random.choice(last_names)
        while (first, last) in used_names:
            first = random.choice(first_names)
            last = random.choice(last_names)
        used_names.add((first, last))
        
        # Generate unique phone
        phone = generate_phone()
        while phone in used_phones:
            phone = generate_phone()
        used_phones.add(phone)
        
        # Generate unique wallet
        wallet = generate_wallet_address()
        while wallet in used_wallets:
            wallet = generate_wallet_address()
        used_wallets.add(wallet)
        
        # Generate address
        street, apt = generate_address()
        city, state, zip_code = random.choice(cities)
        
        prospects.append({
            'unique_id': unique_id,
            'first_name': first,
            'last_name': last,
            'phone_number': phone,
            'employer': random.choice(companies),
            'occupation': random.choice(occupations),
            'address_line_1': street,
            'address_line_2': apt,
            'city': city,
            'state': state,
            'zip': zip_code,
            'wallet_address': wallet
        })
    
    return prospects

def generate_donors(prospects):
    """Generate 150 unique donors with 215 contributions, 38 from prospects"""
    donors = []
    contributions = []
    
    # MUST have exactly 38 prospects as donors
    prospect_donors = random.sample(prospects, 38)
    
    # MUST generate exactly 112 new donors (150 total - 38 from prospects)
    new_donors = []
    used_ids = set([p['unique_id'] for p in prospects])
    used_names = set([(p['first_name'], p['last_name']) for p in prospects])
    used_phones = set([p['phone_number'] for p in prospects])
    used_wallets = set([p['wallet_address'] for p in prospects])
    
    while len(new_donors) < 112:
        # Generate unique ID
        unique_id = generate_unique_id()
        while unique_id in used_ids:
            unique_id = generate_unique_id()
        used_ids.add(unique_id)
        
        # Generate unique name
        first = random.choice(first_names)
        last = random.choice(last_names)
        while (first, last) in used_names:
            first = random.choice(first_names)
            last = random.choice(last_names)
        used_names.add((first, last))
        
        # Generate unique phone
        phone = generate_phone()
        while phone in used_phones:
            phone = generate_phone()
        used_phones.add(phone)
        
        # Generate unique wallet
        wallet = generate_wallet_address()
        while wallet in used_wallets:
            wallet = generate_wallet_address()
        used_wallets.add(wallet)
        
        # Generate address
        street, apt = generate_address()
        city, state, zip_code = random.choice(cities)
        
        new_donors.append({
            'unique_id': unique_id,
            'first_name': first,
            'last_name': last,
            'phone_number': phone,
            'employer': random.choice(companies),
            'occupation': random.choice(occupations),
            'address_line_1': street,
            'address_line_2': apt,
            'city': city,
            'state': state,
            'zip': zip_code,
            'wallet_address': wallet
        })
    
    # Combine all donors
    all_donors = prospect_donors + new_donors
    random.shuffle(all_donors)
    
    # Track contribution rules
    single_3300 = random.sample(all_donors, 5)
    remaining = [d for d in all_donors if d not in single_3300]
    
    under_50 = random.sample(remaining, 25)
    remaining = [d for d in remaining if d not in under_50]
    
    over_3299_single = random.sample(remaining, 4)
    remaining = [d for d in remaining if d not in over_3299_single]
    
    multi_to_3299 = random.sample(remaining, 4)
    remaining = [d for d in remaining if d not in multi_to_3299]
    
    # Generate contributions
    base_date = datetime(2024, 1, 1)
    
    # 5 donors with exactly $3,300
    for donor in single_3300:
        contributions.append({
            **donor,
            'contribution_amount': '3300.00',
            'contribution_date': (base_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
            'contribution_number': '1'
        })
    
    # 25 donors under $50
    for donor in under_50:
        amount = round(random.uniform(10, 49.99), 2)
        contributions.append({
            **donor,
            'contribution_amount': f'{amount:.2f}',
            'contribution_date': (base_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
            'contribution_number': '1'
        })
    
    # 4 donors with single contribution over $3,299 but under $3,300
    for donor in over_3299_single:
        amount = round(random.uniform(3299.01, 3299.99), 2)
        contributions.append({
            **donor,
            'contribution_amount': f'{amount:.2f}',
            'contribution_date': (base_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
            'contribution_number': '1'
        })
    
    # 4 donors with multiple contributions totaling exactly $3,299
    for donor in multi_to_3299:
        amounts = []
        total = 0
        num_contributions = random.randint(2, 4)
        
        for i in range(num_contributions - 1):
            max_amount = min(1800, 3299 - total)
            amount = round(random.uniform(500, max_amount), 2)
            amounts.append(amount)
            total += amount
        
        # Last contribution to reach exactly 3299
        amounts.append(round(3299 - total, 2))
        
        for i, amount in enumerate(amounts):
            contributions.append({
                **donor,
                'contribution_amount': f'{amount:.2f}',
                'contribution_date': (base_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
                'contribution_number': str(i + 1)
            })
    
    # Fill remaining contributions to reach exactly 215 total
    # Use ALL remaining donors to ensure we have 150 unique donors total
    contributions_needed = 215 - len(contributions)
    
    # First, give each remaining donor at least one contribution
    for donor in remaining:
        if len(contributions) < 215:
            amount = round(random.uniform(100, 2000), 2)
            contributions.append({
                **donor,
                'contribution_amount': f'{amount:.2f}',
                'contribution_date': (base_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
                'contribution_number': '1'
            })
    
    # If we still need more contributions, add second contributions to some donors
    while len(contributions) < 215:
        # Pick random donors who can receive additional contributions
        eligible_donors = []
        for donor in all_donors:
            donor_contribs = [c for c in contributions if c['unique_id'] == donor['unique_id']]
            if donor_contribs:
                current_total = sum(float(c['contribution_amount']) for c in donor_contribs)
                if current_total < 3000:  # Leave room for additional contribution
                    eligible_donors.append(donor)
        
        if eligible_donors:
            donor = random.choice(eligible_donors)
            donor_contribs = [c for c in contributions if c['unique_id'] == donor['unique_id']]
            current_total = sum(float(c['contribution_amount']) for c in donor_contribs)
            max_additional = min(1000, 3300 - current_total)
            amount = round(random.uniform(50, max_additional), 2)
            
            contributions.append({
                **donor,
                'contribution_amount': f'{amount:.2f}',
                'contribution_date': (base_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
                'contribution_number': str(len(donor_contribs) + 1)
            })
        else:
            break
    
    # Sort by date
    contributions.sort(key=lambda x: x['contribution_date'])
    
    return contributions

def generate_kyc(prospects, donor_ids):
    """Generate KYC table with 139 Yes and 11 No, all donors pass"""
    kyc = []
    
    # Ensure all donors pass KYC
    donors_in_prospects = [p for p in prospects if p['unique_id'] in donor_ids]
    non_donors = [p for p in prospects if p['unique_id'] not in donor_ids]
    
    # All donors get Yes
    for donor in donors_in_prospects:
        kyc.append({
            'unique_id': donor['unique_id'],
            'first_name': donor['first_name'],
            'last_name': donor['last_name'],
            'kyc_status': 'Yes'
        })
    
    # Select 11 non-donors to fail KYC
    kyc_fail = random.sample(non_donors, min(11, len(non_donors)))
    kyc_pass = [p for p in non_donors if p not in kyc_fail]
    
    for prospect in kyc_fail:
        kyc.append({
            'unique_id': prospect['unique_id'],
            'first_name': prospect['first_name'],
            'last_name': prospect['last_name'],
            'kyc_status': 'No'
        })
    
    for prospect in kyc_pass:
        kyc.append({
            'unique_id': prospect['unique_id'],
            'first_name': prospect['first_name'],
            'last_name': prospect['last_name'],
            'kyc_status': 'Yes'
        })
    
    # Sort by unique_id for consistency
    kyc.sort(key=lambda x: x['unique_id'])
    
    return kyc

def save_csv(filename, data, fieldnames):
    """Save data to CSV file"""
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

def main():
    print("Generating clean campaign data...")
    
    # Generate data
    prospects = generate_prospects()
    print(f"✓ Generated {len(prospects)} unique prospects")
    
    donors = generate_donors(prospects)
    unique_donor_ids = list(set([d['unique_id'] for d in donors]))
    print(f"✓ Generated {len(unique_donor_ids)} unique donors with {len(donors)} contributions")
    
    # Get donor IDs that are also prospects
    prospect_ids = [p['unique_id'] for p in prospects]
    overlap = [did for did in unique_donor_ids if did in prospect_ids]
    print(f"✓ {len(overlap)} donors overlap with prospects")
    
    kyc = generate_kyc(prospects, unique_donor_ids)
    yes_count = sum(1 for k in kyc if k['kyc_status'] == 'Yes')
    no_count = sum(1 for k in kyc if k['kyc_status'] == 'No')
    print(f"✓ Generated KYC records: {yes_count} Yes, {no_count} No")
    
    # Save to CSV files
    save_csv('data/prospects.csv', prospects, 
             ['unique_id', 'first_name', 'last_name', 'phone_number', 'employer', 
              'occupation', 'address_line_1', 'address_line_2', 'city', 'state', 'zip', 'wallet_address'])
    
    save_csv('data/donors.csv', donors,
             ['unique_id', 'first_name', 'last_name', 'phone_number', 'employer',
              'occupation', 'address_line_1', 'address_line_2', 'city', 'state', 'zip', 
              'wallet_address', 'contribution_amount', 'contribution_date', 'contribution_number'])
    
    save_csv('data/kyc.csv', kyc,
             ['unique_id', 'first_name', 'last_name', 'kyc_status'])
    
    print("\n✓ All files saved successfully!")
    print("  - data/prospects.csv")
    print("  - data/donors.csv")
    print("  - data/kyc.csv")

if __name__ == "__main__":
    main()