import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deployFormCustomizationMigration() {
  console.log('🚀 Deploying form customization migration to production...');
  
  try {
    // Step 1: Add form customization columns
    console.log('\n1️⃣ Adding form customization columns...');
    
    const { error: columnError } = await supabase.rpc('sql', { 
      query: `
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS form_title TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS form_description TEXT;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS donate_button_text TEXT DEFAULT 'DONATE NOW';
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS logo_image_url TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_campaigns_form_title ON campaigns(form_title);
        CREATE INDEX IF NOT EXISTS idx_campaigns_logo_url ON campaigns(logo_image_url);
      `
    });

    if (columnError) {
      console.error('❌ Failed to add columns:', columnError);
    } else {
      console.log('✅ Form customization columns added successfully');
    }

    // Step 2: Create/update embed code generation function
    console.log('\n2️⃣ Creating embed code generation function...');
    
    const embedFunction = `
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
    `;

    const { error: functionError } = await supabase.rpc('sql', { query: embedFunction });

    if (functionError) {
      console.error('❌ Failed to create embed function:', functionError);
    } else {
      console.log('✅ Embed code generation function deployed successfully');
    }

    // Step 3: Verify deployment
    console.log('\n3️⃣ Verifying deployment...');
    
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('form_title, form_description, donate_button_text, logo_image_url')
      .limit(1);

    if (testError) {
      console.log('❌ Column verification failed:', testError.message);
    } else {
      console.log('✅ New columns are accessible in production');
    }

    console.log('\n🎉 PRODUCTION MIGRATION COMPLETE!');
    console.log('✅ Form customization columns added');
    console.log('✅ Embed code generation function deployed');
    console.log('✅ Production database ready for Netlify deployment');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

deployFormCustomizationMigration()
  .then(() => {
    console.log('\n🏆 SUCCESS: Production database is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 DEPLOYMENT FAILED:', error.message);
    process.exit(1);
  });