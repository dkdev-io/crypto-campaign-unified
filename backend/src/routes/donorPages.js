/**
 * Public routes for serving generated donor pages
 * Handles /donors/[campaign-name] URLs and serves the generated HTML pages
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const donorPageAutomation = require('../services/donorPageAutomation');
const { sanitizeCampaignName } = require('../utils/seoUtils');

const router = express.Router();

/**
 * Serve donor page by campaign name
 * GET /donors/:campaignSlug
 */
router.get('/:campaignSlug', async (req, res) => {
  try {
    const { campaignSlug } = req.params;
    
    console.log('📄 Serving donor page:', campaignSlug);

    // Validate campaign slug
    if (!campaignSlug || campaignSlug.length < 2) {
      return res.status(400).json({
        error: 'Invalid campaign identifier'
      });
    }

    // Build page file path
    const pagesDirectory = path.join(__dirname, '../../public/donors');
    const pageFile = `${campaignSlug}.html`;
    const pagePath = path.join(pagesDirectory, pageFile);

    try {
      // Check if page file exists
      await fs.access(pagePath);
      
      // Read and serve the page
      const pageContent = await fs.readFile(pagePath, 'utf8');
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache
      res.setHeader('X-Robots-Tag', 'index, follow');
      
      // Log page view
      await logPageView(campaignSlug, req);
      
      res.send(pageContent);

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        // Page file doesn't exist - try to find and generate it
        console.log('🔍 Page file not found, attempting to locate campaign:', campaignSlug);
        
        const campaignId = await findCampaignBySlug(campaignSlug);
        
        if (campaignId) {
          // Try to generate the page on-demand
          const result = await generatePageOnDemand(campaignId, campaignSlug);
          
          if (result) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=300');
            res.setHeader('X-Robots-Tag', 'index, follow');
            res.send(result.content);
            return;
          }
        }
        
        // Page not found
        res.status(404).send(generateNotFoundPage(campaignSlug));
      } else {
        throw fileError;
      }
    }

  } catch (error) {
    console.error('❌ Error serving donor page:', error);
    res.status(500).send(generateErrorPage(error.message));
  }
});

/**
 * Get all available donor pages (sitemap/index)
 * GET /donors/
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Serving donor pages index');

    // Get all generated pages
    const pages = await donorPageAutomation.getAllGeneratedPages();
    
    // Filter active pages only
    const activePages = pages.filter(page => page.status === 'active');

    // Generate index page
    const indexHtml = generateIndexPage(activePages);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minute cache
    res.send(indexHtml);

  } catch (error) {
    console.error('❌ Error serving donor pages index:', error);
    res.status(500).send(generateErrorPage(error.message));
  }
});

/**
 * Health check endpoint for donor page system
 * GET /donors/health
 */
router.get('/system/health', async (req, res) => {
  try {
    const pages = await donorPageAutomation.getAllGeneratedPages();
    const pagesDirectory = path.join(__dirname, '../../public/donors');
    
    let directoryExists = false;
    try {
      await fs.access(pagesDirectory);
      directoryExists = true;
    } catch {}

    res.json({
      status: 'healthy',
      system: 'donor-pages',
      timestamp: new Date().toISOString(),
      stats: {
        totalPages: pages.length,
        activePages: pages.filter(p => p.status === 'active').length,
        directoryExists,
        directoryPath: pagesDirectory
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * Find campaign ID by slug/name
 */
async function findCampaignBySlug(slug) {
  try {
    const { supabase } = require('../lib/supabase');
    
    // Try to find campaign by matching the slug to sanitized campaign name
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, campaign_name')
      .eq('setup_completed', true);

    if (error || !campaigns) {
      return null;
    }

    // Find campaign whose sanitized name matches the slug
    for (const campaign of campaigns) {
      const sanitizedName = sanitizeCampaignName(campaign.campaign_name);
      if (sanitizedName === slug) {
        return campaign.id;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding campaign by slug:', error);
    return null;
  }
}

/**
 * Generate page on-demand if it doesn't exist
 */
async function generatePageOnDemand(campaignId, slug) {
  try {
    console.log('🚀 Generating page on-demand:', campaignId);

    const { supabase } = require('../lib/supabase');
    
    // Get campaign data
    const { data: campaignData, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error || !campaignData) {
      return null;
    }

    // Generate the page
    const result = await donorPageAutomation.triggerPageCreation(campaignData);
    
    // Read the generated content
    const content = await fs.readFile(result.filePath, 'utf8');
    
    return {
      content,
      result
    };

  } catch (error) {
    console.error('Error generating page on-demand:', error);
    return null;
  }
}

/**
 * Log page view for analytics
 */
async function logPageView(campaignSlug, req) {
  try {
    const { supabase } = require('../lib/supabase');
    
    // Log the page view (non-blocking)
    setTimeout(async () => {
      try {
        await supabase
          .from('donor_page_logs')
          .insert({
            campaign_id: null, // We might not have campaign ID here
            event_type: 'page_view',
            data: JSON.stringify({
              slug: campaignSlug,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              referer: req.get('Referer'),
              timestamp: new Date().toISOString()
            })
          });
      } catch (logError) {
        console.error('Failed to log page view:', logError);
      }
    }, 0);

  } catch (error) {
    // Don't throw - logging is non-critical
    console.error('Page view logging error:', error);
  }
}

/**
 * Generate 404 page for missing donor pages
 */
function generateNotFoundPage(slug) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campaign Not Found</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: #333;
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            margin: 1rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #2a2a72;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        .slug {
            background: #f8f9fa;
            padding: 0.5rem;
            border-radius: 4px;
            font-family: monospace;
            color: #dc3545;
            margin: 1rem 0;
        }
        .btn {
            background: #2a2a72;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            font-weight: 500;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #1a1a52;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔍</div>
        <h1>Campaign Not Found</h1>
        <p>We couldn't find a donor page for the campaign:</p>
        <div class="slug">${slug}</div>
        <p>This page may have been moved, deleted, or the campaign setup might not be complete yet.</p>
        <a href="/donors" class="btn">View All Campaigns</a>
    </div>
</body>
</html>`;
}

/**
 * Generate error page for system errors
 */
function generateErrorPage(errorMessage) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #dc3545;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 12px;
            text-align: center;
            max-width: 500px;
            margin: 1rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            margin-bottom: 1rem;
        }
        p {
            opacity: 0.9;
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        .error {
            background: rgba(0,0,0,0.2);
            padding: 1rem;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9rem;
            margin: 1rem 0;
            word-break: break-word;
        }
        .btn {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 1rem 2rem;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            font-weight: 500;
            transition: background 0.2s;
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠️</div>
        <h1>Service Error</h1>
        <p>Something went wrong while loading this donor page. Our team has been notified.</p>
        <div class="error">${errorMessage}</div>
        <p>Please try again in a few moments or contact support if the problem persists.</p>
        <a href="/donors" class="btn">Return to Campaign List</a>
    </div>
</body>
</html>`;
}

/**
 * Generate index page listing all available donor pages
 */
function generateIndexPage(pages) {
  const pagesList = pages.map(page => `
    <div class="campaign-card">
      <h3>${page.campaignName}</h3>
      <p class="committee">${page.committeeName}</p>
      <a href="${page.pageUrl}" class="btn btn-primary">Visit Campaign</a>
      <div class="meta">
        <span class="status ${page.status}">${page.status}</span>
        <span class="date">Created ${new Date(page.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campaign Donor Pages</title>
    <meta name="description" content="Browse all active political campaign donation pages">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 2rem 0;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .campaigns-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }
        .campaign-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .campaign-card:hover {
            transform: translateY(-5px);
        }
        .campaign-card h3 {
            color: #2a2a72;
            margin: 0 0 0.5rem 0;
            font-size: 1.3rem;
        }
        .committee {
            color: #666;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
        }
        .btn {
            background: #2a2a72;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            font-weight: 500;
            transition: background 0.2s;
            margin-bottom: 1rem;
        }
        .btn:hover {
            background: #1a1a52;
        }
        .meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: #666;
        }
        .status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 500;
            text-transform: uppercase;
        }
        .status.active {
            background: #d4edda;
            color: #155724;
        }
        .empty {
            text-align: center;
            color: white;
            padding: 4rem 2rem;
        }
        .empty .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗳️ Campaign Donor Pages</h1>
            <p>Support political campaigns with secure cryptocurrency donations</p>
        </div>
        
        ${pages.length > 0 ? `
          <div class="campaigns-grid">
            ${pagesList}
          </div>
        ` : `
          <div class="empty">
            <div class="icon">📄</div>
            <h2>No Active Campaigns</h2>
            <p>Campaign donor pages will appear here once campaigns complete their setup.</p>
          </div>
        `}
    </div>
</body>
</html>`;
}

module.exports = router;