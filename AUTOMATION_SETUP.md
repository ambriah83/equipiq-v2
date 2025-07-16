# 🚀 Automated Deployment Setup

This guide helps you set up automatic deployment of Supabase Edge Functions whenever you push changes to GitHub.

## Prerequisites

You'll need to add two secrets to your GitHub repository:

### 1. Get your Supabase Access Token

1. Go to https://app.supabase.com/account/tokens
2. Click "Generate new token"
3. Give it a name like "GitHub Actions"
4. Copy the token (you won't see it again!)

## Add Secret to GitHub

1. Go to your GitHub repository: https://github.com/ambriah83/equipiq-v2
2. Click on **Settings** (in the repo, not your profile)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add this secret:

| Secret Name | Value |
|------------|-------|
| `SUPABASE_ACCESS_TOKEN` | Your token from step 1 |

## How It Works

Once set up, the automation will:

1. **Trigger on**: Any push to `main` branch that changes files in `supabase/functions/`
2. **Deploy**: All three Edge Functions automatically
3. **Notify**: Show success/failure in the Actions tab

## Testing

After setup, make a small change to any Edge Function and push:

```bash
# Make a small change (like adding a comment)
echo "// Automated deployment test" >> supabase/functions/ask-equip-iq/index.ts
git add -A
git commit -m "test: Trigger automated deployment"
git push
```

Then check the **Actions** tab in your GitHub repo to see it running!

## Alternative: Local Script

If you prefer a local solution, create this script:

```bash
#!/bin/bash
# deploy-functions.sh

echo "🚀 Deploying Edge Functions to Supabase..."

# Deploy all functions
supabase functions deploy ask-equip-iq --project-ref enpqzoeohonguemzyifo
supabase functions deploy hybrid-rag-search --project-ref enpqzoeohonguemzyifo  
supabase functions deploy ingest-knowledge --project-ref enpqzoeohonguemzyifo

echo "✅ All functions deployed!"
```

Make it executable: `chmod +x deploy-functions.sh`
Run it: `./deploy-functions.sh`

## Troubleshooting

- **Authentication errors**: Make sure your tokens are correct and not expired
- **Deploy fails**: Check that you're logged into Supabase CLI locally
- **Can't find secrets**: Secrets are tied to the repository, not your account

## Benefits

✅ No manual deployment needed  
✅ Consistent deployments  
✅ Deploy history in GitHub Actions  
✅ Team members can deploy without CLI access  
✅ Automatic rollback on failures