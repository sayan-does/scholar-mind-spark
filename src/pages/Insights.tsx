
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Search, Book, MessageSquare, FilePlus, FileText, PenTool, BookText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useLocation, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Source {
  title: string;
  content: string;
  type: 'paper' | 'note' | 'whiteboard';
}

interface BotResponse {
  answer: string;
  sources: Source[];
}

export default function Insights() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Array<{title: string, content: string}>>([]);
  const [papers, setPapers] = useState<Array<{id: string, name: string}>>([]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeWhiteboard, setIncludeWhiteboard] = useState(true);
  const [response, setResponse] = useState<BotResponse | null>(null);
  const [storageUsage, setStorageUsage] = useState({
    papers: 0,
    notes: 0, 
    whiteboard: 0,
    total: 0
  });
  
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Load papers and user data
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/login");
        return;
      }
      
      fetchPapers();
      fetchStorageUsage();
    };
    
    checkAuth();
  }, [navigate]);
  
  // Check for papers passed from other screens
  useEffect(() => {
    if (location.state?.selectedPapers) {
      setSelectedPapers(location.state.selectedPapers);
    }
  }, [location.state]);

  const fetchPapers = async () => {
    try {
      const { data, error } = await supabase
        .from('papers')
        .select('id, name')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setPapers(data);
    } catch (error) {
      console.error("Error fetching papers:", error);
      toast({
        variant: "destructive",
        title: "Error loading papers",
        description: error.message
      });
    }
  };
  
  const fetchStorageUsage = async () => {
    try {
      // Get paper count and size
      const { data: paperData, error: paperError } = await supabase
        .from('papers')
        .select('size');
        
      if (paperError) throw paperError;
      
      // Get notes size
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select('content');
        
      let noteSize = 0;
      if (!noteError && noteData && noteData.length > 0) {
        noteSize = new TextEncoder().encode(noteData[0]?.content || "").length;
      }
      
      // Get whiteboard size
      const { data: whiteboardData, error: whiteboardError } = await supabase
        .from('whiteboards')
        .select('content');
        
      let whiteboardSize = 0;
      if (!whiteboardError && whiteboardData && whiteboardData.length > 0) {
        whiteboardSize = new TextEncoder().encode(whiteboardData[0]?.content || "").length;
      }
      
      // Calculate total paper size
      const paperSize = paperData?.reduce((acc, paper) => acc + (paper.size || 0), 0) || 0;
      
      setStorageUsage({
        papers: paperData?.length || 0,
        notes: noteData?.length || 0,
        whiteboard: whiteboardData?.length || 0,
        total: paperSize + noteSize + whiteboardSize
      });
    } catch (error) {
      console.error("Error fetching storage usage:", error);
    }
  };

  const togglePaperSelection = (paperId: string) => {
    setSelectedPapers(prev => 
      prev.includes(paperId)
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const handleGenerateInsights = async () => {
    if (selectedPapers.length === 0 && !includeNotes && !includeWhiteboard) {
      toast({
        variant: "destructive",
        title: "No content selected",
        description: "Please select at least one paper, notes, or whiteboard to generate insights."
      });
      return;
    }
    
    setLoading(true);
    setResponse(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('stressy-bot', {
        body: {
          query: "Generate research insights based on the provided materials. Identify connections between concepts, potential research gaps, and promising research directions.",
          context: {
            papers: selectedPapers.length > 0 ? selectedPapers : undefined,
            notes: includeNotes ? true : undefined,
            whiteboard: includeWhiteboard ? true : undefined
          }
        }
      });
      
      if (error) throw error;
      
      // Process the insights from the response
      const answer = data.answer;
      
      // Extract insights from the response by parsing sections
      const insightSections = answer.split(/(?=##)|(?=#\s)/g)
        .filter(section => section.trim())
        .map(section => {
          const titleMatch = section.match(/^##+\s*(.+)$/m);
          const title = titleMatch ? titleMatch[1].trim() : "Research Insight";
          const content = section.replace(/^##+\s*.+$/m, "").trim();
          return { title, content };
        });
      
      setInsights(insightSections.length > 0 ? insightSections : [
        { title: "Research Insight", content: answer }
      ]);
      
      setResponse(data);
      
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        variant: "destructive",
        title: "Error generating insights",
        description: error.message || "Failed to generate insights."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitQuestion = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('stressy-bot', {
        body: {
          query,
          context: {
            papers: selectedPapers.length > 0 ? selectedPapers : undefined,
            notes: includeNotes ? true : undefined,
            whiteboard: includeWhiteboard ? true : undefined
          }
        }
      });
      
      if (error) throw error;
      
      setResponse(data);
      
    } catch (error) {
      console.error("Error submitting question:", error);
      toast({
        variant: "destructive",
        title: "Error submitting question",
        description: error.message || "Failed to get a response."
      });
    } finally {
      setLoading(false);
    }
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              <TabsTrigger value="context" className="flex-1">
                <FilePlus className="h-4 w-4 mr-2" />
                Select Context
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
                            <p className="py-2 text-muted-foreground whitespace-pre-line">{insight.content}</p>
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
                
                <Button 
                  onClick={handleSubmitQuestion}
                  disabled={!query.trim() || loading} 
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing your question...
                    </div>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Submit Question
                    </>
                  )}
                </Button>
                
                {response && (
                  <div className="mt-4">
                    <div className="rounded-lg border p-4">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-line">{response.answer}</div>
                      </div>
                      
                      {response.sources && response.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Sources:</h4>
                          <ul className="space-y-2">
                            {response.sources.map((source, index) => (
                              <li key={index} className="text-sm flex gap-2">
                                {source.type === 'paper' && <FileText className="h-4 w-4 text-primary flex-shrink-0" />}
                                {source.type === 'note' && <PenTool className="h-4 w-4 text-primary flex-shrink-0" />}
                                {source.type === 'whiteboard' && <BookText className="h-4 w-4 text-primary flex-shrink-0" />}
                                <div>
                                  <span className="font-medium">{source.title}</span>
                                  <p className="text-muted-foreground text-xs">{source.content}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="context" className="py-4">
              <div className="space-y-4">
                <div className="text-center py-3">
                  <FilePlus className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Select Research Context</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mt-1">
                    Choose which research materials to include in your AI queries
                  </p>
                </div>
                
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Research Papers
                  </h4>
                  
                  {papers.length === 0 ? (
                    <p className="text-sm text-muted-foreground my-2">No papers uploaded yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {papers.map(paper => (
                        <div key={paper.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`paper-${paper.id}`}
                            checked={selectedPapers.includes(paper.id)}
                            onCheckedChange={() => togglePaperSelection(paper.id)}
                          />
                          <Label htmlFor={`paper-${paper.id}`} className="text-sm cursor-pointer">
                            {paper.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-t my-3"></div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-notes"
                        checked={includeNotes}
                        onCheckedChange={(checked) => setIncludeNotes(!!checked)}
                      />
                      <Label htmlFor="include-notes" className="flex items-center gap-2 cursor-pointer">
                        <PenTool className="h-4 w-4" />
                        Include Notes
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-whiteboard"
                        checked={includeWhiteboard}
                        onCheckedChange={(checked) => setIncludeWhiteboard(!!checked)}
                      />
                      <Label htmlFor="include-whiteboard" className="flex items-center gap-2 cursor-pointer">
                        <BookText className="h-4 w-4" />
                        Include Whiteboard
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedPapers(papers.map(p => p.id))}
                    className="flex-1"
                    disabled={papers.length === 0}
                  >
                    Select All Papers
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedPapers([]);
                      setIncludeNotes(true);
                      setIncludeWhiteboard(true);
                    }}
                    className="flex-1"
                  >
                    Reset Selection
                  </Button>
                </div>
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
              <li>Research Papers: <span className="font-medium">{storageUsage.papers} papers</span></li>
              <li>Notes: <span className="font-medium">{storageUsage.notes > 0 ? 'Available' : 'No notes'}</span></li>
              <li>Whiteboard Sketches: <span className="font-medium">{storageUsage.whiteboard > 0 ? 'Available' : 'No sketches'}</span></li>
              <li>Storage Used: <span className="font-medium">{formatBytes(storageUsage.total)} / 50MB</span></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
