
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  query: string;
  context?: {
    papers?: string[];
    notes?: string;
    whiteboard?: string;
  };
}

interface Source {
  title: string;
  content: string;
  type: 'paper' | 'note' | 'whiteboard';
}

serve(async (req) => {
  try {
    const { query, context } = await req.json() as RequestBody;
    
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

    // Prepare context content from the user's data
    let contextContent = '';
    const relevantSources: Source[] = [];
    
    // Add paper context
    if (context?.papers && context.papers.length > 0) {
      const { data: paperData, error: paperError } = await supabaseClient
        .from('papers')
        .select('id, name, content, embeddings')
        .in('id', context.papers)
        .eq('user_id', user.id);
        
      if (paperError) throw new Error(paperError.message);
      
      if (paperData && paperData.length > 0) {
        paperData.forEach(paper => {
          contextContent += `Paper "${paper.name}": ${paper.content}\n\n`;
          relevantSources.push({
            title: paper.name,
            content: paper.content.substring(0, 200) + '...',
            type: 'paper'
          });
        });
      }
    }
    
    // Add notes context
    if (context?.notes) {
      const { data: noteData, error: noteError } = await supabaseClient
        .from('notes')
        .select('id, content')
        .eq('user_id', user.id)
        .single();
        
      if (noteError && noteError.code !== 'PGRST116') throw new Error(noteError.message);
      
      if (noteData) {
        contextContent += `User Notes: ${noteData.content}\n\n`;
        relevantSources.push({
          title: 'Your Notes',
          content: noteData.content.substring(0, 200) + '...',
          type: 'note'
        });
      }
    }
    
    // Add whiteboard context
    if (context?.whiteboard) {
      const { data: whiteboardData, error: whiteboardError } = await supabaseClient
        .from('whiteboards')
        .select('id, content')
        .eq('user_id', user.id)
        .single();
        
      if (whiteboardError && whiteboardError.code !== 'PGRST116') throw new Error(whiteboardError.message);
      
      if (whiteboardData) {
        contextContent += `Whiteboard Content: ${whiteboardData.content}\n\n`;
        relevantSources.push({
          title: 'Your Whiteboard',
          content: 'Visual content from your whiteboard',
          type: 'whiteboard'
        });
      }
    }

    // Call the Gemini API
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent';
    
    const systemPrompt = `
      You are Stressy Bot, an AI research assistant designed to help researchers with their work.
      You analyze research papers, notes, and whiteboard content to provide insights.
      Be concise, accurate, and helpful. Focus on identifying connections between ideas,
      suggesting research directions, and spotting potential research gaps.
      
      When citing information, clearly indicate which source it came from.
    `;
    
    let promptContent = `${systemPrompt}\n\nUser question: ${query}\n\n`;
    
    if (contextContent) {
      promptContent += `Context from user's research materials:\n${contextContent}\n\n`;
    }
    
    promptContent += `Provide a well-structured, insightful response that directly addresses the user's question.`;

    const geminiResponse = await fetch(`${geminiEndpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptContent
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const geminiData = await geminiResponse.json();
    
    let answer = "Sorry, I couldn't generate a response at this time.";
    
    if (geminiData.candidates && geminiData.candidates.length > 0 && 
        geminiData.candidates[0].content && 
        geminiData.candidates[0].content.parts && 
        geminiData.candidates[0].content.parts.length > 0) {
      answer = geminiData.candidates[0].content.parts[0].text;
    } else if (geminiData.error) {
      console.error("Gemini API error:", geminiData.error);
      answer = `Error: ${geminiData.error.message || "Unknown error occurred"}`;
    }

    const response = {
      answer,
      sources: relevantSources,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error("Error in Stressy Bot function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
