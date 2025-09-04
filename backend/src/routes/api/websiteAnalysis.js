/**
 * Website Analysis API Endpoints
 * Handles website style analysis requests and provides styling data
 */

import express from 'express';
import WebsiteStyleAnalyzer from '../../services/websiteStyleAnalyzer.js';
import { supabase } from '../../lib/supabase.js';
import rateLimit from 'express-rate-limit';
import { createErrorResponse, WebsiteAnalysisError } from '../../utils/errorHandler.js';
import { createHash } from 'crypto';

const router = express.Router();

// Create analyzer instance
const analyzer = new WebsiteStyleAnalyzer();

// Rate limiting for analysis requests (expensive operations)
const analysisRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 analysis requests per windowMs
  message: {
    error: 'Too many analysis requests. Please wait before trying again.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Analyze website styles
 * POST /api/analyze-website-styles
 */
router.post('/analyze-website-styles', analysisRateLimit, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a website URL to analyze'
      });
    }

    console.log('🔍 Starting website analysis for:', url);

    // Perform the analysis with context
    const context = {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    const analysis = await analyzer.analyzeWebsite(url, context);

    // Store analysis result for potential reuse
    await storeAnalysisResult(url, analysis, req.ip);

    console.log('✅ Analysis completed:', {
      url: analysis.url,
      colors: analysis.colors?.palette?.length || 0,
      fonts: analysis.fonts?.cleanFamilies?.length || 0,
      confidence: analysis.confidence
    });

    res.json(analysis);

  } catch (error) {
    console.error('❌ Website analysis failed:', error);

    // Create structured error response using error handler
    const errorResponse = createErrorResponse(
      error, 
      req.body.url, 
      process.env.NODE_ENV !== 'production' // Include debug info in non-prod
    );

    // Log error for monitoring
    await logAnalysisError(req.body.url, error, req.ip);

    // Return appropriate status code based on error type
    let statusCode = 500; // Default to server error
    
    if (error instanceof WebsiteAnalysisError) {
      switch (error.code) {
        case 'INVALID_URL':
          statusCode = 400;
          break;
        case 'NOT_FOUND':
          statusCode = 404;
          break;
        case 'ACCESS_DENIED':
          statusCode = 403;
          break;
        case 'TIMEOUT':
          statusCode = 408;
          break;
        case 'RATE_LIMITED':
          statusCode = 429;
          break;
        case 'SERVICE_UNAVAILABLE':
          statusCode = 503;
          break;
        default:
          statusCode = 500;
      }
    }

    res.status(statusCode).json(errorResponse);
  }
});

/**
 * Get cached analysis results
 * GET /api/website-analysis/:urlHash
 */
router.get('/website-analysis/:urlHash', async (req, res) => {
  try {
    const { urlHash } = req.params;

    // Look up cached analysis
    const { data: analysis, error } = await supabase
      .from('website_analyses')
      .select('*')
      .eq('url_hash', urlHash)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        message: 'No cached analysis found for this URL'
      });
    }

    res.json({
      ...analysis.analysis_data,
      cached: true,
      cacheDate: analysis.created_at
    });

  } catch (error) {
    console.error('Failed to retrieve cached analysis:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: error.message
    });
  }
});

/**
 * Get analysis history for admin/debugging
 * GET /api/website-analysis-history
 */
router.get('/website-analysis-history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data: analyses, error } = await supabase
      .from('website_analyses')
      .select('url, url_hash, created_at, success, error_message, analysis_data')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Transform data for response
    const history = analyses.map(analysis => ({
      url: analysis.url,
      urlHash: analysis.url_hash,
      date: analysis.created_at,
      success: analysis.success,
      error: analysis.error_message,
      summary: analysis.success && analysis.analysis_data ? {
        colors: analysis.analysis_data.colors?.palette?.length || 0,
        fonts: analysis.analysis_data.fonts?.cleanFamilies?.length || 0,
        confidence: analysis.analysis_data.confidence || 0
      } : null
    }));

    res.json({
      success: true,
      history,
      count: history.length,
      hasMore: history.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Failed to fetch analysis history:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

/**
 * Health check for analysis service
 * GET /api/website-analysis/health
 */
router.get('/website-analysis/health', async (req, res) => {
  try {
    // Simple health check
    res.json({
      status: 'healthy',
      service: 'website-style-analyzer',
      timestamp: new Date().toISOString(),
      capabilities: {
        colorExtraction: true,
        fontAnalysis: true,
        layoutAnalysis: true,
        screenshotCapture: true
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
 * Apply styles to campaign
 * POST /api/apply-website-styles
 */
router.post('/apply-website-styles', async (req, res) => {
  try {
    const { campaignId, styles, analysisUrl } = req.body;

    if (!campaignId || !styles) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'campaignId and styles are required'
      });
    }

    console.log('🎨 Applying website styles to campaign:', campaignId);

    // Update campaign with new styles
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        theme_color: styles.colors?.primary,
        custom_styles: styles,
        style_source: analysisUrl,
        styles_applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (updateError) {
      throw updateError;
    }

    // Log style application
    await supabase
      .from('campaign_style_logs')
      .insert({
        campaign_id: campaignId,
        event_type: 'styles_applied',
        styles_data: styles,
        source_url: analysisUrl,
        applied_at: new Date().toISOString()
      });

    console.log('✅ Styles applied successfully to campaign:', campaignId);

    res.json({
      success: true,
      campaignId,
      styles,
      appliedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to apply styles:', error);
    res.status(500).json({
      error: 'Failed to apply styles',
      message: error.message
    });
  }
});

/**
 * Store analysis result for caching and analytics
 */
async function storeAnalysisResult(url, analysis, clientIp) {
  try {
    const urlHash = createHash('md5').update(url).digest('hex');

    await supabase
      .from('website_analyses')
      .insert({
        url,
        url_hash: urlHash,
        analysis_data: analysis,
        success: !analysis.error,
        error_message: analysis.error || null,
        client_ip: clientIp,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to store analysis result:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Log analysis errors for monitoring
 */
async function logAnalysisError(url, error, clientIp) {
  try {
    const urlHash = createHash('md5').update(url).digest('hex');

    await supabase
      .from('website_analyses')
      .insert({
        url,
        url_hash: urlHash,
        analysis_data: null,
        success: false,
        error_message: error.message,
        error_stack: error.stack,
        client_ip: clientIp,
        created_at: new Date().toISOString()
      });

  } catch (logError) {
    console.error('Failed to log analysis error:', logError);
  }
}

/**
 * Cleanup old analysis data (run periodically)
 * DELETE /api/website-analysis/cleanup
 */
router.delete('/website-analysis/cleanup', async (req, res) => {
  try {
    const daysToKeep = req.query.days || 30;
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('website_analyses')
      .delete()
      .lt('created_at', cutoffDate);

    if (error) {
      throw error;
    }

    console.log(`🧹 Cleaned up ${count} old website analyses`);

    res.json({
      success: true,
      deletedCount: count,
      cutoffDate,
      daysKept: daysToKeep
    });

  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Shutting down website analyzer...');
  await analyzer.cleanup();
});

process.on('SIGINT', async () => {
  console.log('Shutting down website analyzer...');
  await analyzer.cleanup();
});

export default router;