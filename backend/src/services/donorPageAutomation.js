/**
 * Donor Page Automation Service
 * Automatically generates /donors/[campaign-name] pages after form setup completion
 */

const fs = require('fs').promises;
const path = require('path');
const { supabase } = require('../lib/supabase');
const { generateSEOMetadata, sanitizeCampaignName } = require('../utils/seoUtils');
const { createWebhookForCampaign } = require('../utils/webhookUtils');

class DonorPageAutomationService {
  constructor() {
    this.pagesDirectory = path.join(__dirname, '../../public/donors');
    this.templatePath = path.join(__dirname, '../templates/donorPageTemplate.html');
    this.adminDirectory = path.join(__dirname, '../../admin/generated-pages');
  }

  /**
   * Main automation trigger - called when form setup completes
   */
  async triggerPageCreation(campaignData) {
    try {
      console.log('🚀 Triggering donor page automation for:', campaignData.campaign_name);
      
      // 1. Create page directory structure
      await this.ensureDirectories();
      
      // 2. Generate donor page
      const pageData = await this.generateDonorPage(campaignData);
      
      // 3. Set up webhooks for auto-sync
      await this.setupWebhooks(campaignData);
      
      // 4. Update campaign with page URL
      await this.updateCampaignWithPageUrl(campaignData.id, pageData.url);
      
      // 5. Add to admin management system
      await this.addToAdminDashboard(campaignData, pageData);
      
      console.log('✅ Donor page automation completed:', pageData.url);
      return pageData;
      
    } catch (error) {
      console.error('❌ Donor page automation failed:', error);
      await this.logError(campaignData.id, error);
      throw error;
    }
  }

  /**
   * Generate the actual donor page with embedded form
   */
  async generateDonorPage(campaignData) {
    const sanitizedName = sanitizeCampaignName(campaignData.campaign_name);
    const pagePath = path.join(this.pagesDirectory, `${sanitizedName}.html`);
    const pageUrl = `/donors/${sanitizedName}`;
    
    // Load template
    const template = await fs.readFile(this.templatePath, 'utf8');
    
    // Generate embed code
    const embedCode = await this.generateEmbedCode(campaignData.id);
    
    // Generate SEO metadata
    const seoData = generateSEOMetadata(campaignData);
    
    // Extract campaign styles for template replacement
    const campaignStyles = this.extractCampaignStylesForTemplate(campaignData);
    
    // Replace template variables with full style guide data
    const pageContent = template
      .replace(/\{\{CAMPAIGN_NAME\}\}/g, campaignData.campaign_name)
      .replace(/\{\{COMMITTEE_NAME\}\}/g, campaignData.committee_name)
      .replace(/\{\{EMBED_CODE\}\}/g, embedCode)
      .replace(/\{\{SEO_TITLE\}\}/g, seoData.title)
      .replace(/\{\{SEO_DESCRIPTION\}\}/g, seoData.description)
      .replace(/\{\{SEO_KEYWORDS\}\}/g, seoData.keywords)
      // Style guide replacements
      .replace(/\{\{PRIMARY_COLOR\}\}/g, campaignStyles.colors.primary)
      .replace(/\{\{SECONDARY_COLOR\}\}/g, campaignStyles.colors.secondary)
      .replace(/\{\{ACCENT_COLOR\}\}/g, campaignStyles.colors.accent)
      .replace(/\{\{BACKGROUND_COLOR\}\}/g, campaignStyles.colors.background)
      .replace(/\{\{TEXT_COLOR\}\}/g, campaignStyles.colors.text)
      .replace(/\{\{HEADING_FONT\}\}/g, campaignStyles.fonts.heading.family)
      .replace(/\{\{BODY_FONT\}\}/g, campaignStyles.fonts.body.family)
      .replace(/\{\{BUTTON_FONT\}\}/g, campaignStyles.fonts.button.family)
      .replace(/\{\{BORDER_RADIUS\}\}/g, campaignStyles.layout.borderRadius)
      .replace(/\{\{SPACING\}\}/g, campaignStyles.layout.spacing)
      // Legacy support
      .replace(/\{\{THEME_COLOR\}\}/g, campaignStyles.colors.primary)
      .replace(/\{\{CAMPAIGN_ID\}\}/g, campaignData.id)
      .replace(/\{\{PAGE_URL\}\}/g, pageUrl)
      .replace(/\{\{CREATED_DATE\}\}/g, new Date().toISOString());
    
    // Save page
    await fs.writeFile(pagePath, pageContent, 'utf8');
    
    // Log page creation
    await this.logPageCreation(campaignData.id, pageUrl, pagePath);
    
    return {
      url: pageUrl,
      filePath: pagePath,
      embedCode,
      seoData,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Extract campaign styles for template usage (backend version)
   */
  extractCampaignStylesForTemplate(campaignData) {
    if (!campaignData) {
      return this.getDefaultTemplateStyles();
    }

    // Priority order: applied_styles > custom_styles > theme_color > defaults
    const appliedStyles = campaignData.applied_styles;
    const customStyles = campaignData.custom_styles;
    const themeColor = campaignData.theme_color;

    return {
      colors: {
        primary: appliedStyles?.colors?.primary || 
                 customStyles?.colors?.primary || 
                 themeColor || 
                 '#2a2a72',
        secondary: appliedStyles?.colors?.secondary || 
                   customStyles?.colors?.secondary || 
                   '#666666',
        accent: appliedStyles?.colors?.accent || 
                customStyles?.colors?.accent || 
                '#28a745',
        background: appliedStyles?.colors?.background || 
                    customStyles?.colors?.background || 
                    '#ffffff',
        text: appliedStyles?.colors?.text || 
              customStyles?.colors?.text || 
              '#333333'
      },
      fonts: {
        heading: {
          family: appliedStyles?.fonts?.heading?.suggested || 
                  customStyles?.fonts?.heading?.family || 
                  'Inter, system-ui, -apple-system, sans-serif',
          weight: appliedStyles?.fonts?.heading?.weight || 
                  customStyles?.fonts?.heading?.weight || 
                  '700'
        },
        body: {
          family: appliedStyles?.fonts?.body?.suggested || 
                  customStyles?.fonts?.body?.family || 
                  'Inter, system-ui, -apple-system, sans-serif',
          weight: appliedStyles?.fonts?.body?.weight || 
                  customStyles?.fonts?.body?.weight || 
                  '400'
        },
        button: {
          family: appliedStyles?.fonts?.button?.suggested || 
                  customStyles?.fonts?.button?.family || 
                  'Inter, system-ui, -apple-system, sans-serif',
          weight: appliedStyles?.fonts?.button?.weight || 
                  customStyles?.fonts?.button?.weight || 
                  '500'
        }
      },
      layout: {
        borderRadius: appliedStyles?.layout?.recommendations?.borderRadius || 
                      customStyles?.layout?.borderRadius || 
                      '8px',
        spacing: appliedStyles?.layout?.recommendations?.margin || 
                 customStyles?.layout?.spacing || 
                 '1rem'
      }
    };
  }

  /**
   * Get default styles when no campaign data is available
   */
  getDefaultTemplateStyles() {
    return {
      colors: {
        primary: '#2a2a72',
        secondary: '#666666',
        accent: '#28a745',
        background: '#ffffff',
        text: '#333333'
      },
      fonts: {
        heading: {
          family: 'Inter, system-ui, -apple-system, sans-serif',
          weight: '700'
        },
        body: {
          family: 'Inter, system-ui, -apple-system, sans-serif',
          weight: '400'
        },
        button: {
          family: 'Inter, system-ui, -apple-system, sans-serif',
          weight: '500'
        }
      },
      layout: {
        borderRadius: '8px',
        spacing: '1rem'
      }
    };
  }

  /**
   * Generate embed code for the campaign
   */
  async generateEmbedCode(campaignId) {
    try {
      const { data, error } = await supabase
        .rpc('generate_embed_code', {
          p_campaign_id: campaignId,
          p_base_url: process.env.BASE_URL || 'http://localhost:3000'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Using fallback embed code generation');
      return this.generateFallbackEmbedCode(campaignId);
    }
  }

  /**
   * Fallback embed code generation
   */
  generateFallbackEmbedCode(campaignId) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `<!-- Campaign Contribution Form Embed -->
<div id="crypto-campaign-embed-${campaignId}"></div>
<script>
(function() {
    var iframe = document.createElement("iframe");
    iframe.src = "${baseUrl}/embed-form.html?campaign=${campaignId}";
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
})();
</script>`;
  }

  /**
   * Set up webhooks for real-time form updates
   */
  async setupWebhooks(campaignData) {
    try {
      // Create webhook for campaign updates
      await createWebhookForCampaign({
        campaignId: campaignData.id,
        events: ['campaign.updated', 'form.customized', 'embed.regenerated'],
        endpoint: `/api/webhooks/donor-page-sync/${campaignData.id}`,
        secret: process.env.WEBHOOK_SECRET
      });

      // Set up database trigger for auto-sync
      await this.createDatabaseTrigger(campaignData.id);
      
    } catch (error) {
      console.error('Webhook setup failed:', error);
      // Continue without webhooks - manual sync will still work
    }
  }

  /**
   * Create database trigger for automatic synchronization
   */
  async createDatabaseTrigger(campaignId) {
    const { error } = await supabase.rpc('create_donor_page_sync_trigger', {
      campaign_id: campaignId
    });

    if (error) {
      console.error('Database trigger creation failed:', error);
    }
  }

  /**
   * Update campaign record with generated page URL
   */
  async updateCampaignWithPageUrl(campaignId, pageUrl) {
    const { error } = await supabase
      .from('campaigns')
      .update({
        donor_page_url: pageUrl,
        donor_page_generated: true,
        donor_page_generated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (error) {
      console.error('Failed to update campaign with page URL:', error);
    }
  }

  /**
   * Add page to admin management dashboard
   */
  async addToAdminDashboard(campaignData, pageData) {
    await this.ensureAdminDirectory();
    
    const adminRecord = {
      campaignId: campaignData.id,
      campaignName: campaignData.campaign_name,
      committeeName: campaignData.committee_name,
      pageUrl: pageData.url,
      filePath: pageData.filePath,
      status: 'active',
      createdAt: pageData.createdAt,
      lastSyncAt: pageData.createdAt,
      embedCode: pageData.embedCode,
      seoData: pageData.seoData
    };

    // Save to admin tracking file
    const adminPath = path.join(this.adminDirectory, 'pages-registry.json');
    let registry = [];
    
    try {
      const existingData = await fs.readFile(adminPath, 'utf8');
      registry = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet
    }
    
    // Remove any existing entry for this campaign
    registry = registry.filter(r => r.campaignId !== campaignData.id);
    
    // Add new entry
    registry.push(adminRecord);
    
    await fs.writeFile(adminPath, JSON.stringify(registry, null, 2));
    
    // Also create individual page admin file
    const pageAdminPath = path.join(this.adminDirectory, `${sanitizeCampaignName(campaignData.campaign_name)}.json`);
    await fs.writeFile(pageAdminPath, JSON.stringify(adminRecord, null, 2));
  }

  /**
   * Sync page when campaign data changes (webhook handler)
   */
  async syncPageFromWebhook(campaignId, changes) {
    try {
      console.log('🔄 Syncing donor page from webhook:', campaignId);
      
      // Get updated campaign data
      const { data: campaignData, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      // Regenerate page with updated data
      const pageData = await this.generateDonorPage(campaignData);
      
      // Update admin dashboard
      await this.addToAdminDashboard(campaignData, pageData);
      
      console.log('✅ Donor page synced successfully');
      return pageData;
      
    } catch (error) {
      console.error('❌ Webhook sync failed:', error);
      await this.logError(campaignId, error);
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    await fs.mkdir(this.pagesDirectory, { recursive: true });
    await fs.mkdir(path.dirname(this.templatePath), { recursive: true });
  }

  /**
   * Ensure admin directory exists
   */
  async ensureAdminDirectory() {
    await fs.mkdir(this.adminDirectory, { recursive: true });
  }

  /**
   * Log page creation event
   */
  async logPageCreation(campaignId, pageUrl, filePath) {
    const { error } = await supabase
      .from('donor_page_logs')
      .insert({
        campaign_id: campaignId,
        event_type: 'page_created',
        page_url: pageUrl,
        file_path: filePath,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log page creation:', error);
    }
  }

  /**
   * Log error events
   */
  async logError(campaignId, error) {
    const { error: logError } = await supabase
      .from('donor_page_logs')
      .insert({
        campaign_id: campaignId,
        event_type: 'error',
        error_message: error.message,
        error_stack: error.stack,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  /**
   * Get all generated pages for admin dashboard
   */
  async getAllGeneratedPages() {
    try {
      const adminPath = path.join(this.adminDirectory, 'pages-registry.json');
      const data = await fs.readFile(adminPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Delete a generated page
   */
  async deletePage(campaignId) {
    try {
      // Get page info
      const pages = await this.getAllGeneratedPages();
      const page = pages.find(p => p.campaignId === campaignId);
      
      if (!page) return false;

      // Delete file
      await fs.unlink(page.filePath);
      
      // Update registry
      const updatedPages = pages.filter(p => p.campaignId !== campaignId);
      const adminPath = path.join(this.adminDirectory, 'pages-registry.json');
      await fs.writeFile(adminPath, JSON.stringify(updatedPages, null, 2));
      
      // Delete individual admin file
      const pageAdminPath = path.join(this.adminDirectory, `${path.basename(page.filePath, '.html')}.json`);
      try {
        await fs.unlink(pageAdminPath);
      } catch {}
      
      // Update campaign record
      await supabase
        .from('campaigns')
        .update({
          donor_page_url: null,
          donor_page_generated: false
        })
        .eq('id', campaignId);

      await this.logPageCreation(campaignId, page.pageUrl, 'DELETED');
      
      return true;
    } catch (error) {
      console.error('Failed to delete page:', error);
      return false;
    }
  }
}

module.exports = new DonorPageAutomationService();