# Netlify Deployment Guide

## Setting Up Environment Variables in Netlify

1. **Go to your Netlify dashboard:**
   - Navigate to: https://app.netlify.com/sites/[your-site-name]/settings/deploys
   - Click on "Environment variables"

2. **Add each variable individually:**
   
   **Variable Name:** `VITE_GOOGLE_MAPS_API_KEY`
   **Value:** `AIzaSyCgcu2OEs4a61Dw6MUGxv93609eNDVM3uI`

   **Variable Name:** `VITE_GOOGLE_CLIENT_ID` 
   **Value:** `175374680196-h783n8migree2ec4v8n2mcvlb5ecugbg.apps.googleusercontent.com`

   **Variable Name:** `GEMINI_API_KEY`
   **Value:** `[your_actual_gemini_api_key]`

   **Variable Name:** `NODE_VERSION` (Optional)
   **Value:** `18`

   **Variable Name:** `NPM_FLAGS` (Optional)
   **Value:** `--legacy-peer-deps`

3. **Deploy your site:**
   - Trigger a new deployment from the Deploys tab
   - Or push a commit to trigger auto-deployment

## Security Notes for Production

⚠️ **IMPORTANT:** Since your Google API keys were previously exposed in public repositories, consider:

1. **Rotating your Google API keys:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Generate new API keys
   - Update them in Netlify
   - Delete the old keys

2. **Restricting API key usage:**
   - In Google Cloud Console, restrict your Maps API key to your Netlify domain
   - Example: `https://your-app.netlify.app/*`
   - Do the same for OAuth origins

3. **Monitor API usage:**
   - Set up billing alerts in Google Cloud
   - Monitor for unusual API usage patterns

## Netlify Build Settings

If you encounter build issues, you can also set these in your `netlify.toml` file:

\`\`\`toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--legacy-peer-deps"
\`\`\`

## Verification

After deployment, check that:
- ✅ Google Maps loads correctly
- ✅ Google OAuth authentication works  
- ✅ No console errors about missing API keys
- ✅ All environment variables are properly injected