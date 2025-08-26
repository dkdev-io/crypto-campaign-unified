import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {
  constructor() {
    this.client = supabase;
  }

  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('campaigns')
        .select('count', { count: 'exact' })
        .limit(1);
      
      return { success: !error, error: error?.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createCampaign(campaignData) {
    const { data, error } = await this.client
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCampaign(id) {
    const { data, error } = await this.client
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCampaign(id, updateData) {
    const { data, error } = await this.client
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getContributions(campaignId, limit = 50, offset = 0) {
    const { data, error } = await this.client
      .from('form_submissions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async createKYCRecord(kycData) {
    const { data, error } = await this.client
      .from('kyc_verifications')
      .insert([kycData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getKYCStatus(walletAddress) {
    const { data, error } = await this.client
      .from('kyc_verifications')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export default new SupabaseService();