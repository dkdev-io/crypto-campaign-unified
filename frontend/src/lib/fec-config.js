// FEC API Configuration
// Store FEC API key and configuration settings

const FEC_CONFIG = {
  // Your FEC API key
  API_KEY: 'F7QA9sKDcXZOjuqz2nk7DzZXLenyzf3GEYaZqpFD',
  
  // FEC API base URL
  BASE_URL: 'https://api.open.fec.gov/v1',
  
  // API endpoints
  ENDPOINTS: {
    COMMITTEES: '/committees/',
    COMMITTEE_DETAILS: '/committee/',
    CANDIDATES: '/candidates/',
    FILINGS: '/filings/'
  },
  
  // Default search parameters
  DEFAULT_PARAMS: {
    per_page: 20,
    is_active: 'true',
    sort: 'name',
    sort_hide_null: 'false'
  },
  
  // Committee types mapping
  COMMITTEE_TYPES: {
    'P': 'Presidential',
    'H': 'House',
    'S': 'Senate',
    'N': 'PAC',
    'Q': 'Qualified Non-Profit',
    'O': 'Super PAC',
    'U': 'Single Candidate Independent Expenditure',
    'V': 'PAC with Non-Contribution Account - Nonqualified',
    'W': 'PAC with Non-Contribution Account - Qualified',
    'X': 'Party - Nonqualified',
    'Y': 'Party - Qualified',
    'Z': 'National Party Nonfederal Account'
  },
  
  // Committee designations
  DESIGNATIONS: {
    'A': 'Authorized by candidate',
    'J': 'Joint fundraiser',
    'P': 'Principal campaign committee',
    'U': 'Unauthorized',
    'B': 'Lobbyist/Registrant PAC',
    'D': 'Leadership PAC'
  },
  
  // Filing frequencies
  FILING_FREQUENCIES: {
    'A': 'Administratively terminated',
    'D': 'Debt',
    'M': 'Monthly filer',
    'Q': 'Quarterly filer',
    'T': 'Terminated',
    'W': 'Waived'
  }
};

export default FEC_CONFIG;