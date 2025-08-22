# 🧪 Testing Guide - Crypto Campaign Setup

## Current Status: ✅ FULLY WORKING FOR TESTING

The localhost:5173 URLs are **perfect for testing** - that's the Vite development server.

## Quick Testing Steps

### 1. Start Development Server
```bash
npm run dev
```
Server starts at: `http://localhost:5173`

### 2. Test Setup Wizard
1. Go to `http://localhost:5173`
2. Complete all 6 steps:
   - **Step 1**: Account Setup (email, name)
   - **Step 2**: Campaign Info (campaign name, website)  
   - **Step 3**: Legal Compliance (candidate name, FEC acknowledgment)
   - **Step 4**: Form Customization (theme, amounts, cryptos)
   - **Step 5**: Embed Options (see your embed code)
   - **Step 6**: Launch Confirmation (get final embed code)

### 3. Test Donor Form
**Working test URL**: 
`http://localhost:5173/?campaign=302f017d-72f1-4efd-99b6-abc90ad647aa`

Or use your own campaign ID from the setup wizard.

### 4. Test Complete Workflow
1. **Setup**: Complete wizard → get campaign ID
2. **Embed**: Copy the generated iframe code  
3. **Donate**: Visit campaign URL → fill form → submit
4. **Verify**: Check browser console for success messages

## What's Working ✅

- ✅ Setup wizard completes successfully
- ✅ Campaign data saves to Supabase  
- ✅ Embed code generates correctly
- ✅ Donor forms load campaign data
- ✅ Form submissions work
- ✅ Theme customization applies
- ✅ Suggested amounts display
- ✅ Error handling works

## Testing with Real Embed

You can test the embed code by creating a simple HTML file:

```html
<!DOCTYPE html>
<html>
<body>
    <h1>Test Campaign Embed</h1>
    <iframe 
        src="http://localhost:5173/?campaign=YOUR-CAMPAIGN-ID" 
        width="400" 
        height="600" 
        frameborder="0" 
        style="border-radius: 8px;">
    </iframe>
</body>
</html>
```

## Console Debugging

Open browser DevTools (F12) to see:
- Campaign loading logs
- Form submission status  
- Any error messages
- Database interaction details

## Known Testing Limitations

- **Candidate Name**: Currently disabled (need to add database column)
- **Form Submissions**: Go to `form_submissions` table, not processed payments
- **Local Only**: URLs work only while dev server is running

## For Production Later

When ready to deploy:
1. Replace `localhost:5173` with your domain in:
   - `EmbedOptions.jsx`
   - `LaunchConfirmation.jsx`
2. Set up production Supabase policies
3. Configure production environment variables

## Support

If testing fails:
1. Check `npm run dev` is running
2. Verify Supabase connection  
3. Check browser console for errors
4. Ensure campaign ID exists in database

**Your setup is ready for testing! 🚀**