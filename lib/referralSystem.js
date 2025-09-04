import { createClient } from '@supabase/supabase-js';

// Supabase configuration - use environment variables for production
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Core Referral System for Crypto Political Donations
 * Handles donor creation, referral code generation, donation tracking, and analytics
 */
export class ReferralSystem {
  
  /**
   * Generate a unique referral code based on donor name
   * Uses the database function for collision detection
   * @param {string} donorName - The name of the donor
   * @returns {Promise<string>} - Unique referral code
   */
  async generateReferralCode(donorName) {
    try {
      const { data, error } = await supabase.rpc('generate_unique_referral_code', {
        donor_name: donorName
      });
      
      if (error) {
        console.error('Error generating referral code:', error);
        throw new Error(`Failed to generate referral code: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in generateReferralCode:', error);
      throw error;
    }
  }

  /**
   * Create or retrieve a donor record
   * @param {Object} donorData - Donor information
   * @param {string} donorData.email - Donor's email
   * @param {string} donorData.name - Donor's full name  
   * @param {string} [donorData.walletAddress] - Donor's crypto wallet address
   * @param {string} [donorData.phone] - Donor's phone number
   * @returns {Promise<Object>} - Donor record with referral code
   */
  async createOrGetDonor({ email, name, walletAddress, phone }) {
    try {
      // First, check if donor exists by email
      const { data: existingDonor, error: findError } = await supabase
        .from('donors')
        .select('*')
        .eq('email', email)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error finding donor:', findError);
        throw new Error(`Failed to find donor: ${findError.message}`);
      }

      // If donor exists, update wallet address if provided and return
      if (existingDonor) {
        if (walletAddress && existingDonor.wallet_address !== walletAddress) {
          const { data: updatedDonor, error: updateError } = await supabase
            .from('donors')
            .update({ 
              wallet_address: walletAddress,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDonor.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating donor wallet:', updateError);
            throw new Error(`Failed to update donor wallet: ${updateError.message}`);
          }
          
          return updatedDonor;
        }
        return existingDonor;
      }

      // Generate referral code for new donor
      const referralCode = await this.generateReferralCode(name);

      // Create new donor record
      const donorRecord = {
        email,
        full_name: name,
        phone: phone || null,
        wallet_address: walletAddress || null,
        referral_code: referralCode,
        donor_type: 'individual',
        email_verified: true,
        is_active: true
      };

      const { data: newDonor, error: createError } = await supabase
        .from('donors')
        .insert([donorRecord])
        .select()
        .single();

      if (createError) {
        console.error('Error creating donor:', createError);
        throw new Error(`Failed to create donor: ${createError.message}`);
      }

      return newDonor;
    } catch (error) {
      console.error('Error in createOrGetDonor:', error);
      throw error;
    }
  }

  /**
   * Validate a referral code and return donor information
   * @param {string} code - The referral code to validate
   * @returns {Promise<Object>} - Validation result with donor info
   */
  async validateReferralCode(code) {
    try {
      if (!code || typeof code !== 'string') {
        return { isValid: false, donor: null };
      }

      const { data, error } = await supabase
        .rpc('validate_referral_code', { code: code.toUpperCase() });

      if (error) {
        console.error('Error validating referral code:', error);
        throw new Error(`Failed to validate referral code: ${error.message}`);
      }

      const result = data?.[0];
      return {
        isValid: result?.is_valid || false,
        donor: result?.is_valid ? {
          id: result.donor_id,
          name: result.donor_name
        } : null
      };
    } catch (error) {
      console.error('Error in validateReferralCode:', error);
      throw error;
    }
  }

  /**
   * Record a donation with referral attribution
   * @param {Object} donationData - Donation information
   * @param {Object} donationData.donorData - Donor information
   * @param {string} donationData.candidateId - UUID of candidate/campaign
   * @param {string} donationData.amount - Donation amount (as string for precision)
   * @param {string} [donationData.transactionHash] - Blockchain transaction hash
   * @param {string} [donationData.referralCode] - Referral code used
   * @param {string} [donationData.network] - Blockchain network (default: ethereum)
   * @param {string} [donationData.currency] - Currency used (default: ETH)
   * @returns {Promise<Object>} - Created donation record
   */
  async recordDonation({ donorData, candidateId, amount, transactionHash, referralCode, network = 'ethereum', currency = 'ETH' }) {
    try {
      // Ensure we have a donor record
      const donor = await this.createOrGetDonor(donorData);

      // Validate referral code if provided
      let referrerId = null;
      if (referralCode) {
        const validation = await this.validateReferralCode(referralCode);
        if (validation.isValid) {
          referrerId = validation.donor.id;
        }
      }

      // Create donation record
      const donationRecord = {
        donor_id: donor.id,
        candidate_id: candidateId, // This references campaigns table for now
        amount: amount,
        currency: currency,
        crypto_currency: currency,
        transaction_hash: transactionHash || null,
        status: transactionHash ? 'pending' : 'pending',
        referrer_id: referrerId,
        referral_code: referralCode || null,
        network: network,
        donation_date: new Date().toISOString(),
        metadata: {
          network: network,
          currency: currency,
          referral_attributed: !!referrerId
        }
      };

      const { data: newDonation, error: createError } = await supabase
        .from('donations')
        .insert([donationRecord])
        .select()
        .single();

      if (createError) {
        console.error('Error creating donation:', createError);
        throw new Error(`Failed to record donation: ${createError.message}`);
      }

      return newDonation;
    } catch (error) {
      console.error('Error in recordDonation:', error);
      throw error;
    }
  }

  /**
   * Get referral statistics for a donor
   * @param {string} donorId - UUID of the donor
   * @returns {Promise<Object>} - Referral statistics
   */
  async getReferralStats(donorId) {
    try {
      const { data, error } = await supabase
        .from('referral_stats')
        .select('*')
        .eq('donor_id', donorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching referral stats:', error);
        throw new Error(`Failed to get referral stats: ${error.message}`);
      }

      // If no stats found, return empty stats
      if (!data) {
        const { data: donor } = await supabase
          .from('donors')
          .select('id, full_name, email, referral_code')
          .eq('id', donorId)
          .single();

        return {
          donor_id: donorId,
          donor_name: donor?.full_name || '',
          donor_email: donor?.email || '',
          referral_code: donor?.referral_code || '',
          total_referrals: 0,
          total_raised_confirmed: '0',
          total_raised_all: '0',
          confirmed_referrals: 0,
          pending_referrals: 0,
          failed_referrals: 0,
          last_referral_date: null,
          donor_created_at: donor?.created_at || null
        };
      }

      return data;
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      throw error;
    }
  }

  /**
   * Get list of active candidates/campaigns
   * @returns {Promise<Array>} - Array of active candidates
   */
  async getCandidates() {
    try {
      // First check if we have any candidates in the candidates table
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (candidatesError && candidatesError.code !== 'PGRST116') {
        console.error('Error fetching candidates:', candidatesError);
      }

      // If we have candidates, return them
      if (candidates && candidates.length > 0) {
        return candidates;
      }

      // Fallback to campaigns table for compatibility
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (campaignError) {
        console.error('Error fetching campaigns:', campaignError);
        throw new Error(`Failed to get candidates: ${campaignError.message}`);
      }

      // Transform campaigns to candidate format
      return (campaigns || []).map(campaign => ({
        id: campaign.id,
        name: campaign.title,
        description: campaign.description,
        wallet_address: campaign.wallet_address,
        campaign_goal: campaign.goal_amount,
        total_raised: campaign.current_amount,
        is_active: campaign.status === 'active',
        created_at: campaign.created_at,
        updated_at: campaign.updated_at
      }));

    } catch (error) {
      console.error('Error in getCandidates:', error);
      throw error;
    }
  }

  /**
   * Update donation status (e.g., when blockchain transaction is confirmed)
   * @param {string} donationId - UUID of the donation
   * @param {string} status - New status ('pending', 'completed', 'failed')
   * @param {Object} [additionalData] - Additional data to update
   * @returns {Promise<Object>} - Updated donation record
   */
  async updateDonationStatus(donationId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      if (status === 'completed') {
        updateData.confirmed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', donationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating donation status:', error);
        throw new Error(`Failed to update donation status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateDonationStatus:', error);
      throw error;
    }
  }

  /**
   * Get aggregate statistics for a donor (own donations + referrals)
   * @param {string} donorId - UUID of the donor
   * @returns {Promise<Object>} - Aggregate statistics
   */
  async getDonorAggregateStats(donorId) {
    try {
      const { data, error } = await supabase
        .from('donor_aggregate_stats')
        .select('*')
        .eq('donor_id', donorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching donor aggregate stats:', error);
        throw new Error(`Failed to get donor aggregate stats: ${error.message}`);
      }

      if (!data) {
        // Return empty stats if no data found
        const { data: donor } = await supabase
          .from('donors')
          .select('id, full_name, email, wallet_address, referral_code')
          .eq('id', donorId)
          .single();

        return {
          donor_id: donorId,
          donor_name: donor?.full_name || '',
          donor_email: donor?.email || '',
          wallet_address: donor?.wallet_address || '',
          referral_code: donor?.referral_code || '',
          own_donation_count: 0,
          own_donations_confirmed: '0',
          referral_count: 0,
          referral_amount_confirmed: '0',
          total_impact: '0',
          donor_created_at: donor?.created_at || null
        };
      }

      return data;
    } catch (error) {
      console.error('Error in getDonorAggregateStats:', error);
      throw error;
    }
  }
}

// Export a singleton instance for convenience
export const referralSystem = new ReferralSystem();

// Export individual methods for easier testing
export const {
  generateReferralCode,
  createOrGetDonor,
  validateReferralCode,
  recordDonation,
  getReferralStats,
  getCandidates,
  updateDonationStatus,
  getDonorAggregateStats
} = referralSystem;