// FEC API Integration Service
// Handles communication with FEC API and local committee database

import { supabase } from './supabase.js';
import FEC_CONFIG from './fec-config.js';

class FECAPIService {
  constructor(apiKey = FEC_CONFIG.API_KEY) {
    this.apiKey = apiKey;
    this.config = FEC_CONFIG;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-Api-Key': apiKey } : {})
    };
  }

  /**
   * Search committees in local database first, then FEC API if needed
   */
  async searchCommittees(searchTerm, limit = 10) {
    try {
      // First search local database
      const localResults = await this.searchLocalCommittees(searchTerm, limit);
      
      if (localResults.length > 0) {
        console.log(`Found ${localResults.length} committees in local database`);
        return {
          source: 'local',
          committees: localResults,
          total: localResults.length
        };
      }

      // If no local results and FEC API key available, search FEC
      if (this.apiKey) {
        console.log('Searching FEC API with key configured...');
        const fecResults = await this.searchFECAPI(searchTerm, limit);
        return {
          source: 'fec',
          committees: fecResults.committees,
          total: fecResults.total
        };
      }

      return {
        source: 'local',
        committees: [],
        total: 0,
        message: 'No committees found locally. FEC API search available with configured key.'
      };

    } catch (error) {
      console.error('Committee search error:', error);
      throw new Error('Failed to search committees. Please try again.');
    }
  }

  /**
   * Search local Supabase committee database (using campaigns table for now)
   */
  async searchLocalCommittees(searchTerm, limit = 10) {
    try {
      // Search campaigns table for test committee
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .ilike('campaign_name', `%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      return data.map(campaign => ({
        id: `CAMPAIGN_${campaign.id}`,
        name: campaign.campaign_name,
        candidateName: null, // Not available in campaigns table
        type: 'TEST',
        organizationType: 'Test Campaign',
        city: null,
        state: null,
        isActive: true,
        source: 'test',
        testPurpose: 'Created via campaigns table for testing'
      }));

    } catch (error) {
      console.error('Local committee search error:', error);
      return [];
    }
  }

  /**
   * Search FEC API directly
   */
  async searchFECAPI(searchTerm, limit = 10) {
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        per_page: limit.toString(),
        ...this.config.DEFAULT_PARAMS
      });

      const url = `${this.config.BASE_URL}${this.config.ENDPOINTS.COMMITTEES}?${params}`;
      console.log('FEC API Request:', url);

      const response = await fetch(url, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`FEC API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        committees: data.results.map(committee => ({
          id: committee.committee_id,
          name: committee.name,
          candidateName: committee.candidate_ids?.[0] || null,
          type: committee.committee_type,
          organizationType: committee.organization_type,
          city: committee.city,
          state: committee.state,
          treasurerName: committee.treasurer_name,
          isActive: true,
          source: 'fec'
        })),
        total: data.pagination.count
      };

    } catch (error) {
      console.error('FEC API search error:', error);
      throw error;
    }
  }

  /**
   * Get detailed committee information
   */
  async getCommitteeDetails(committeeId, source = 'local') {
    try {
      if (source === 'local') {
        const { data, error } = await supabase
          .from('fec_committees')
          .select('*')
          .eq('fec_committee_id', committeeId)
          .single();

        if (error) throw error;
        return this.formatCommitteeDetails(data);
      }

      // Get from FEC API
      if (this.apiKey) {
        const url = `${this.config.BASE_URL}${this.config.ENDPOINTS.COMMITTEE_DETAILS}${committeeId}/`;
        console.log('FEC API Committee Details Request:', url);
        
        const response = await fetch(url, {
          headers: this.headers
        });

        if (!response.ok) {
          throw new Error(`FEC API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('FEC Committee Details Response:', data);
        return this.formatCommitteeDetails(data.results[0], 'fec');
      }

      throw new Error('Committee details not available');

    } catch (error) {
      console.error('Get committee details error:', error);
      throw error;
    }
  }

  /**
   * Sync committee from FEC API to local database
   */
  async syncCommitteeToLocal(committeeId) {
    try {
      if (!this.apiKey) {
        throw new Error('FEC API key required for syncing');
      }

      // Get detailed info from FEC
      const url = `${this.config.BASE_URL}${this.config.ENDPOINTS.COMMITTEE_DETAILS}${committeeId}/`;
      const response = await fetch(url, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`FEC API error: ${response.status}`);
      }

      const fecData = await response.json();
      const committee = fecData.results[0];

      // Insert/update in local database
      const { data, error } = await supabase
        .from('fec_committees')
        .upsert({
          fec_committee_id: committee.committee_id,
          committee_name: committee.name,
          committee_type: committee.committee_type,
          committee_designation: committee.designation,
          filing_frequency: committee.filing_frequency,
          organization_type: committee.organization_type,
          connected_organization_name: committee.connected_organization_name,
          candidate_name: committee.candidate_ids?.[0] || null,
          street_1: committee.street_1,
          street_2: committee.street_2,
          city: committee.city,
          state: committee.state,
          zip_code: committee.zip,
          treasurer_name: committee.treasurer_name,
          custodian_name: committee.custodian_name,
          is_active: true,
          last_fec_update: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Committee synced to local database:', data);
      return data;

    } catch (error) {
      console.error('Committee sync error:', error);
      throw error;
    }
  }

  /**
   * Format committee details for consistent structure
   */
  formatCommitteeDetails(committee, source = 'local') {
    if (!committee) return null;

    return {
      id: committee.fec_committee_id || committee.committee_id,
      name: committee.committee_name || committee.name,
      type: committee.committee_type,
      designation: committee.committee_designation || committee.designation,
      organizationType: committee.organization_type,
      candidateName: committee.candidate_name,
      candidateOffice: committee.candidate_office,
      candidateOfficeState: committee.candidate_office_state,
      candidateOfficeDistrict: committee.candidate_office_district,
      address: {
        street1: committee.street_1,
        street2: committee.street_2,
        city: committee.city,
        state: committee.state,
        zipCode: committee.zip_code || committee.zip
      },
      contacts: {
        treasurerName: committee.treasurer_name,
        custodianName: committee.custodian_name
      },
      filingFrequency: committee.filing_frequency,
      connectedOrganization: committee.connected_organization_name,
      isActive: committee.is_active !== false,
      lastUpdate: committee.last_fec_update || committee.updated_at,
      source
    };
  }

  /**
   * Validate committee information meets ActBlue requirements
   */
  validateCommitteeForActBlue(committeeDetails) {
    const errors = [];
    const warnings = [];

    // Required fields check
    if (!committeeDetails.name) {
      errors.push('Committee name is required');
    }

    if (!committeeDetails.id) {
      errors.push('FEC Committee ID is required');
    }

    if (!committeeDetails.treasurerName) {
      warnings.push('Treasurer name not available - may be required for compliance');
    }

    if (!committeeDetails.address?.street1) {
      errors.push('Committee address is required');
    }

    if (!committeeDetails.address?.city) {
      errors.push('Committee city is required');
    }

    if (!committeeDetails.address?.state) {
      errors.push('Committee state is required');
    }

    if (!committeeDetails.address?.zipCode) {
      errors.push('Committee ZIP code is required');
    }

    // Committee type validation
    if (committeeDetails.type && !['P', 'H', 'S', 'N', 'Q'].includes(committeeDetails.type)) {
      warnings.push('Unusual committee type - verify eligibility');
    }

    // Active status check
    if (!committeeDetails.isActive) {
      errors.push('Committee must be active to receive contributions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredFields: {
        committeeName: !!committeeDetails.name,
        committeeId: !!committeeDetails.id,
        treasurerName: !!committeeDetails.treasurerName,
        address: !!(committeeDetails.address?.street1 && 
                   committeeDetails.address?.city && 
                   committeeDetails.address?.state && 
                   committeeDetails.address?.zipCode),
        isActive: !!committeeDetails.isActive
      }
    };
  }

  /**
   * Get committee test data (for admin/testing)
   */
  async getTestCommittees() {
    try {
      const { data, error } = await supabase
        .from('committee_test_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(committee => ({
        id: `TEST_${committee.id}`,
        name: committee.committee_name,
        type: 'TEST',
        source: 'test',
        testPurpose: committee.test_purpose,
        addedBy: committee.added_by_email,
        createdAt: committee.created_at
      }));

    } catch (error) {
      console.error('Get test committees error:', error);
      return [];
    }
  }

  /**
   * Add test committee (admin only)
   */
  async addTestCommittee(committeeName, testPurpose, adminEmail) {
    try {
      const { data, error } = await supabase
        .from('committee_test_data')
        .insert({
          committee_name: committeeName,
          test_purpose: testPurpose,
          added_by_email: adminEmail
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        committee: {
          id: `TEST_${data.id}`,
          name: data.committee_name,
          type: 'TEST',
          source: 'test',
          testPurpose: data.test_purpose,
          addedBy: data.added_by_email,
          createdAt: data.created_at
        }
      };

    } catch (error) {
      console.error('Add test committee error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const fecAPI = new FECAPIService();

// Export class for custom instances with API key
export { FECAPIService };

// Helper function to initialize with API key
export const initializeFECAPI = (apiKey) => {
  return new FECAPIService(apiKey);
};