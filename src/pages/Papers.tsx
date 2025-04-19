
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Trash, Search, File, Upload, AlertCircle } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

type PaperFile = {
  id: string;
  name: string;
  size: number;
  uploaded: Date;
  processing?: boolean;
  tags?: string[];
}

export default function Papers() {
  const [papers, setPapers] = useState<PaperFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalStorage, setTotalStorage] = useState<number>(0); // in bytes
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch user's papers on component mount
  useEffect(() => {
    fetchPapers();
  }, []);
  
  const fetchPapers = async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!sessionData.session) {
        navigate("/login");
        return;
      }
      
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Calculate total storage
      let storageTotal = 0;
      
      const formattedPapers: PaperFile[] = data.map(paper => {
        storageTotal += paper.size || 0;
        return {
          id: paper.id,
          name: paper.name,
          size: paper.size || 0,
          uploaded: new Date(paper.created_at),
          tags: paper.tags
        };
      });
      
      setPapers(formattedPapers);
      setTotalStorage(storageTotal);
    } catch (error) {
      console.error("Error fetching papers:", error);
      toast({
        variant: "destructive",
        title: "Error fetching papers",
        description: error.message || "Failed to load your research papers."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/login");
        return;
      }
      
      const user = sessionData.session.user;
      const uploadPromises = files.map(async (file) => {
        const fileId = uuidv4();
        const fileName = file.name;
        
        // First upload the file to storage
        const { error: uploadError } = await supabase.storage
          .from('papers')
          .upload(`${user.id}/${fileId}`, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Temporarily add to UI
        const newPaper: PaperFile = {
          id: fileId,
          name: fileName,
          size: file.size,
          uploaded: new Date(),
          processing: true
        };
        
        setPapers(prev => [newPaper, ...prev]);
        setTotalStorage(prev => prev + file.size);
        
        // Now process the PDF to extract text and create embeddings
        const { error: processError } = await supabase.functions.invoke('process-pdf', {
          body: { fileId, fileName }
        });
        
        if (processError) {
          throw processError;
        }
        
        return { id: fileId, success: true };
      });
      
      await Promise.all(uploadPromises);
      
      toast({
        title: "Papers uploaded successfully",
        description: `${files.length} ${files.length === 1 ? 'paper' : 'papers'} uploaded and processed.`
      });
      
      // Refresh the papers list to get the updated data
      fetchPapers();
    } catch (error) {
      console.error("Error uploading papers:", error);
      toast({
        variant: "destructive",
        title: "Error uploading papers",
        description: error.message || "Failed to upload your research papers."
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePaper = async (id: string) => {
    try {
      const paperToDelete = papers.find(paper => paper.id === id);
      if (!paperToDelete) return;
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/login");
        return;
      }
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('papers')
        .remove([`${sessionData.session.user.id}/${id}`]);
        
      if (storageError) {
        throw storageError;
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('papers')
        .delete()
        .eq('id', id);
        
      if (dbError) {
        throw dbError;
      }
      
      // Update UI
      setTotalStorage(prevStorage => prevStorage - paperToDelete.size);
      setPapers(prevPapers => prevPapers.filter(paper => paper.id !== id));
      
      toast({
        title: "Paper deleted",
        description: `"${paperToDelete.name}" has been removed.`
      });
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast({
        variant: "destructive",
        title: "Error deleting paper",
        description: error.message || "Failed to delete the research paper."
      });
    }
  };

  const navigateToInsights = () => {
    navigate("/insights", { 
      state: { 
        selectedPapers: papers.map(p => p.id) 
      } 
    });
  };

  const filteredPapers = papers.filter(paper => 
    paper.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Research Papers</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your research papers</p>
        </div>
      </div>
      
      <Tabs defaultValue="collection" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collection">Paper Collection</TabsTrigger>
          <TabsTrigger value="upload">Upload Papers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collection" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Paper Collection</span>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search papers..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardTitle>
              <CardDescription>
                Storage used: {formatBytes(totalStorage)} of 50MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading your papers...</p>
                </div>
              ) : filteredPapers.length > 0 ? (
                <div className="space-y-2">
                  {filteredPapers.map((paper) => (
                    <div key={paper.id} className="flex items-center justify-between p-3 rounded-md border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium">{paper.name}</span>
                          <div className="text-xs text-muted-foreground">
                            {formatBytes(paper.size)} • Uploaded {paper.uploaded.toLocaleDateString()}
                            {paper.processing && (
                              <span className="ml-2 text-amber-500 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Processing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deletePaper(paper.id)} className="text-red-500">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No papers uploaded</h3>
                  <p className="text-muted-foreground mt-2">
                    Upload your research papers to get started
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground border-t pt-4">
              <div className="flex justify-between items-center w-full">
                <span>{papers.length} papers uploaded</span>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  disabled={papers.length === 0}
                  onClick={navigateToInsights}
                >
                  <File className="h-4 w-4" />
                  Analyze Papers
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Research Papers</CardTitle>
              <CardDescription>
                Add papers to your RAG storage for AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                onFilesChange={handleFilesChange}
                maxSize={50}
                acceptedFileTypes={['.pdf']}
                maxFiles={20}
                className={uploading ? "opacity-50 pointer-events-none" : ""}
              />
              
              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  <span>Uploading and processing your papers...</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground border-t pt-4">
              Upload PDF files of your research papers to include them in your knowledge base
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
