// src/app/dashboard/quiz/generate/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  BookOpen,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export default function GenerateQuizPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz');

      const data = await res.json();

      // Store quiz data in localStorage for the quiz page to access
      localStorage.setItem(`quiz_${data.quizId}`, JSON.stringify(data));

      // Redirect to quiz taking page
      router.push(`/dashboard/quiz/${data.quizId}`);
    } catch (error) {
      console.error('Quiz generation error:', error);
      alert('Failed to generate quiz. Please try again.');
      setGenerating(false);
    }
  };

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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generate Quiz</h1>
          <p className="text-muted-foreground">
            Create an AI-powered quiz to test your knowledge
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic/Subject */}
          <div className="bg-card border rounded-lg p-6">
            <label htmlFor="topic" className="block text-sm font-medium mb-2">
              Topic or Subject <span className="text-destructive">*</span>
            </label>
            <input
              id="topic"
              type="text"
              required
              className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Biology: Cell Structure, Mathematics: Algebra"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter the topic you want to be quizzed on
            </p>
          </div>

          {/* Difficulty */}
          <div className="bg-card border rounded-lg p-6">
            <label htmlFor="difficulty" className="block text-sm font-medium mb-2">
              Difficulty Level
            </label>
            <select
              id="difficulty"
              className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy - Basic concepts</option>
              <option value="medium">Medium - Standard level</option>
              <option value="hard">Hard - Advanced level</option>
              <option value="waec">WAEC Standard</option>
              <option value="jamb">JAMB Standard</option>
            </select>
          </div>

          {/* Number of Questions */}
          <div className="bg-card border rounded-lg p-6">
            <label htmlFor="questionCount" className="block text-sm font-medium mb-2">
              Number of Questions
            </label>
            <input
              id="questionCount"
              type="number"
              min="5"
              max="50"
              className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            />
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: 10-20 questions
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={generating || !topic}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5" />
                Generate Quiz
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">AI-Powered Quizzes</h3>
              <p className="text-sm text-muted-foreground">
                Our AI generates unique questions tailored to your topic. Each quiz
                is designed to test your understanding and help you identify areas
                for improvement.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
