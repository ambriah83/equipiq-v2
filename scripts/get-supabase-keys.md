# Get Supabase Keys for EquipIQ V2

## Quick Access

### Option 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/enpqzoeohonguemzyifo/settings/api
2. Copy these keys:
   - **anon** / **public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

### Option 2: From Netlify (if deployed)
1. Go to: https://app.netlify.com/
2. Find your EquipIQ site
3. Go to: Site settings → Environment variables
4. Copy `VITE_SUPABASE_ANON_KEY`

### Option 3: From Browser (if site is running)
1. Open: https://www.equipiq.io
2. Open Developer Console (F12)
3. Check Network tab for Supabase API calls
4. Look for `Authorization: Bearer <key>` header

## Add to .env.local

Once you have the keys, update `.env.local`:

```bash
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Alternative: Run Without Embeddings First

If you want to test the ingestion without embeddings first:

```bash
# Set this to skip OpenAI API calls
export SKIP_EMBEDDINGS=true
node scripts/ingest-knowledge-data.js
```

Then add embeddings later with a separate script.
