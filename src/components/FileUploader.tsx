
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxSize?: number; // in MB
  acceptedFileTypes?: string[];
  maxFiles?: number;
  className?: string;
}

export function FileUploader({
  onFilesChange,
  maxSize = 50,
  acceptedFileTypes = ['.pdf'],
  maxFiles = 10,
  className
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFiles = (files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const fileArray = Array.from(files);
    
    if (selectedFiles.length + fileArray.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files`);
      return validFiles;
    }
    
    let totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    
    for (const file of fileArray) {
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension) && !acceptedFileTypes.includes('*')) {
        setError(`File "${file.name}" is not a supported file type`);
        continue;
      }
      
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the maximum file size of ${maxSize}MB`);
        continue;
      }
      
      // Check total size
      if ((totalSize + file.size) > (maxSize * 1024 * 1024)) {
        setError(`Total file size exceeds the maximum of ${maxSize}MB`);
        break;
      }
      
      totalSize += file.size;
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        const newFiles = [...selectedFiles, ...validFiles];
        setSelectedFiles(newFiles);
        onFilesChange(newFiles);
        setError(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        const newFiles = [...selectedFiles, ...validFiles];
        setSelectedFiles(newFiles);
        onFilesChange(newFiles);
        setError(null);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
    setError(null);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center",
          dragActive ? "border-primary bg-primary/5" : "border-muted",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input 
          id="file-upload" 
          type="file" 
          multiple 
          accept={acceptedFileTypes.join(',')} 
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col space-y-1 text-center">
            <h3 className="text-base font-medium">
              Drag & drop your files here
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>
          <Button size="sm" asChild>
            <label htmlFor="file-upload">Select Files</label>
          </Button>
          <p className="text-xs text-muted-foreground">
            {acceptedFileTypes.join(', ')} files up to {maxSize}MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          <div className="rounded-md border">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
