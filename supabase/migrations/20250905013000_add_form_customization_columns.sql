-- Add form customization columns to campaigns table for production deployment
-- This enables custom titles, descriptions, button text, and logos on donation forms

-- Add form customization columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS form_description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS donate_button_text TEXT DEFAULT 'DONATE NOW';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS logo_image_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_form_title ON campaigns(form_title);
CREATE INDEX IF NOT EXISTS idx_campaigns_logo_url ON campaigns(logo_image_url);

-- Update the generate_embed_code function to use production URL
CREATE OR REPLACE FUNCTION generate_embed_code(
    p_campaign_id UUID,
    p_base_url TEXT DEFAULT 'https://cryptocampaign.netlify.app'
)
RETURNS TEXT AS $$
DECLARE
    embed_html TEXT;
BEGIN
    embed_html := format('
<!-- NEXTRAISE Campaign Contribution Form Embed -->
<div id="nextraise-campaign-embed-%s"></div>
<script>
(function() {
    var iframe = document.createElement("iframe");
    iframe.src = "%s/embed-form.html?campaign=%s";
    iframe.width = "100%%";
    iframe.height = "700";
    iframe.frameBorder = "0";
    iframe.style.border = "1px solid #ddd";
    iframe.style.borderRadius = "8px";
    iframe.style.backgroundColor = "white";
    iframe.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
    document.getElementById("nextraise-campaign-embed-%s").appendChild(iframe);
    
    // Auto-resize iframe based on content
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "resize" && event.data.campaignId === "%s") {
            iframe.height = event.data.height + "px";
        }
    });
    
    // Set initial height and auto-adjust
    setTimeout(function() {
        iframe.height = "700px";
    }, 1000);
})();
</script>

<!-- Direct Link Alternative -->
<!-- 
You can also direct users to: %s/campaigns/%s
for a full-page donation experience.
-->',
        p_campaign_id,
        p_base_url,
        p_campaign_id,
        p_campaign_id,
        p_campaign_id,
        p_base_url,
        p_campaign_id
    );
    
    -- Update campaign with generated embed code
    UPDATE campaigns 
    SET 
        embed_code = embed_html,
        embed_generated_at = NOW()
    WHERE id = p_campaign_id;
    
    RETURN embed_html;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;