# EquipIQ AI Assistant Function

## Overview
This Supabase Edge Function powers the AI assistant for EquipIQ using Google's Gemini API.

## Auto-Update Strategy

### 1. Model Fallback System
The function automatically tries multiple Gemini models in order:
- Primary: Set via `GEMINI_MODEL` environment variable (default: gemini-1.5-flash)
- Fallbacks: gemini-1.5-flash → gemini-1.5-pro → gemini-pro

### 2. Updating Models
When Google releases new models or deprecates old ones:

```bash
# Set preferred model without redeploying
npx supabase secrets set GEMINI_MODEL=gemini-2.0-pro --project-ref enpqzoeohonguemzyifo
```

### 3. Monitoring for Issues
Check function logs regularly:
```bash
npx supabase functions logs ask-equip-iq --project-ref enpqzoeohonguemzyifo
```

### 4. Stay Updated
- Subscribe to [Google AI Release Notes](https://ai.google.dev/gemini-api/docs/release-notes)
- Check deprecation warnings in Supabase function logs
- Update the `modelNames` array when new models are available

### 5. Testing
Test the function locally before deploying:
```bash
npx supabase functions serve ask-equip-iq --env-file .env
```

## Environment Variables
- `GEMINI_API_KEY`: Your Google AI API key (required)
- `GEMINI_MODEL`: Preferred model name (optional, defaults to gemini-1.5-flash)

## Deployment
```bash
npx supabase functions deploy ask-equip-iq --project-ref enpqzoeohonguemzyifo
```