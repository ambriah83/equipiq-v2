# Hybrid RAG System Setup Guide

## Overview
EquipIQ now features a sophisticated Hybrid RAG (Retrieval-Augmented Generation) system that combines:
- **Traditional keyword search** for exact matches
- **Vector similarity search** for semantic understanding
- **AI synthesis layer** that intelligently combines results

## Architecture

```
User Query
    ↓
[Parallel Search]
    ├─→ Keyword Search (PostgreSQL Full-Text)
    └─→ Vector Search (OpenAI Embeddings + pgvector)
         ↓
    [Result Fusion]
         ↓
    [AI Synthesis]
    (Gemini/GPT)
         ↓
    Final Answer
```

## Setup Instructions

### 1. Database Setup

Run the migrations to create the necessary tables:

```bash
npx supabase db push --db-url "postgresql://postgres:[password]@db.enpqzoeohonguemzyifo.supabase.co:5432/postgres"
```

Or apply migrations manually:
1. `/supabase/migrations/20250716_create_rag_schema.sql`
2. `/supabase/migrations/20250716_create_vector_search_function.sql`

### 2. Deploy Edge Functions

```bash
# Deploy the hybrid RAG search function
npx supabase functions deploy hybrid-rag-search --project-ref enpqzoeohonguemzyifo

# Deploy the knowledge ingestion function
npx supabase functions deploy ingest-knowledge --project-ref enpqzoeohonguemzyifo

# The original simple chat function (keep for backward compatibility)
npx supabase functions deploy ask-equip-iq --project-ref enpqzoeohonguemzyifo
```

### 3. Set Environment Variables

```bash
# Required secrets
npx supabase secrets set OPENAI_API_KEY=your-openai-key --project-ref enpqzoeohonguemzyifo
npx supabase secrets set GEMINI_API_KEY=your-gemini-key --project-ref enpqzoeohonguemzyifo

# Optional: Specify preferred Gemini model
npx supabase secrets set GEMINI_MODEL=gemini-1.5-flash --project-ref enpqzoeohonguemzyifo
```

### 4. Create Equipment Types

Before ingesting knowledge, create equipment types:

```javascript
// Example using Supabase client
const { data, error } = await supabase
  .from('equipment_types')
  .insert({
    name: 'Sybaritic Hydration Station',
    description: 'Premium hydration system for commercial use'
  })
  .select()
  .single();

const equipmentTypeId = data.id;
```

### 5. Ingest Knowledge

Use the `ingest-knowledge` function to add documentation:

```javascript
// Using the AIService utility
import { AIService } from './services/aiService';

const aiService = new AIService(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ingest a manual in chunks
const result = await aiService.ingestKnowledge(
  equipmentTypeId,
  manualContent,
  "Sybaritic Hydration Station User Manual",
  {
    source: "manufacturer_manual",
    chunkType: "manual",
    processType: "chunk" // Splits into ~1000 char chunks
  }
);

// Ingest a single FAQ entry
const faqResult = await aiService.ingestKnowledge(
  equipmentTypeId,
  "Q: How do I clean the filters? A: Remove the filter cartridge and rinse...",
  "Filter Cleaning FAQ",
  {
    source: "faq",
    chunkType: "faq",
    processType: "full" // Stores as single chunk
  }
);
```

### 6. Frontend Integration

Update your chat component to use the hybrid RAG:

```javascript
// In your React component
const [currentEquipmentType, setCurrentEquipmentType] = useState(null);
const [sessionId, setSessionId] = useState(null);

const handleSendMessage = async (message) => {
  try {
    // Use hybrid RAG for equipment-specific queries
    const response = await aiService.hybridRAGChat(
      message,
      currentEquipmentType?.id,
      sessionId
    );
    
    // Display the response
    setMessages([
      ...messages,
      { role: 'user', content: message },
      { 
        role: 'assistant', 
        content: response.reply,
        sources: response.sources,
        stats: response.searchStats
      }
    ]);
    
    // Show source confidence
    if (response.searchStats) {
      console.log(`Found ${response.searchStats.total_sources} sources:`,
        `${response.searchStats.vector_matches} vector matches,`,
        `${response.searchStats.keyword_matches} keyword matches`
      );
    }
  } catch (error) {
    console.error('Chat error:', error);
  }
};
```

## How It Works

### 1. Query Processing
When a user asks a question:
- Generate embedding using OpenAI's text-embedding-ada-002
- Perform vector similarity search in parallel with keyword search
- Combine and deduplicate results

### 2. Result Ranking
Results are ranked by:
- **Both**: Found by both vector AND keyword search (highest priority)
- **Vector**: High semantic similarity
- **Keyword**: Exact term matches

### 3. AI Synthesis
The AI agent:
- Receives all relevant knowledge chunks
- Understands the search context (vector vs keyword matches)
- Synthesizes a coherent answer
- Indicates confidence level
- Suggests next actions (like creating tickets)

## Testing the System

### 1. Check if functions are deployed:
```bash
npx supabase functions list --project-ref enpqzoeohonguemzyifo
```

### 2. Test knowledge ingestion:
```bash
curl -X POST https://enpqzoeohonguemzyifo.supabase.co/functions/v1/ingest-knowledge \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_type_id": "your-equipment-uuid",
    "content": "Test content about equipment maintenance",
    "title": "Test Knowledge"
  }'
```

### 3. Test hybrid search:
```bash
curl -X POST https://enpqzoeohonguemzyifo.supabase.co/functions/v1/hybrid-rag-search \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I maintain the equipment?",
    "equipment_type_id": "your-equipment-uuid"
  }'
```

## Monitoring & Optimization

### 1. View function logs:
```bash
npx supabase functions logs hybrid-rag-search --project-ref enpqzoeohonguemzyifo
```

### 2. Optimize vector search:
- Adjust `match_threshold` (default: 0.7) for precision/recall balance
- Increase `match_count` for more context
- Monitor embedding generation costs

### 3. Improve keyword search:
- Add synonyms to content during ingestion
- Use PostgreSQL text search dictionaries
- Create custom search configurations

## Troubleshooting

### "No results found"
- Check if knowledge is ingested for the equipment type
- Lower the vector similarity threshold
- Verify embeddings are being generated

### "Slow responses"
- Check function cold start times
- Consider caching frequent queries
- Optimize chunk sizes

### "Inaccurate answers"
- Review knowledge chunk quality
- Adjust chunk overlap during ingestion
- Improve source document quality

## Future Enhancements

1. **Feedback Loop**: Store successful resolutions as new knowledge
2. **Multi-language**: Support for non-English documentation
3. **Image Understanding**: Process equipment diagrams
4. **Real-time Updates**: Stream responses for better UX
5. **Advanced Analytics**: Track query patterns and knowledge gaps