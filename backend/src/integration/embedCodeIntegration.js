/**
 * Integration point for existing embed code generation
 * Modifies the EmbedCode.jsx workflow to trigger donor page automation
 */

const donorPageAutomation = require('../services/donorPageAutomation');
const { triggerWebhooks } = require('../utils/webhookUtils');

/**
 * Enhanced embed code generation that triggers donor page creation
 * This replaces or enhances the existing generate_embed_code Supabase function
 */
async function generateEmbedCodeWithPageAutomation(campaignId, baseUrl) {
  try {
    console.log('🔄 Generating embed code with page automation for:', campaignId);

    // Get Supabase instance
    const { supabase } = require('../lib/supabase');
    
    // Get campaign data
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      throw new Error(`Failed to fetch campaign: ${campaignError.message}`);
    }

    if (!campaignData) {
      throw new Error('Campaign not found');
    }

    // Generate the embed code (existing logic)
    const embedCode = generateEmbedCodeHTML(campaignId, baseUrl);

    // Update campaign as setup completed (existing logic)
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        setup_completed: true,
        setup_completed_at: new Date().toISOString(),
        setup_step: 5,
        embed_code: embedCode
      })
      .eq('id', campaignId);

    if (updateError) {
      console.warn('Failed to update campaign setup status:', updateError);
      // Don't fail the whole process for this
    }

    // NEW: Trigger donor page automation
    try {
      console.log('🚀 Triggering donor page automation...');
      
      // Check if page already exists to avoid duplicates
      if (!campaignData.donor_page_generated) {
        const pageResult = await donorPageAutomation.triggerPageCreation(campaignData);
        console.log('✅ Donor page created:', pageResult.url);
        
        // Trigger webhooks for the completion event
        await triggerWebhooks(campaignId, 'setup.completed', {
          ...campaignData,
          embedCode,
          donorPageUrl: pageResult.url
        });
        
        // Return enhanced response with donor page info
        return {
          embedCode,
          donorPageUrl: pageResult.url,
          donorPageGenerated: true,
          setupCompleted: true
        };
      } else {
        console.log('ℹ️ Donor page already exists for campaign');
        return {
          embedCode,
          donorPageUrl: campaignData.donor_page_url,
          donorPageGenerated: true,
          setupCompleted: true
        };
      }
    } catch (pageError) {
      console.error('❌ Donor page automation failed:', pageError);
      
      // Return embed code anyway - the main functionality should still work
      return {
        embedCode,
        donorPageUrl: null,
        donorPageGenerated: false,
        donorPageError: pageError.message,
        setupCompleted: true
      };
    }

  } catch (error) {
    console.error('❌ Enhanced embed code generation failed:', error);
    throw error;
  }
}

/**
 * Generate the actual embed code HTML
 */
function generateEmbedCodeHTML(campaignId, baseUrl) {
  // Use production URL if baseUrl is localhost
  const embedBaseUrl = baseUrl && baseUrl.includes('localhost') ? 'https://cryptocampaign.netlify.app' : baseUrl;
  
  return `<!-- Campaign Contribution Form Embed -->
<div id="crypto-campaign-embed-${campaignId}"></div>
<script>
(function() {
    var iframe = document.createElement("iframe");
    iframe.src = "${embedBaseUrl}/embed-form.html?campaign=${campaignId}";
    iframe.width = "100%";
    iframe.height = "700";
    iframe.frameBorder = "0";
    iframe.style.border = "1px solid #ddd";
    iframe.style.borderRadius = "8px";
    iframe.style.backgroundColor = "white";
    document.getElementById("crypto-campaign-embed-${campaignId}").appendChild(iframe);
    
    // Auto-resize iframe based on content
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "resize" && event.data.campaignId === "${campaignId}") {
            iframe.height = event.data.height + "px";
        }
    });
    
    // Set a reasonable initial height
    setTimeout(function() {
        iframe.height = "700px";
    }, 1000);
    
    // Send loaded message for donor page automation
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'formLoaded',
            campaignId: '${campaignId}',
            source: 'embed-form'
        }, '*');
    }
})();
</script>`;
}

/**
 * API endpoint to replace the Supabase RPC function
 * POST /api/campaigns/:campaignId/generate-embed-code
 */
async function handleEmbedCodeGeneration(req, res) {
  try {
    const { campaignId } = req.params;
    const { baseUrl } = req.body;

    const finalBaseUrl = baseUrl || 
                        req.headers.origin || 
                        `${req.protocol}://${req.get('host')}`;

    console.log('📝 API: Generating embed code for campaign:', campaignId);

    const result = await generateEmbedCodeWithPageAutomation(campaignId, finalBaseUrl);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ API: Embed code generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      embedCode: null
    });
  }
}

/**
 * Middleware to intercept Supabase RPC calls and enhance them
 */
function interceptSupabaseEmbedGeneration(req, res, next) {
  // Check if this is a Supabase RPC call to generate_embed_code
  if (req.body && req.body.fn_name === 'generate_embed_code') {
    console.log('🔄 Intercepting Supabase embed code generation');
    
    const campaignId = req.body.args?.p_campaign_id;
    const baseUrl = req.body.args?.p_base_url;
    
    if (campaignId) {
      // Handle with our enhanced version
      req.params = { campaignId };
      req.body = { baseUrl };
      return handleEmbedCodeGeneration(req, res);
    }
  }
  
  // Continue to next middleware
  next();
}

/**
 * Webhook handler for form customization updates
 * Regenerates embed code and donor page when form settings change
 */
async function handleFormCustomizationWebhook(campaignId, changes) {
  try {
    console.log('🎨 Handling form customization webhook:', campaignId);

    // Get updated campaign data
    const { supabase } = require('../lib/supabase');
    const { data: campaignData, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error || !campaignData) {
      throw new Error('Campaign not found');
    }

    // Regenerate embed code with new settings
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const newEmbedCode = generateEmbedCodeHTML(campaignId, baseUrl);

    // Update embed code in database
    await supabase
      .from('campaigns')
      .update({
        embed_code: newEmbedCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Regenerate donor page with new settings
    const pageResult = await donorPageAutomation.syncPageFromWebhook(campaignId, {
      ...changes,
      embedCode: newEmbedCode
    });

    // Trigger webhooks
    await triggerWebhooks(campaignId, 'form.customized', {
      campaignId,
      changes,
      newEmbedCode,
      donorPageUrl: pageResult?.url
    });

    return {
      embedCode: newEmbedCode,
      donorPageUrl: pageResult?.url,
      updated: true
    };

  } catch (error) {
    console.error('❌ Form customization webhook failed:', error);
    throw error;
  }
}

/**
 * Update existing EmbedCode.jsx component to show donor page URL
 * This returns additional data that the frontend can display
 */
function enhanceEmbedCodeResponse(embedResult, campaignData) {
  const enhancement = {
    ...embedResult,
    
    // Add donor page information
    donorPage: {
      url: embedResult.donorPageUrl,
      generated: embedResult.donorPageGenerated,
      error: embedResult.donorPageError || null
    },
    
    // Add sharing information
    sharing: {
      directUrl: embedResult.donorPageUrl,
      embedCode: embedResult.embedCode,
      socialText: `Support ${campaignData.campaign_name} - Donate with cryptocurrency`,
      hashtags: ['CryptoDonations', 'PoliticalFundraising', campaignData.campaign_name.replace(/\s+/g, '')]
    },
    
    // Add next steps
    nextSteps: [
      {
        title: 'Share Your Donor Page',
        description: 'Direct supporters to your custom donor page',
        url: embedResult.donorPageUrl,
        icon: '🌐'
      },
      {
        title: 'Embed on Website',
        description: 'Add the form directly to your campaign website',
        action: 'copy_embed_code',
        icon: '📝'
      },
      {
        title: 'Monitor Donations',
        description: 'Track contributions in the admin panel',
        url: '/admin',
        icon: '📊'
      }
    ]
  };

  return enhancement;
}

module.exports = {
  generateEmbedCodeWithPageAutomation,
  generateEmbedCodeHTML,
  handleEmbedCodeGeneration,
  interceptSupabaseEmbedGeneration,
  handleFormCustomizationWebhook,
  enhanceEmbedCodeResponse
};