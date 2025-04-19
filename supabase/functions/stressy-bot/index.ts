
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

    // TODO: Add Gemini API integration here
    // For now, return a mock response
    const response = {
      answer: "This is a placeholder response. Gemini integration coming soon!",
      sources: [],
    };

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
