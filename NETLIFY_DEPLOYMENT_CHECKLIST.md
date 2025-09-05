# Netlify Deployment Checklist - Campaign Setup Workflow

## 🚨 CRITICAL: Production Database Updates Required

### 1. **Run Migration on Production Supabase**
Execute this SQL in your **production** Supabase SQL Editor:

```sql
-- Add form customization columns to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS form_description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS donate_button_text TEXT DEFAULT 'DONATE NOW';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS logo_image_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_form_title ON campaigns(form_title);
CREATE INDEX IF NOT EXISTS idx_campaigns_logo_url ON campaigns(logo_image_url);
```

### 2. **Deploy Embed Code Generation Function**
Execute this SQL in your **production** Supabase SQL Editor:

```sql
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
    
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "resize" && event.data.campaignId === "%s") {
            iframe.height = event.data.height + "px";
        }
    });
    
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
    
    UPDATE campaigns 
    SET 
        embed_code = embed_html,
        embed_generated_at = NOW()
    WHERE id = p_campaign_id;
    
    RETURN embed_html;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ✅ **What's Already Ready for Netlify:**

### **Frontend Code**
- ✅ **Environment variables**: Configured to use cryptocampaign.netlify.app
- ✅ **Embed code generation**: Uses production URLs
- ✅ **QR codes**: Point to production donation forms
- ✅ **Donation forms**: Both EnhancedDonorForm and EmbedDonorForm load customization data
- ✅ **Routes**: `/embed-form.html` route exists and works
- ✅ **Data flow**: Complete integration from setup → database → donation form

### **Features Working**
- ✅ **Campaign setup workflow**: 7-step process with consistent styling
- ✅ **Form customization**: Title, description, logo, button text, amounts
- ✅ **Embed code generation**: Production-ready HTML with Netlify URLs
- ✅ **QR code generation**: Links to Netlify donation forms
- ✅ **Dashboard integration**: Links to campaign dashboard
- ✅ **Real-time preview**: Shows exactly how donation form will look

## 🎯 **Deployment Process**

1. **Deploy to Netlify**: Code is ready (just commit and push)
2. **Run SQL migrations**: Execute the two SQL blocks above in Supabase
3. **Test production**: Verify workflow works on cryptocampaign.netlify.app

After running those SQL migrations, the complete workflow will be fully functional on Netlify with:
- Custom campaign titles, descriptions, and logos appearing on donation forms
- Working embed codes that point to production URLs  
- Proper database storage and retrieval of all customization data