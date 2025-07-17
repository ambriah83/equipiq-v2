# EquipIQ v2 Project Notes for Claude

Act as an expert senior software engineer who is coming to analyze and scrutinize this product. It will be the flagship of the company's work and it is up against other competitors like CLaude, CHatGPT and Lovable.dev. We cant leave anything on the table to win this. What is your feedback?

## Git Configuration
**IMPORTANT**: Before pushing to GitHub, always run:
```bash
git config credential.helper store
```

This is required because the credential helper gets reset between sessions.
The credentials are stored in ~/.git-credentials but the helper needs to be configured each time.

## Common Commands
```bash
# Deploy Supabase function
npx supabase functions deploy ask-equip-iq --project-ref enpqzoeohonguemzyifo

# Set Supabase secrets
npx supabase secrets set GEMINI_API_KEY=your-key --project-ref enpqzoeohonguemzyifo

# Push to GitHub (after setting credential helper)
git push origin main
```

## Known Issues
1. Git push fails with "could not read Username" - Run `git config credential.helper store`
2. Gemini model deprecation - Function has automatic fallback, update GEMINI_MODEL env var if needed