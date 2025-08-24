# Form Testing Agent

Automated testing agent that uses your CSV test data to simulate real donor form submissions.

## Features

- **Realistic Test Data**: Uses actual personas from your CSV files
- **Form Automation**: Automatically fills and submits donation forms
- **Database Verification**: Confirms data was properly stored in Supabase
- **Multiple Test Modes**: Test donors, prospects, or mixed scenarios
- **Detailed Reporting**: Generates comprehensive test reports

## Setup

1. Install dependencies:
```bash
cd scripts
npm install
```

2. Set environment variables:
```bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-anon-key"
export BASE_URL="http://localhost:3000"  # Your frontend URL
```

## Usage

### Basic Testing
```bash
# Test 5 random personas
npm run test-forms

# Test 10 existing donors
npm run test-donors

# Test 10 prospects (non-donors)
npm run test-prospects

# Test 15 mixed personas
npm run test-mixed
```

### Advanced Options
```bash
# Custom test count
node form-testing-agent.js --count=20

# Test specific persona type
node form-testing-agent.js --type=donors --count=5

# Test different payment methods
node form-testing-agent.js --payment=traditional --count=3
```

## Test Modes

### `--type=donors`
- Tests existing donors from CSV data
- Uses their actual contribution amounts
- Validates repeat donor workflows

### `--type=prospects`
- Tests prospects who haven't donated yet
- Simulates new donor acquisition
- Tests first-time donor flows

### `--type=mixed`
- Random mix of donors and prospects
- Comprehensive end-to-end testing
- Realistic usage patterns

## What the Agent Tests

### Form Fields
- ✅ Personal information (name, email, phone)
- ✅ Address information (street, city, state, zip)
- ✅ Employment information (employer, occupation)
- ✅ Contribution amounts and payment methods
- ✅ Wallet addresses for crypto donations
- ✅ FEC compliance checkboxes

### Validation
- ✅ Form field validation rules
- ✅ FEC contribution limits
- ✅ Required field enforcement
- ✅ Payment method switching

### Database Integration
- ✅ Supabase form submission storage
- ✅ Data field mapping accuracy
- ✅ Transaction recording
- ✅ Timestamp validation

## Test Reports

The agent generates detailed reports in `test-results/`:

```json
{
  "testId": "test-BS2LMXM4-1703123456789",
  "persona": "James Powell",
  "uniqueId": "BS2LMXM4",
  "success": true,
  "duration": 3450,
  "submissionResult": {
    "success": true,
    "message": "Donation submitted successfully"
  },
  "dbVerification": {
    "success": true,
    "message": "Database entry verified",
    "verification": {
      "name": true,
      "address": true,
      "employer": true,
      "hasAmount": true
    },
    "dbEntry": "12345"
  },
  "timestamp": "2024-12-21T10:30:45.789Z"
}
```

## Personas Used

The agent automatically selects from your 150 test personas:

- **Real Contact Info**: Names, addresses, phone numbers
- **Employment Data**: Employers and occupations for FEC compliance
- **Contribution History**: Actual donation amounts and patterns
- **Wallet Addresses**: Valid crypto wallet addresses
- **KYC Status**: Approved/denied verification status

## Browser Control

- **Visual Mode**: Watch forms being filled in real-time
- **Headless Mode**: Fast automated testing
- **Slow Motion**: Step-by-step debugging
- **Screenshot Capture**: Error documentation

## Integration with Existing Tests

This agent complements your existing test suite:
- E2E tests validate user workflows
- Unit tests verify component logic
- Integration tests check API endpoints
- **Form Agent tests validate complete data flow**

## Troubleshooting

### Common Issues
1. **Form selectors not found**: Update CSS selectors in agent code
2. **Database connection**: Check Supabase credentials
3. **Timeout errors**: Increase wait times for slow forms
4. **Validation failures**: Check form validation rules match expectations

### Debug Mode
```bash
# Run with debug logging
DEBUG=1 node form-testing-agent.js --count=1
```

This agent ensures your donation forms work perfectly with real-world data patterns and user behaviors.