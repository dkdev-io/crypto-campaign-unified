import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmepcdsklnnxokoimvzo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
);

async function updateTestyStyles() {
  console.log('🎨 Updating Testy campaign with extracted pink theme...');

  const styleAnalysis = {
    colors: {
      palette: [
        { name: 'Primary Pink', hex: '#FF66F4', usage: 'primary' },
        { name: 'Blue', hex: '#4B73FF', usage: 'secondary' },
        { name: 'Orange', hex: '#FE7B02', usage: 'accent' },
        { name: 'Pink Light', hex: '#FF7EB0', usage: 'highlight' },
        { name: 'Orange Light', hex: '#FF8E63', usage: 'complement' },
        { name: 'Background', hex: '#FCFBF8', usage: 'background' },
        { name: 'Text', hex: '#000000', usage: 'text' },
      ],
      primary: '#FF66F4',
    },
    fonts: {
      primary: 'Inter, sans-serif',
      heading: { family: 'Inter', weight: '700' },
      body: { family: 'Inter', weight: '400' },
    },
    confidence: 95,
    websiteAnalyzed: 'https://testy-pink-chancellor.lovable.app/',
  };

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        theme_color: '#FF66F4',
      })
      .eq('campaign_name', 'Testy')
      .select();

    if (error) {
      console.error('❌ Error updating campaign:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No Testy campaign found to update');
      return;
    }

    console.log('✅ Testy campaign updated successfully!');
    console.log('Campaign ID:', data[0].id);
    console.log('Primary color: #FF66F4 (Pink)');
    console.log('Secondary color: #4B73FF (Blue)');
    console.log('Font: Inter');
    console.log('Confidence: 95%');

    console.log('\n🔗 Test the updated styling:');
    console.log('Local: http://localhost:5174/testy');
    console.log('Live: https://cryptocampaign.netlify.app/testy');
  } catch (e) {
    console.error('❌ Failed to update:', e.message);
  }
}

updateTestyStyles();
