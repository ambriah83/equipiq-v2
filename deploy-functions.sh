#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Edge Functions to Supabase...${NC}"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase. Running 'supabase login'...${NC}"
    supabase login
fi

PROJECT_REF="enpqzoeohonguemzyifo"

# Function to deploy with status
deploy_function() {
    local func_name=$1
    echo -e "${BLUE}📦 Deploying ${func_name}...${NC}"
    
    if supabase functions deploy $func_name --project-ref $PROJECT_REF; then
        echo -e "${GREEN}✅ ${func_name} deployed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to deploy ${func_name}${NC}"
        exit 1
    fi
    echo ""
}

# Deploy all functions
deploy_function "ask-equip-iq"
deploy_function "hybrid-rag-search"
deploy_function "ingest-knowledge"

echo -e "${GREEN}🎉 All Edge Functions deployed successfully!${NC}"
echo ""
echo -e "${BLUE}View your functions at:${NC}"
echo "https://app.supabase.com/project/$PROJECT_REF/functions"