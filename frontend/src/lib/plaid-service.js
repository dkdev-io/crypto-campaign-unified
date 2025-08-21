// Plaid Integration Service
// Handles bank account connection and verification

import { supabase } from './supabase.js';

class PlaidService {
  constructor(publicKey = null, environment = 'sandbox') {
    this.publicKey = publicKey;
    this.environment = environment;
    this.linkHandler = null;
  }

  /**
   * Initialize Plaid Link
   */
  async initializePlaidLink(campaignId, userEmail) {
    try {
      // Check if Plaid script is loaded
      if (typeof window.Plaid === 'undefined') {
        throw new Error('Plaid SDK not loaded. Please include the Plaid script.');
      }

      // Get link token from backend
      const linkToken = await this.getLinkToken(campaignId, userEmail);

      const config = {
        token: linkToken,
        onSuccess: (publicToken, metadata) => {
          this.handleLinkSuccess(publicToken, metadata, campaignId);
        },
        onExit: (err, metadata) => {
          this.handleLinkExit(err, metadata);
        },
        onEvent: (eventName, metadata) => {
          this.handleLinkEvent(eventName, metadata);
        }
      };

      this.linkHandler = window.Plaid.create(config);
      return this.linkHandler;

    } catch (error) {
      console.error('Plaid Link initialization error:', error);
      throw error;
    }
  }

  /**
   * Get link token from backend (you'll need to implement this endpoint)
   */
  async getLinkToken(campaignId, userEmail) {
    try {
      // In a real implementation, you'd call your backend API
      // For now, return a placeholder that shows the structure needed
      
      // This would be your backend endpoint:
      // const response = await fetch('/api/plaid/create-link-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ campaignId, userEmail })
      // });
      
      // For development, throw an error with instructions
      throw new Error(`
        Plaid backend integration required. 
        
        To implement:
        1. Create a backend endpoint: POST /api/plaid/create-link-token
        2. Use Plaid server SDK to create link token
        3. Return { link_token: "link-sandbox-..." }
        
        Campaign ID: ${campaignId}
        User Email: ${userEmail}
      `);

    } catch (error) {
      console.error('Get link token error:', error);
      throw error;
    }
  }

  /**
   * Handle successful bank account link
   */
  async handleLinkSuccess(publicToken, metadata, campaignId) {
    try {
      console.log('Plaid Link success:', { publicToken, metadata });

      // Exchange public token for access token (backend call needed)
      const { accessToken, accountId } = await this.exchangePublicToken(
        publicToken, 
        campaignId
      );

      // Store encrypted access token in database
      await this.storeAccessToken(campaignId, accessToken, accountId, metadata);

      // Update campaign with bank verification status
      await this.updateCampaignBankStatus(campaignId, {
        bank_account_verified: true,
        bank_account_name: metadata.account.name,
        bank_last_four: metadata.account.mask,
        plaid_account_id: accountId
      });

      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('plaidLinkSuccess', {
        detail: {
          campaignId,
          accountId,
          accountName: metadata.account.name,
          institutionName: metadata.institution.name,
          lastFour: metadata.account.mask
        }
      }));

      return {
        success: true,
        accountId,
        accountName: metadata.account.name,
        institutionName: metadata.institution.name
      };

    } catch (error) {
      console.error('Handle link success error:', error);
      throw error;
    }
  }

  /**
   * Exchange public token for access token (backend call)
   */
  async exchangePublicToken(publicToken, campaignId) {
    try {
      // This would be your backend endpoint:
      // const response = await fetch('/api/plaid/exchange-public-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ publicToken, campaignId })
      // });
      
      // For development, return mock data
      console.log('Would exchange public token:', publicToken);
      
      return {
        accessToken: 'access-sandbox-mock-token',
        accountId: 'account-mock-id-' + Date.now()
      };

    } catch (error) {
      console.error('Exchange public token error:', error);
      throw error;
    }
  }

  /**
   * Store encrypted access token in database
   */
  async storeAccessToken(campaignId, accessToken, accountId, metadata) {
    try {
      // In production, access token should be encrypted before storage
      const { data, error } = await supabase
        .from('plaid_tokens')
        .upsert({
          campaign_id: campaignId,
          access_token_encrypted: this.encryptToken(accessToken), // Implement encryption
          account_id: accountId,
          institution_name: metadata.institution?.name,
          account_name: metadata.account?.name,
          account_type: metadata.account?.type,
          account_subtype: metadata.account?.subtype,
          last_four: metadata.account?.mask,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Plaid token stored successfully:', data.id);
      return data;

    } catch (error) {
      console.error('Store access token error:', error);
      throw error;
    }
  }

  /**
   * Update campaign with bank account verification status
   */
  async updateCampaignBankStatus(campaignId, bankData) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(bankData)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;

      console.log('Campaign bank status updated:', data);
      return data;

    } catch (error) {
      console.error('Update campaign bank status error:', error);
      throw error;
    }
  }

  /**
   * Handle Plaid Link exit
   */
  handleLinkExit(err, metadata) {
    console.log('Plaid Link exit:', { err, metadata });
    
    if (err != null) {
      console.error('Plaid Link exit error:', err);
    }

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('plaidLinkExit', {
      detail: { error: err, metadata }
    }));
  }

  /**
   * Handle Plaid Link events
   */
  handleLinkEvent(eventName, metadata) {
    console.log('Plaid Link event:', eventName, metadata);
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('plaidLinkEvent', {
      detail: { eventName, metadata }
    }));
  }

  /**
   * Open Plaid Link modal
   */
  openLink() {
    if (this.linkHandler) {
      this.linkHandler.open();
    } else {
      throw new Error('Plaid Link not initialized');
    }
  }

  /**
   * Get bank account info for campaign
   */
  async getBankAccountInfo(campaignId) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          bank_account_verified,
          bank_account_name,
          bank_last_four,
          plaid_account_id,
          plaid_tokens (
            institution_name,
            account_name,
            account_type,
            account_subtype,
            last_four,
            created_at
          )
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      return {
        isVerified: data.bank_account_verified,
        accountName: data.bank_account_name,
        lastFour: data.bank_last_four,
        accountId: data.plaid_account_id,
        details: data.plaid_tokens?.[0] || null
      };

    } catch (error) {
      console.error('Get bank account info error:', error);
      throw error;
    }
  }

  /**
   * Remove bank account connection
   */
  async removeBankAccount(campaignId) {
    try {
      // Deactivate Plaid tokens
      const { error: tokenError } = await supabase
        .from('plaid_tokens')
        .update({ is_active: false })
        .eq('campaign_id', campaignId);

      if (tokenError) throw tokenError;

      // Update campaign
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          bank_account_verified: false,
          bank_account_name: null,
          bank_last_four: null,
          plaid_account_id: null,
          plaid_access_token: null
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;

      // In production, also revoke access token via Plaid API
      // await this.revokeAccessToken(campaignId);

      return { success: true, campaign: data };

    } catch (error) {
      console.error('Remove bank account error:', error);
      throw error;
    }
  }

  /**
   * Simple encryption for demo (use proper encryption in production)
   */
  encryptToken(token) {
    // In production, use proper encryption like AES-256
    // For demo purposes, just base64 encode
    return btoa(token);
  }

  /**
   * Simple decryption for demo (use proper decryption in production)
   */
  decryptToken(encryptedToken) {
    // In production, use proper decryption
    // For demo purposes, just base64 decode
    try {
      return atob(encryptedToken);
    } catch (error) {
      console.error('Token decryption error:', error);
      return null;
    }
  }

  /**
   * Load Plaid script dynamically
   */
  static loadPlaidScript() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window.Plaid !== 'undefined') {
        resolve();
        return;
      }

      // Create script tag
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Plaid script loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Plaid script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Check if Plaid is available
   */
  static isPlaidAvailable() {
    return typeof window !== 'undefined' && typeof window.Plaid !== 'undefined';
  }
}

// Export singleton instance
export const plaidService = new PlaidService();

// Export class for custom instances
export { PlaidService };

// Helper function to initialize with API key
export const initializePlaidService = (publicKey, environment = 'sandbox') => {
  return new PlaidService(publicKey, environment);
};