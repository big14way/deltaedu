// src/app/dashboard/notes/upload/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  FileText,
  X,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export default function UploadNotesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user from Supabase session
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('[Upload Page] No session found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('[Upload Page] User session found:', session.user.id);
      setUserId(session.user.id);
      setLoading(false);
    }

    getUser();
  }, [router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'text/plain': ['.txt'],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Upload Page] Form submitted');

    if (files.length === 0 || !noteTitle) {
      console.log('[Upload Page] Validation failed:', { filesLength: files.length, noteTitle });
      return;
    }

    if (!userId) {
      console.log('[Upload Page] No userId available');
      toast.error('Please log in to upload notes');
      router.push('/login');
      return;
    }

    setUploading(true);

    try {
      console.log('[Upload Page] Using userId from session:', userId);

      const formData = new FormData();
      formData.append('title', noteTitle);
      formData.append('description', noteDescription);
      formData.append('userId', userId);
      files.forEach((file) => {
        formData.append('files', file);
      });

      console.log('[Upload Page] FormData prepared, sending request to /api/notes/upload');

      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('[Upload Page] Response received:', { status: res.status, ok: res.ok });

      const data = await res.json();
      console.log('[Upload Page] Response data:', data);

      if (!res.ok) {
        console.error('[Upload Page] Upload failed:', data);
        throw new Error(data.details || data.error || 'Upload failed');
      }

      console.log('[Upload Page] Upload successful!');
      toast.success('Notes uploaded successfully!');
      setSuccess(true);

      // Invalidate Next.js cache and redirect
      router.refresh();
      setTimeout(() => {
        router.push('/dashboard/notes');
      }, 1500);
    } catch (error) {
      console.error('[Upload Page] Upload error:', error);
      toast.error('Failed to upload notes. Please try again.');
    } finally {
      console.log('[Upload Page] Upload finished, resetting uploading state');
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
          <p className="text-muted-foreground mb-4">
            Your notes are being processed by AI...
          </p>
          <div className="animate-pulse text-primary">Redirecting to notes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>DeltaEDU</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Study Notes</h1>
          <p className="text-muted-foreground">
            Upload your study materials and let AI create summaries, quizzes, and more
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Note Details */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Note Details</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Biology Chapter 3: Cell Structure"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add any additional context about these notes..."
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Files</h2>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-primary font-medium">Drop the files here...</p>
              ) : (
                <>
                  <p className="font-medium mb-1">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, Word (DOC/DOCX), and Text files
                  </p>
                </>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-background rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={uploading || files.length === 0 || !noteTitle}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Upload & Process
                </>
              )}
            </button>
            <Link
              href="/dashboard"
              className="px-8 py-3 border rounded-md font-medium hover:bg-muted transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
