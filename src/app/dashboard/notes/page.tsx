// src/app/dashboard/notes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  ArrowLeft,
  PlusCircle,
  Search,
  Calendar,
  Brain,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  description: string;
  created_at: string;
  file_count: number;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Notes</h1>
            <p className="text-muted-foreground">
              Manage your study materials and AI-generated content
            </p>
          </div>
          <Link
            href="/dashboard/notes/upload"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            Upload Notes
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-card border rounded-lg p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'No notes match your search'
                : 'Upload your first study material to get started'}
            </p>
            <Link
              href="/dashboard/notes/upload"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              Upload Your First Note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold mb-2 line-clamp-2">{note.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {note.description || 'No description'}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="h-3 w-3" />
                  <span>{note.file_count} file(s)</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/notes/${note.id}`}
                    className="flex-1 text-center py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/tutor?noteId=${note.id}`}
                    className="p-2 border rounded-md hover:bg-muted transition-colors"
                    title="Chat with AI"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/dashboard/quiz/generate?noteId=${note.id}`}
                    className="p-2 border rounded-md hover:bg-muted transition-colors"
                    title="Generate Quiz"
                  >
                    <BookOpen className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
