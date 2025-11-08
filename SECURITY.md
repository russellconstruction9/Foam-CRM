# Security Configuration Guide

## ⚠️ IMPORTANT SECURITY NOTICE

This project has been updated to remove hardcoded API keys and credentials. Please follow these steps to configure your environment securely.

## Environment Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your actual API keys to `.env`:**
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
   VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id.apps.googleusercontent.com
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```

## Getting API Keys

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Maps JavaScript API
3. Create an API key and restrict it to your domain

### Google OAuth Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials
4. Add your domain to authorized origins

### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key

## Security Best Practices

- ✅ **DO**: Keep `.env` files in `.gitignore`
- ✅ **DO**: Use environment-specific `.env` files (.env.local, .env.production)
- ✅ **DO**: Restrict API keys to specific domains/IPs in production
- ✅ **DO**: Rotate API keys regularly
- ❌ **DON'T**: Commit `.env` files to version control
- ❌ **DON'T**: Share API keys in code, emails, or chat
- ❌ **DON'T**: Use production keys in development

## Production Deployment

For production deployment, set environment variables in your hosting platform (Vercel, Netlify, etc.) rather than using `.env` files.

## Files Changed for Security

- `hooks/useGoogleAuth.ts` - Removed hardcoded API key
- `index.html` - Replaced hardcoded credentials with placeholders
- `vite.config.ts` - Added HTML transformation for environment variables
- `.gitignore` - Added environment file patterns
- `.env` - Created with your current credentials (DO NOT COMMIT)
- `.env.example` - Template for other developers