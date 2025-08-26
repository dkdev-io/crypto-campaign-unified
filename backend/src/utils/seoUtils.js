/**
 * SEO utilities for donor page generation
 * Handles metadata generation, URL sanitization, and SEO optimization
 */

/**
 * Generate comprehensive SEO metadata for a campaign
 */
function generateSEOMetadata(campaignData) {
  const campaignName = campaignData.campaign_name || 'Campaign';
  const committeeName = campaignData.committee_name || 'Committee';
  const description = campaignData.description || `Support ${campaignName} with secure cryptocurrency donations`;
  
  // Generate title variants
  const title = `Donate to ${campaignName} | ${committeeName}`;
  const shortTitle = `${campaignName} Donations`;
  
  // Generate description variants
  const metaDescription = description.length > 160 
    ? `${description.substring(0, 157)}...`
    : description;
    
  // Generate keywords
  const keywords = [
    campaignName.toLowerCase(),
    committeeName.toLowerCase(),
    'political donation',
    'campaign contribution',
    'cryptocurrency donation',
    'bitcoin donation',
    'ethereum donation',
    'fec compliant',
    'political fundraising'
  ].join(', ');

  return {
    title,
    shortTitle,
    description: metaDescription,
    keywords,
    canonical: `/donors/${sanitizeCampaignName(campaignName)}`,
    
    // Open Graph specific
    ogTitle: title,
    ogDescription: metaDescription,
    ogType: 'website',
    
    // Twitter specific  
    twitterTitle: shortTitle,
    twitterDescription: metaDescription,
    twitterCard: 'summary_large_image',
    
    // Structured data
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: campaignName,
      description: metaDescription,
      url: `/donors/${sanitizeCampaignName(campaignName)}`,
      potentialAction: {
        '@type': 'DonateAction',
        target: `/donors/${sanitizeCampaignName(campaignName)}`
      }
    }
  };
}

/**
 * Sanitize campaign name for URL-safe usage
 */
function sanitizeCampaignName(campaignName) {
  if (!campaignName) return 'campaign';
  
  return campaignName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
    .substring(0, 50);           // Limit length
}

/**
 * Generate page slug from campaign data
 */
function generatePageSlug(campaignData) {
  const sanitized = sanitizeCampaignName(campaignData.campaign_name);
  const timestamp = new Date().getTime().toString(36);
  
  // Add timestamp suffix to ensure uniqueness if needed
  return campaignData.id ? sanitized : `${sanitized}-${timestamp}`;
}

/**
 * Generate breadcrumb schema for SEO
 */
function generateBreadcrumbSchema(campaignData) {
  const campaignName = campaignData.campaign_name || 'Campaign';
  const slug = sanitizeCampaignName(campaignName);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: '/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Campaigns',
        item: '/donors'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: campaignName,
        item: `/donors/${slug}`
      }
    ]
  };
}

/**
 * Generate FAQ schema for common donation questions
 */
function generateFAQSchema(campaignData) {
  const campaignName = campaignData.campaign_name || 'this campaign';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I donate with cryptocurrency?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can donate to ${campaignName} using Bitcoin, Ethereum, or USDC. Simply select your preferred cryptocurrency, enter your donation amount, and follow the secure checkout process.`
        }
      },
      {
        '@type': 'Question',
        name: 'Are cryptocurrency donations legal for political campaigns?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, cryptocurrency donations to political campaigns are legal and regulated by the FEC. All donations must comply with federal election laws including contribution limits and donor identification requirements.'
        }
      },
      {
        '@type': 'Question',
        name: 'What are the donation limits?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Federal law limits individual contributions to $3,300 per candidate per election. This includes the total of all donations made to the campaign, regardless of payment method.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is my donation secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all donations are processed through secure, encrypted channels. Your cryptocurrency transactions are recorded on the blockchain for transparency and compliance purposes.'
        }
      }
    ]
  };
}

/**
 * Generate meta tags for social sharing
 */
function generateSocialMetaTags(seoData, campaignData) {
  const tags = [];
  
  // Open Graph tags
  tags.push(`<meta property="og:title" content="${seoData.ogTitle}">`);
  tags.push(`<meta property="og:description" content="${seoData.ogDescription}">`);
  tags.push(`<meta property="og:type" content="${seoData.ogType}">`);
  tags.push(`<meta property="og:url" content="${seoData.canonical}">`);
  tags.push(`<meta property="og:image" content="/api/og-image/${campaignData.id}">`);
  
  // Twitter tags
  tags.push(`<meta name="twitter:card" content="${seoData.twitterCard}">`);
  tags.push(`<meta name="twitter:title" content="${seoData.twitterTitle}">`);
  tags.push(`<meta name="twitter:description" content="${seoData.twitterDescription}">`);
  tags.push(`<meta name="twitter:image" content="/api/og-image/${campaignData.id}">`);
  
  return tags.join('\n    ');
}

/**
 * Validate SEO data completeness
 */
function validateSEOData(seoData) {
  const required = ['title', 'description', 'keywords', 'canonical'];
  const missing = required.filter(field => !seoData[field]);
  
  if (missing.length > 0) {
    console.warn('Missing SEO data fields:', missing);
    return false;
  }
  
  // Check length limits
  if (seoData.title.length > 60) {
    console.warn('SEO title too long:', seoData.title.length);
  }
  
  if (seoData.description.length > 160) {
    console.warn('SEO description too long:', seoData.description.length);
  }
  
  return true;
}

/**
 * Generate sitemap entry for campaign page
 */
function generateSitemapEntry(campaignData, pageUrl) {
  const lastmod = new Date().toISOString().split('T')[0];
  const priority = '0.8'; // High priority for campaign pages
  
  return {
    loc: pageUrl,
    lastmod,
    changefreq: 'weekly',
    priority,
    campaign_id: campaignData.id,
    campaign_name: campaignData.campaign_name
  };
}

/**
 * Generate robots.txt rules for campaign pages
 */
function generateRobotsRules() {
  return [
    'User-agent: *',
    'Allow: /donors/',
    'Allow: /api/og-image/',
    'Disallow: /api/webhooks/',
    'Disallow: /admin/',
    '',
    'Sitemap: /sitemap.xml'
  ].join('\n');
}

module.exports = {
  generateSEOMetadata,
  sanitizeCampaignName,
  generatePageSlug,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateSocialMetaTags,
  validateSEOData,
  generateSitemapEntry,
  generateRobotsRules
};