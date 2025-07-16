# EquipIQ V2 Deployment Guide

## Live Site
🌐 **Production URL**: https://www.equipiq.io  
🚀 **Frontend Hosting**: Netlify (auto-deploys from main branch)  
⚡ **Backend**: Supabase Edge Functions

## Prerequisites

1. **Install Supabase CLI** (if not already installed):
   ```bash
   # For Windows (using Scoop)
   scoop install supabase

   # Or download from: https://github.com/supabase/cli/releases
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

## Deploy Edge Function

1. **Initialize Supabase** (if not already done):
   ```bash
   supabase init
   ```

2. **Link to your project**:
   ```bash
   supabase link --project-ref enpqzoeohonguemzyifo
   ```

3. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy ask-equip-iq
   ```

## Frontend Deployment (Netlify)

### Environment Variables Required
⚠️ **IMPORTANT**: These must be set in Netlify Dashboard → Site settings → Environment variables

```
VITE_SUPABASE_URL=https://enpqzoeohonguemzyifo.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note**: The `VITE_` prefix is required for Vite to include these in the build.

### Deployment Process
1. **Automatic**: Push to `main` branch triggers auto-deploy
2. **Manual**: Netlify Dashboard → Deploys → Trigger deploy
3. **Build Command**: `npm run build`
4. **Publish Directory**: `dist`

## Run the Application Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file with VITE_ prefixed variables**:
   ```env
   VITE_SUPABASE_URL=https://enpqzoeohonguemzyifo.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_GEMINI_API_KEY=your-gemini-key-here
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173`

## Test the Application

1. **Create a test user** in your Supabase dashboard:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password

2. **Login** with the test user credentials

3. **Test the chat**:
   - Type a question about equipment
   - The AI should respond (once the Edge Function is deployed)

## Troubleshooting

### If Edge Function fails:
- Check logs: `supabase functions logs ask-equip-iq`
- Verify GEMINI_API_KEY is set: `supabase secrets list`

### If CORS errors occur:
- The Edge Function already includes CORS headers
- Check browser console for specific error messages

### If authentication fails:
- Verify your Supabase URL and anon key in `src/App.jsx`
- Check that email auth is enabled in Supabase dashboard

## Deploy All Edge Functions

```bash
# Deploy the original chat function
supabase functions deploy ask-equip-iq --project-ref enpqzoeohonguemzyifo

# Deploy the hybrid RAG search function
supabase functions deploy hybrid-rag-search --project-ref enpqzoeohonguemzyifo

# Deploy the knowledge ingestion function
supabase functions deploy ingest-knowledge --project-ref enpqzoeohonguemzyifo
```

## Next Steps

After successful deployment:
1. ✅ Set up the knowledge base schema (migrations in `/supabase/migrations/`)
2. ✅ Create the ingest-knowledge function (already created)
3. 📝 Add equipment documentation to the knowledge base using the ingestion function