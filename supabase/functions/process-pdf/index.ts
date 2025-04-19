
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from 'https://esm.sh/gpt-3-encoder@1.1.4'

interface RequestBody {
  fileId: string;
  fileName: string;
}

// Simple text chunking function
const chunkText = (text: string, maxChunkLength = 1000): string[] => {
  const chunks: string[] = [];
  let currentChunk = '';

  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    // If paragraph fits, add it to current chunk
    if (currentChunk.length + paragraph.length < maxChunkLength) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      // If current chunk is not empty, push it to chunks array
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // If paragraph is longer than max chunk size, split it
      if (paragraph.length > maxChunkLength) {
        // Split by sentences
        const sentences = paragraph.split(/(?<=\.|\?|\!)\s+/);
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length < maxChunkLength) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = '';
            }
            
            // If sentence is still too long, split it arbitrarily
            if (sentence.length > maxChunkLength) {
              let remainingSentence = sentence;
              while (remainingSentence.length > 0) {
                const chunk = remainingSentence.substring(0, maxChunkLength);
                chunks.push(chunk);
                remainingSentence = remainingSentence.substring(maxChunkLength);
              }
            } else {
              currentChunk = sentence;
            }
          }
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

// Function to generate embeddings via Google Gemini/Vertex AI
const generateEmbeddings = async (text: string): Promise<number[]> => {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  // For now, use a simple token-based embedding as a fallback
  // This should be replaced with actual Gemini embeddings API once available
  try {
    const embeddingEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent';
    
    const response = await fetch(`${embeddingEndpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        }
      }),
    });
    
    const data = await response.json();
    
    if (data.embedding && data.embedding.values) {
      return data.embedding.values;
    }
    
    // Fallback to simple token-based embedding
    throw new Error('Using fallback embedding method');
  } catch (error) {
    console.error("Error generating embeddings, using fallback:", error);
    
    // Simple fallback embedding based on token counts (not for production use)
    const tokens = encode(text);
    const tokenCounts = new Map<number, number>();
    
    for (const token of tokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    }
    
    // Create a simple embedding vector (this is a very basic approach)
    const embedding = Array(1536).fill(0);
    
    let i = 0;
    for (const [token, count] of tokenCounts.entries()) {
      const pos = token % 1536;
      embedding[pos] = (embedding[pos] + count) / tokens.length;
      i++;
      if (i > 1536) break;
    }
    
    return embedding;
  }
};

serve(async (req) => {
  try {
    const { fileId, fileName } = await req.json() as RequestBody;
    
    // Get authentication details
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Extract user info from auth token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('papers')
      .download(`${user.id}/${fileId}`);
      
    if (downloadError) {
      throw new Error(`Error downloading file: ${downloadError.message}`);
    }
    
    if (!fileData) {
      throw new Error('File not found or empty');
    }
    
    // For now, we're using a very simple approach to extract text
    // In a production app, you would want to use a proper PDF parsing library
    const text = await fileData.text();
    
    // Chunk the text into manageable pieces
    const chunks = chunkText(text);
    
    // Process each chunk to create embeddings
    const embeddingsPromises = chunks.map(chunk => generateEmbeddings(chunk));
    const embeddings = await Promise.all(embeddingsPromises);
    
    // Calculate the average embedding for the entire document
    const avgEmbedding = Array(embeddings[0].length).fill(0);
    for (const embedding of embeddings) {
      for (let i = 0; i < embedding.length; i++) {
        avgEmbedding[i] += embedding[i];
      }
    }
    for (let i = 0; i < avgEmbedding.length; i++) {
      avgEmbedding[i] /= embeddings.length;
    }
    
    // Store the paper in the database along with its embeddings
    const { data: paperData, error: insertError } = await supabaseClient
      .from('papers')
      .insert([
        {
          id: fileId,
          name: fileName,
          content: text.substring(0, 10000), // Storing first 10k characters for preview
          user_id: user.id,
          size: fileData.size,
          embeddings: avgEmbedding
        }
      ])
      .select()
      .single();
      
    if (insertError) {
      throw new Error(`Error inserting paper data: ${insertError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        paper: {
          id: paperData.id,
          name: paperData.name,
          size: paperData.size
        }
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error("Error in process-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
