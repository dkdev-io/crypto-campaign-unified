# New Campaign Setup Flow Guide

## Overview

The new campaign setup flow has been redesigned to simplify the process and collect required FEC compliance information. The flow now consists of 5 streamlined screens instead of the previous 6.

## Flow Screens

### Screen 1: User Information

**Route:** `/` (Step 1/5)
**File:** `frontend/src/components/setup/Signup.jsx`

**Collects:**

- User's full name (person setting up the campaign)
- User's email address
- Campaign name
- Committee name or search term

**Required Fields:** All fields are required

**Next:** Proceeds to committee search

### Screen 2: Committee Search & Verification

**Route:** `/` (Step 2/5)
**File:** `frontend/src/components/setup/CommitteeSearch.jsx`

**Features:**

- Search FEC committees using the FEC API integration
- Display both real FEC committees and test committees
- Show committee validation against ActBlue requirements
- Committee selection with detailed information display

**Requirements:**

- Must select a valid committee
- Committee must pass ActBlue validation checks

**Next:** Proceeds to bank account connection

### Screen 3: Bank Account Connection

**Route:** `/` (Step 3/5)
**File:** `frontend/src/components/setup/BankConnection.jsx`

**Features:**

- Secure bank connection via Plaid API
- Account verification and information display
- Development mode skip option
- Security information and flow explanation

**Requirements:**

- Bank account connection (can be skipped in development)
- Account verification through Plaid

**Next:** Proceeds to terms agreement

### Screen 4: Terms & Conditions Agreement

**Route:** `/` (Step 4/5)
**File:** `frontend/src/components/setup/TermsAgreement.jsx`

**Features:**

- Terms of Service agreement (with Lorem Ipsum placeholder)
- Privacy Policy agreement
- FEC Compliance agreement
- Setup summary display
- Launch button (only enabled when all terms accepted)

**Requirements:**

- Must accept all three agreements
- Terms acceptance is recorded with timestamp

**Next:** Proceeds to embed code generation

### Screen 5: Embed Code & Launch

**Route:** `/` (Step 5/5)
**File:** `frontend/src/components/setup/EmbedCode.jsx`

**Features:**

- Automatic embed code generation
- Copy-to-clipboard functionality
- Test form link
- Setup completion celebration
- Implementation instructions
- Next steps guidance

**Completion:**

- Campaign marked as setup complete
- Embed code generated and stored
- Ready for contribution collection

## Database Schema

### New Tables Created

1. **fec_committees** - Stores FEC committee data
2. **committee_test_data** - Test committees for development
3. **plaid_tokens** - Secure Plaid token storage

### Updated Campaigns Table

New fields added:

- `user_full_name` - Person setting up the campaign
- `fec_committee_id` - Reference to FEC committee
- `committee_confirmed` - Committee verification status
- `plaid_access_token` - Plaid access token
- `plaid_account_id` - Plaid account identifier
- `bank_account_verified` - Bank verification status
- `bank_account_name` - Bank account name
- `bank_last_four` - Last 4 digits of account
- `terms_accepted` - Terms acceptance status
- `terms_accepted_at` - Terms acceptance timestamp
- `terms_ip_address` - IP address of acceptance
- `setup_step` - Current setup step
- `setup_completed` - Setup completion status
- `setup_completed_at` - Setup completion timestamp
- `embed_code` - Generated embed code
- `embed_generated_at` - Embed code generation timestamp

## API Integration

### FEC API Service

**File:** `frontend/src/lib/fec-api.js`

**Features:**

- Committee search (local database first, then FEC API)
- Committee details retrieval
- ActBlue validation
- Test committee management

### Plaid Service

**File:** `frontend/src/lib/plaid-service.js`

**Features:**

- Plaid Link initialization
- Bank account connection
- Token exchange and storage
- Account information retrieval

## Admin Interface

### Committee Manager

**Route:** `/committees`
**File:** `frontend/src/components/admin/CommitteeManager.jsx`

**Features:**

- Add test committees for development
- View existing test committees
- Committee management for testing

**Access:** Available via admin panel or directly at `/committees`

## Setup Requirements

### Database Setup

1. **Run the FEC committees schema:**

   ```bash
   # Execute the SQL file in Supabase
   cat docs/fec-committees-schema.sql
   ```

2. **Verify tables are created:**
   - `fec_committees`
   - `committee_test_data`
   - `plaid_tokens`
   - Updated `campaigns` table

### API Keys (Optional)

1. **FEC API Key:**
   - Sign up at https://api.open.fec.gov/developers
   - Initialize FEC service: `initializeFECAPI(your_api_key)`
   - Without API key, only local/test committees available

2. **Plaid API Keys:**
   - Sign up at https://dashboard.plaid.com
   - Implement backend endpoints for token exchange
   - For development, bank connection can be skipped

## Testing

### Test Committees

Sample test committees are automatically created:

- "Test Campaign Committee"
- "Sample PAC Committee"
- "Demo Candidate Committee"

Add more via `/committees` admin panel.

### Test Flow

1. Go to `/` to start setup
2. Fill in user information
3. Search for "Test" to find test committees
4. Select a test committee
5. Skip bank connection (dev mode)
6. Accept all terms
7. Get embed code

## Development Notes

### Backend Requirements

For full functionality, implement these backend endpoints:

1. **Plaid Integration:**
   - `POST /api/plaid/create-link-token`
   - `POST /api/plaid/exchange-public-token`

2. **FEC API Integration:**
   - Optional: Direct FEC API calls from backend
   - Alternative: Client-side calls (current implementation)

### Security Considerations

1. **Plaid Tokens:** Should be encrypted before database storage
2. **API Keys:** Store securely, not in client-side code
3. **Terms IP:** Collect real IP address in production
4. **FEC Data:** Regular updates from FEC API

### Customization

1. **Terms Content:** Replace Lorem Ipsum with real legal content
2. **Styling:** Customize theme colors and branding
3. **Validation:** Add additional committee validation rules
4. **Flow:** Add/remove steps as needed

## Migration from Old Flow

### Component Mapping

Old → New:

- `Signup.jsx` → Enhanced with committee search term
- `CampaignInfo.jsx` → Replaced by `CommitteeSearch.jsx`
- `Compliance.jsx` → Replaced by `BankConnection.jsx`
- `FormCustomization.jsx` → Removed (moved to admin)
- `EmbedOptions.jsx` → Replaced by `TermsAgreement.jsx`
- `LaunchConfirmation.jsx` → Replaced by `EmbedCode.jsx`

### Data Migration

Existing campaigns will need:

1. Database schema updates applied
2. New required fields populated
3. Setup steps recalculated

## Support & Troubleshooting

### Common Issues

1. **Committee Search Returns No Results:**
   - Add test committees via `/committees`
   - Check FEC API key configuration
   - Verify database connection

2. **Bank Connection Fails:**
   - Implement Plaid backend endpoints
   - Or skip for development using dev mode

3. **Embed Code Generation Fails:**
   - Check Supabase function exists
   - Verify campaign ID is valid
   - Falls back to client-side generation

### Debug Routes

- `/debug` - Campaign debug information
- `/admin` - Campaign management
- `/committees` - Committee management
- `/supabase-check` - Database connection check

## Next Steps

1. **Apply database schema** using provided SQL files
2. **Test the new flow** with sample data
3. **Customize terms content** for production
4. **Implement backend endpoints** for full functionality
5. **Add real FEC data** via API integration
6. **Configure production APIs** (FEC, Plaid)
7. **Test compliance workflow** end-to-end

The new flow provides a much more streamlined experience while collecting all necessary FEC compliance information and integrating with required third-party services.
