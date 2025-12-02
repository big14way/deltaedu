// src/app/dashboard/notes/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Calendar,
  Loader2,
  MessageSquare,
  BookOpen,
  Brain,
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    fetchNoteDetails();
  }, []);

  const fetchNoteDetails = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const res = await fetch(`/api/notes/${params.id}?userId=${user.id}`);

      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
        // Auto-generate summary
        generateSummary(data.note.content);
      } else {
        router.push('/dashboard/notes');
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
      router.push('/dashboard/notes');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (content: string) => {
    setSummarizing(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Please provide a concise summary of the following study material in 3-5 bullet points:\n\n${content.substring(0, 3000)}`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.message);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary('Unable to generate summary at this time.');
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!note) {
    return null;
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
              href="/dashboard/notes"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Notes
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Note Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{note.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              href={`/dashboard/tutor?noteId=${note.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              Chat with AI Tutor
            </Link>
            <Link
              href={`/dashboard/quiz/generate?noteId=${note.id}`}
              className="flex-1 flex items-center justify-center gap-2 border px-4 py-3 rounded-md font-medium hover:bg-muted transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              Generate Quiz
            </Link>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Summary</h2>
          </div>
          {summarizing ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating summary...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{summary}</p>
            </div>
          )}
        </div>

        {/* Note Content */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Full Content</h2>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {note.content}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
