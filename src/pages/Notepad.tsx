
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, PenLine, BookOpen } from "lucide-react";

export default function Notepad() {
  const [title, setTitle] = useState("Untitled Note");
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSave = () => {
    setLastSaved(new Date().toLocaleTimeString());
    // In a real implementation, this would save to the backend
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Notepad</h1>
          <p className="text-muted-foreground mt-1">
            Capture your ideas and research notes
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Note
        </Button>
      </div>

      <Card className="border-2 border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-none h-auto p-0 focus-visible:ring-0"
            />
          </div>
          <CardDescription>
            {lastSaved ? `Last saved at ${lastSaved}` : "Not saved yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Start writing your research notes here..."
            className="min-h-[400px] resize-none border-none focus-visible:ring-0 text-base"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="text-sm text-muted-foreground">
            {content.split(/\s+/).filter(Boolean).length} words
          </div>
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </CardFooter>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        <p>Use this notepad to organize your thoughts and research ideas</p>
        <p>All notes are automatically saved to your RAG storage for AI insights</p>
      </div>
    </div>
  );
}
