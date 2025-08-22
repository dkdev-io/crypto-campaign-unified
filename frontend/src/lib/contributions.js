import { supabase } from './supabase';

class ContributionService {
  constructor() {
    this.FEC_LIMIT = 3300;
  }

  // Generate unique transaction code
  generateTransactionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TXN-';
    
    // First segment (8 chars)
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    code += '-';
    
    // Second segment (4 chars)
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return code;
  }

  // Calculate recurring donation projections
  calculateRecurringProjection(amount, frequency, startDate, endDate = null) {
    let totalAmount = 0;
    let paymentCount = 0;
    let currentDate = new Date(startDate);
    let willExceedLimit = false;
    let exceedDate = null;
    
    const maxDate = endDate ? new Date(endDate) : new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year max
    
    while (currentDate <= maxDate && totalAmount + amount <= this.FEC_LIMIT && paymentCount < 100) {
      totalAmount += amount;
      paymentCount++;
      
      if (totalAmount + amount > this.FEC_LIMIT && !exceedDate) {
        exceedDate = new Date(currentDate);
        willExceedLimit = true;
      }
      
      // Increment date based on frequency
      switch (frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'bi-weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'annually':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return {
      totalAmount,
      paymentCount,
      willExceedLimit,
      exceedDate,
      autoCancelDate: exceedDate
    };
  }

  // Check contribution limits
  async checkContributionLimits(campaignId, donorEmail, proposedAmount, isRecurring = false, recurringDetails = null) {
    try {
      // Get existing contribution limits (with graceful fallback if table doesn't exist)
      const { data: existingLimits, error: limitsError } = await supabase
        .from('contribution_limits')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('donor_email', donorEmail)
        .single();

      let currentTotal = 0;
      let remainingCapacity = this.FEC_LIMIT;
      
      // Handle case where table doesn't exist yet (graceful fallback)
      if (limitsError && limitsError.code === 'PGRST116') {
        // Table doesn't exist or no record found - this is okay, just use defaults
        console.log('Contribution limits table not found, using defaults');
      } else if (existingLimits && !limitsError) {
        currentTotal = parseFloat(existingLimits.total_contributed || 0);
        remainingCapacity = this.FEC_LIMIT - currentTotal;
      }

      // Calculate projections for recurring donations
      let projection = null;
      if (isRecurring && recurringDetails) {
        projection = this.calculateRecurringProjection(
          proposedAmount,
          recurringDetails.frequency,
          recurringDetails.startDate,
          recurringDetails.endDate
        );
      }

      const immediateAmountAllowed = proposedAmount <= remainingCapacity;
      const totalProjectedAmount = currentTotal + (projection ? projection.totalAmount : proposedAmount);
      const willExceedLimit = totalProjectedAmount > this.FEC_LIMIT;

      return {
        canContribute: immediateAmountAllowed,
        currentTotal,
        remainingCapacity,
        proposedAmount,
        totalProjectedAmount,
        willExceedLimit,
        projection,
        message: immediateAmountAllowed 
          ? 'Contribution allowed' 
          : `Contribution exceeds remaining capacity of $${remainingCapacity.toFixed(2)}`
      };
    } catch (error) {
      console.error('Error checking contribution limits:', error);
      // If tables don't exist, allow contribution with defaults
      if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('Contribution tables not created yet, allowing contribution with defaults');
        return {
          canContribute: proposedAmount <= this.FEC_LIMIT,
          currentTotal: 0,
          remainingCapacity: this.FEC_LIMIT,
          proposedAmount,
          totalProjectedAmount: proposedAmount,
          willExceedLimit: false,
          projection: null,
          message: proposedAmount <= this.FEC_LIMIT ? 'Contribution allowed' : `Amount exceeds FEC limit of $${this.FEC_LIMIT}`
        };
      }
      return {
        canContribute: false,
        message: 'Error checking contribution limits',
        error: error.message
      };
    }
  }

  // Save contribution to database
  async saveContribution(contributionData) {
    try {
      const transactionCode = this.generateTransactionCode();
      
      // Prepare contribution record
      const contribution = {
        ...contributionData,
        transaction_code: transactionCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to save to new contributions table first
      const { data, error } = await supabase
        .from('contributions')
        .insert([contribution])
        .select()
        .single();

      if (error) {
        // If table doesn't exist, fall back to old form_submissions table
        if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log('New contributions table not found, falling back to form_submissions table');
          
          const fallbackData = {
            campaign_id: contributionData.campaign_id,
            donor_full_name: contributionData.donor_full_name,
            donor_email: contributionData.donor_email,
            donor_phone: contributionData.donor_phone,
            donor_street: contributionData.donor_street,
            donor_city: contributionData.donor_city,
            donor_state: contributionData.donor_state,
            donor_zip: contributionData.donor_zip,
            donor_employer: contributionData.donor_employer,
            donor_occupation: contributionData.donor_occupation,
            amount_usd: contributionData.amount_usd,
            cryptocurrency: contributionData.cryptocurrency || 'N/A',
            crypto_amount: contributionData.crypto_amount || 0,
            wallet_address: contributionData.wallet_address || 'N/A',
            transaction_hash: contributionData.transaction_hash || null,
            citizenship_confirmed: contributionData.citizenship_confirmed || false,
            own_funds_confirmed: contributionData.own_funds_confirmed || false,
            not_corporate_confirmed: true,
            not_contractor_confirmed: contributionData.not_contractor_confirmed || false,
            age_confirmed: contributionData.age_confirmed || false
          };
          
          const { data: fallbackResult, error: fallbackError } = await supabase
            .from('form_submissions')
            .insert([fallbackData])
            .select()
            .single();
          
          if (fallbackError) {
            throw fallbackError;
          }
          
          return {
            success: true,
            transactionCode,
            contributionId: fallbackResult.id,
            data: fallbackResult,
            fallbackMode: true
          };
        }
        throw error;
      }

      // Try to update contribution limits (skip if tables don't exist)
      try {
        await this.updateContributionLimits(
          contributionData.campaign_id,
          contributionData.donor_email,
          contributionData.donor_full_name,
          contributionData.amount_usd,
          contributionData.donation_type === 'recurring' ? contributionData.recurring_projection : null
        );
      } catch (limitsError) {
        console.log('Contribution limits update skipped (table not found):', limitsError.message);
      }

      // Try to create recurring payment schedule (skip if tables don't exist)
      if (contributionData.donation_type === 'recurring' && contributionData.recurring_projection) {
        try {
          await this.createRecurringPaymentSchedule(
            data.id,
            contributionData.campaign_id,
            contributionData.recurring_amount,
            contributionData.recurring_frequency,
            contributionData.recurring_start_date,
            contributionData.recurring_projection.paymentCount
          );
        } catch (scheduleError) {
          console.log('Recurring payment schedule skipped (table not found):', scheduleError.message);
        }
      }

      return {
        success: true,
        transactionCode,
        contributionId: data.id,
        data
      };
    } catch (error) {
      console.error('Error saving contribution:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update contribution limits tracking
  async updateContributionLimits(campaignId, donorEmail, donorName, amount, recurringProjection = null) {
    try {
      // Check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from('contribution_limits')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('donor_email', donorEmail)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update existing record
        const newTotal = parseFloat(existing.total_contributed || 0) + amount;
        const newRemaining = this.FEC_LIMIT - newTotal;
        
        const updateData = {
          total_contributed: newTotal,
          remaining_capacity: newRemaining,
          last_contribution_date: new Date().toISOString(),
          contribution_count: (existing.contribution_count || 0) + 1,
          updated_at: new Date().toISOString()
        };

        if (recurringProjection) {
          updateData.projected_recurring_total = recurringProjection.totalAmount;
          updateData.projected_total = newTotal + recurringProjection.totalAmount;
          updateData.will_exceed_limit = recurringProjection.willExceedLimit;
          updateData.projected_exceed_date = recurringProjection.exceedDate;
        }

        await supabase
          .from('contribution_limits')
          .update(updateData)
          .eq('campaign_id', campaignId)
          .eq('donor_email', donorEmail);
      } else {
        // Create new record
        const insertData = {
          campaign_id: campaignId,
          donor_email: donorEmail,
          donor_full_name: donorName,
          total_contributed: amount,
          remaining_capacity: this.FEC_LIMIT - amount,
          first_contribution_date: new Date().toISOString(),
          last_contribution_date: new Date().toISOString(),
          contribution_count: 1
        };

        if (recurringProjection) {
          insertData.projected_recurring_total = recurringProjection.totalAmount;
          insertData.projected_total = amount + recurringProjection.totalAmount;
          insertData.will_exceed_limit = recurringProjection.willExceedLimit;
          insertData.projected_exceed_date = recurringProjection.exceedDate;
        }

        await supabase
          .from('contribution_limits')
          .insert([insertData]);
      }
    } catch (error) {
      console.error('Error updating contribution limits:', error);
      throw error;
    }
  }

  // Create recurring payment schedule
  async createRecurringPaymentSchedule(parentContributionId, campaignId, amount, frequency, startDate, paymentCount) {
    try {
      const payments = [];
      let currentDate = new Date(startDate);
      
      for (let i = 1; i <= paymentCount; i++) {
        payments.push({
          parent_contribution_id: parentContributionId,
          campaign_id: campaignId,
          payment_number: i,
          amount_usd: amount,
          scheduled_date: new Date(currentDate).toISOString().split('T')[0],
          status: 'scheduled',
          created_at: new Date().toISOString()
        });
        
        // Increment date based on frequency
        switch (frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'bi-weekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'annually':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        }
      }
      
      const { error } = await supabase
        .from('recurring_payments')
        .insert(payments);
      
      if (error) {
        throw error;
      }
      
      return { success: true, scheduledPayments: payments.length };
    } catch (error) {
      console.error('Error creating recurring payment schedule:', error);
      throw error;
    }
  }

  // Get contribution by transaction code
  async getContributionByTransactionCode(transactionCode) {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .eq('transaction_code', transactionCode)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching contribution:', error);
      return null;
    }
  }

  // Get recurring payment schedule
  async getRecurringSchedule(parentContributionId) {
    try {
      const { data, error } = await supabase
        .from('recurring_payments')
        .select('*')
        .eq('parent_contribution_id', parentContributionId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching recurring schedule:', error);
      return [];
    }
  }
}

export const contributionService = new ContributionService();
export default contributionService;