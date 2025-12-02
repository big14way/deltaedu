// src/components/upload/FileUploader.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  X, 
  Loader2, 
  CheckCircle,
  FileText,
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  notebookId: string;
  onUploadComplete?: (note: any) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export function FileUploader({ notebookId, onUploadComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setError(null);
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file || !notebookId) return;

    setStatus('uploading');
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('notebook_id', notebookId);
    formData.append('title', title || file.name);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      setStatus('processing');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      setStatus('success');
      
      if (onUploadComplete) {
        onUploadComplete(data.note);
      }

      // Reset after success
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setStatus('idle');
        setProgress(0);
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to upload file');
    }
  };

  const removeFile = () => {
    setFile(null);
    setTitle('');
    setStatus('idle');
    setProgress(0);
    setError(null);
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    return '📃';
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      {!file && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag & drop a file here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supports PDF, DOCX, DOC, TXT (max 10MB)
          </p>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFileIcon(file.type)}</span>
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {status === 'idle' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Title Input */}
          {status === 'idle' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this note"
              />
            </div>
          )}

          {/* Progress Bar */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {status === 'uploading' ? 'Uploading...' : 'Processing with AI...'}
              </p>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Upload complete!</span>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Upload Button */}
          {status === 'idle' && (
            <Button onClick={handleUpload} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process
            </Button>
          )}

          {/* Retry Button */}
          {status === 'error' && (
            <Button onClick={handleUpload} variant="outline" className="w-full">
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUploader;
