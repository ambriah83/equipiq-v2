# EquipIQ V2 Deployment Guide

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

## Run the Application Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
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

## Next Steps

After successful deployment:
1. Set up the knowledge base schema
2. Create the ingest-knowledge function
3. Add equipment documentation to the knowledge base