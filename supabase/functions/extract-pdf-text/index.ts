import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple PDF text extraction using regex patterns
function extractTextFromPDF(buffer: Uint8Array): string {
  try {
    // Convert buffer to string to search for text patterns
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(buffer);
    
    // Extract text between BT (Begin Text) and ET (End Text) markers
    const textMatches = content.match(/BT\s*(.*?)\s*ET/gs);
    if (!textMatches) return '';
    
    let extractedText = '';
    
    for (const match of textMatches) {
      // Extract text within parentheses (PDF text strings)
      const stringMatches = match.match(/\((.*?)\)/g);
      if (stringMatches) {
        for (const str of stringMatches) {
          // Remove parentheses and decode escape sequences
          let text = str.slice(1, -1)
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          
          extractedText += text + ' ';
        }
      }
      
      // Also try to extract hex strings <HEXSTRING>
      const hexMatches = match.match(/<([0-9A-Fa-f]+)>/g);
      if (hexMatches) {
        for (const hex of hexMatches) {
          try {
            const hexStr = hex.slice(1, -1);
            let text = '';
            for (let i = 0; i < hexStr.length; i += 2) {
              const byte = parseInt(hexStr.substr(i, 2), 16);
              if (byte >= 32 && byte <= 126) { // Printable ASCII
                text += String.fromCharCode(byte);
              }
            }
            if (text) extractedText += text + ' ';
          } catch (e) {
            // Skip invalid hex
          }
        }
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII
      .trim();
    
    return extractedText;
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    return '';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the PDF file from the request
    const contentType = req.headers.get('content-type') || '';
    let file: File | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      file = formData.get('file') as File;
    } else {
      // Handle raw file upload
      const blob = await req.blob();
      file = new File([blob], 'uploaded.pdf', { type: 'application/pdf' });
    }
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Check if it's a PDF by looking for the PDF header
    const header = new TextDecoder().decode(buffer.slice(0, 5));
    if (header !== '%PDF-') {
      return new Response(
        JSON.stringify({ error: "File is not a valid PDF" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract text from PDF
    let text = extractTextFromPDF(buffer);
    
    // If basic extraction didn't work well, try another approach
    if (text.length < 100) {
      // Try to find text in stream objects
      const streamContent = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const streams = streamContent.match(/stream\s*([\s\S]*?)\s*endstream/g);
      
      if (streams) {
        for (const stream of streams) {
          const streamText = stream
            .replace(/^stream\s*/, '')
            .replace(/\s*endstream$/, '');
          
          // Look for readable text patterns
          const readable = streamText.match(/[a-zA-Z0-9\s.,!?;:\-()[\]{}'"]{20,}/g);
          if (readable) {
            text += ' ' + readable.join(' ');
          }
        }
      }
      
      text = text.replace(/\s+/g, ' ').trim();
    }

    // Extract basic metadata
    const metadata: any = {
      fileSize: file.size,
      extractedLength: text.length
    };

    // Try to extract page count
    const pageMatch = new TextDecoder().decode(buffer).match(/\/Count\s+(\d+)/);
    if (pageMatch) {
      metadata.pages = parseInt(pageMatch[1]);
    }

    if (text.length < 50) {
      return new Response(
        JSON.stringify({ 
          error: "Could not extract sufficient text from PDF",
          details: "The PDF may be image-based, encrypted, or use an unsupported encoding. Please try converting it to a text document.",
          metadata
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        text,
        metadata,
        success: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in extract-pdf-text function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 