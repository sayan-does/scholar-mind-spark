
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Search, Book, MessageSquare } from "lucide-react";

export default function Insights() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Array<{title: string, content: string}>>([]);

  const handleGenerateInsights = () => {
    setLoading(true);
    // Simulate API call to get insights
    setTimeout(() => {
      setInsights([
        {
          title: "Potential Research Direction",
          content: "Based on your notes and papers, there appears to be an opportunity to explore the connection between machine learning techniques and traditional statistical methods for data analysis in research contexts."
        },
        {
          title: "Related Concepts",
          content: "Your work touches on several interconnected fields: natural language processing, retrieval-augmented generation, and knowledge representation. Consider exploring the overlap between these areas for novel insights."
        },
        {
          title: "Research Gap Identified",
          content: "The current literature seems to lack comprehensive studies on the practical applications of RAG in academic research contexts. This could be a valuable direction for your work."
        }
      ]);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground mt-1">
            Get AI-powered insights and suggestions for your research
          </p>
        </div>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Stressy Bot
          </CardTitle>
          <CardDescription>
            Ask questions or get insights based on your research materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="insights" className="flex-1">
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Insights
              </TabsTrigger>
              <TabsTrigger value="ask" className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Ask a Question
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="py-4">
              <div className="space-y-4">
                <div className="text-center py-3">
                  <Lightbulb className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Research Insights</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mt-1">
                    Get AI-generated insights based on your research papers, notes, and whiteboard content
                  </p>
                </div>
                
                <Button 
                  onClick={handleGenerateInsights} 
                  className="w-full py-6"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing your research content...
                    </div>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-5 w-5" />
                      Generate Research Insights
                    </>
                  )}
                </Button>
                
                {insights.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium mb-3">Generated Insights</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {insights.map((insight, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            {insight.title}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="py-2 text-muted-foreground">{insight.content}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ask" className="py-4">
              <div className="space-y-4">
                <div className="text-center py-3">
                  <MessageSquare className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Ask Stressy Bot</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mt-1">
                    Ask specific questions about your research or get help with technical challenges
                  </p>
                </div>
                
                <Textarea 
                  placeholder="Ask a question about your research or technical challenges..." 
                  className="min-h-[100px]"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                
                <Button disabled={!query.trim()} className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Submit Question
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground border-t pt-4">
          Powered by Google Gemini-Flash-2.0
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            Research Knowledge Base
          </CardTitle>
          <CardDescription>
            Your RAG-powered research knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p className="mb-2"><span className="font-medium">RAG Storage Status:</span></p>
            <ul className="space-y-1 list-disc pl-5">
              <li>Research Papers: <span className="font-medium">0 papers</span></li>
              <li>Notes: <span className="font-medium">0 notes</span></li>
              <li>Whiteboard Sketches: <span className="font-medium">0 sketches</span></li>
              <li>Storage Used: <span className="font-medium">0MB / 50MB</span></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
