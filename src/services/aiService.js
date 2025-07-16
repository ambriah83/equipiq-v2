// AI Service for EquipIQ - Handles both simple and hybrid RAG queries

export class AIService {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.baseUrl = supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1');
  }

  // Simple chat using the original ask-equip-iq function
  async simpleChat(query) {
    const url = `${this.baseUrl}/ask-equip-iq`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get response: ${error}`);
      }

      const data = await response.json();
      return {
        reply: data.reply,
        sources: [],
        searchStats: null
      };
    } catch (error) {
      console.error('Simple chat error:', error);
      throw error;
    }
  }

  // Advanced chat using hybrid RAG
  async hybridRAGChat(query, equipmentTypeId = null, sessionId = null) {
    const url = `${this.baseUrl}/hybrid-rag-search`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
        },
        body: JSON.stringify({ 
          query,
          equipment_type_id: equipmentTypeId,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        // Fall back to simple chat if hybrid RAG is not available
        if (response.status === 404) {
          console.warn('Hybrid RAG not available, falling back to simple chat');
          return this.simpleChat(query);
        }
        throw new Error(`Failed to get response: ${error}`);
      }

      const data = await response.json();
      return {
        reply: data.reply,
        sources: data.sources || [],
        searchStats: data.search_stats || null
      };
    } catch (error) {
      console.error('Hybrid RAG error:', error);
      // Fallback to simple chat
      console.warn('Falling back to simple chat due to error');
      return this.simpleChat(query);
    }
  }

  // Ingest new knowledge into the system
  async ingestKnowledge(equipmentTypeId, content, title, options = {}) {
    const url = `${this.baseUrl}/ingest-knowledge`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
        },
        body: JSON.stringify({
          equipment_type_id: equipmentTypeId,
          content,
          title,
          source: options.source || 'manual',
          chunk_type: options.chunkType || 'manual',
          process_type: options.processType || 'chunk'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to ingest knowledge: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Knowledge ingestion error:', error);
      throw error;
    }
  }
}