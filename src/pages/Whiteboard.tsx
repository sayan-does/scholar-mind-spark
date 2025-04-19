
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eraser, PenTool, Square, Circle, BookOpen } from "lucide-react";

type Tool = "pen" | "eraser" | "square" | "circle";

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState<Tool>("pen");
  const [lineWidth, setLineWidth] = useState(5);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      canvas.width = parent.clientWidth;
      canvas.height = 500; // Fixed height
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setStartPos({ x, y });

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.beginPath();
      ctx.arc(x, y, lineWidth * 2, 0, Math.PI * 2, false);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'square') {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      ctx.stroke();
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // In a real implementation, this would save the canvas to the backend
    // For now, we'll just download it as an image
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'whiteboard.png';
    a.click();
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Whiteboard</h1>
          <p className="text-muted-foreground mt-1">
            Visualize your research concepts and ideas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCanvas}>
            <Eraser className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={saveWhiteboard}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Whiteboard Canvas</CardTitle>
          <CardDescription>
            Draw diagrams and visualize your research concepts
          </CardDescription>
          <div className="flex space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <Button 
                variant={tool === "pen" ? "default" : "outline"} 
                size="icon" 
                onClick={() => setTool("pen")}
              >
                <PenTool className="h-4 w-4" />
              </Button>
              <Button 
                variant={tool === "eraser" ? "default" : "outline"} 
                size="icon" 
                onClick={() => setTool("eraser")}
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button 
                variant={tool === "square" ? "default" : "outline"} 
                size="icon" 
                onClick={() => setTool("square")}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button 
                variant={tool === "circle" ? "default" : "outline"} 
                size="icon" 
                onClick={() => setTool("circle")}
              >
                <Circle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="colorPicker" className="text-sm">Color:</label>
              <input 
                id="colorPicker" 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="lineWidth" className="text-sm">Size:</label>
              <input 
                id="lineWidth" 
                type="range" 
                min="1" 
                max="20" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(parseInt(e.target.value))} 
                className="w-24"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 flex justify-center">
          <div className="w-full border rounded-md bg-white">
            <canvas 
              ref={canvasRef} 
              onMouseDown={startDrawing} 
              onMouseMove={draw} 
              onMouseUp={stopDrawing} 
              onMouseOut={stopDrawing}
              className="w-full cursor-crosshair"
            />
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Tip: Use the different tools to create a visual representation of your research
        </CardFooter>
      </Card>
    </div>
  );
}
