-- Create the generate_embed_code function
CREATE OR REPLACE FUNCTION generate_embed_code(
    p_campaign_id UUID,
    p_base_url TEXT DEFAULT 'https://your-domain.com'
)
RETURNS TEXT AS $$
DECLARE
    embed_html TEXT;
BEGIN
    embed_html := format('
<!-- Campaign Contribution Form Embed -->
<div id="crypto-campaign-embed-%s"></div>
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
    document.getElementById("crypto-campaign-embed-%s").appendChild(iframe);
    
    // Auto-resize iframe based on content
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "resize" && event.data.campaignId === "%s") {
            iframe.height = event.data.height + "px";
        }
    });
    
    // Set a reasonable initial height
    setTimeout(function() {
        iframe.height = "700px";
    }, 1000);
})();
</script>',
        p_campaign_id,
        p_base_url,
        p_campaign_id,
        p_campaign_id,
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