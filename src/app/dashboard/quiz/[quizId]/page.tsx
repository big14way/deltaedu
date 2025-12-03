// src/app/dashboard/quiz/[quizId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronRight,
  Trophy,
  Loader2,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useStudyTimeTracker } from '@/hooks/useStudyTimeTracker';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
  isCorrect?: boolean;
}

interface QuizData {
  quizId: string;
  questions: QuizQuestion[];
  topic?: string;
  difficulty?: string;
  questionCount?: number;
}

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Track study time
  useStudyTimeTracker({
    userId,
    pageType: 'quiz',
    noteId: undefined,
    enabled: !loading && !!quizData && !showResults,
  });

  useEffect(() => {
    loadQuizData();
  }, []);

  // Keyboard navigation for quiz
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (!quizData) return;

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight' && currentIndex < quizData.questions.length - 1) {
        e.preventDefault();
        handleNext();
      } else if (e.key >= '1' && e.key <= '9') {
        const optionIndex = parseInt(e.key) - 1;
        const current = quizData.questions[currentIndex];
        if (current && optionIndex < current.options.length) {
          e.preventDefault();
          handleAnswerSelect(optionIndex);
        }
      }
    };

    if (!showResults && quizData) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentIndex, quizData, showResults]);

  const loadQuizData = async () => {
    try {
      // Get user ID for tracking
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      }

      // Try localStorage first (for quizzes not saved to database)
      const localQuiz = localStorage.getItem(`quiz_${params.quizId}`);
      if (localQuiz) {
        const quiz = JSON.parse(localQuiz);
        setQuizData(quiz);
        setLoading(false);
        return;
      }

      // Fallback: Try to fetch from API
      const res = await fetch(`/api/quiz/${params.quizId}`);

      if (!res.ok) {
        throw new Error('Quiz not found');
      }

      const quiz = await res.json();
      setQuizData(quiz);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      router.push('/dashboard/quiz/generate');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizData) return;

    let correctCount = 0;
    const updatedQuestions = quizData.questions.map((q, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        ...q,
        userAnswer,
        isCorrect,
      };
    });

    const calculatedScore = Math.round((correctCount / quizData.questions.length) * 100);
    setScore(calculatedScore);
    setQuizData({ ...quizData, questions: updatedQuestions });
    setShowResults(true);

    // Save quiz results to database
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);

        await fetch('/api/quiz/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_id: quizData.quizId,
            user_id: user.id,
            topic: quizData.topic || 'General',
            difficulty: quizData.difficulty || 'medium',
            total_questions: quizData.questions.length,
            correct_answers: correctCount,
            score: calculatedScore,
            answers: updatedQuestions,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to save quiz results:', error);
    }
  };

  const handleRetry = () => {
    router.push('/dashboard/quiz/generate');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quizData) {
    return null;
  }

  const currentQuestion = quizData.questions[currentIndex];
  const isLastQuestion = currentIndex === quizData.questions.length - 1;
  const progress = ((currentIndex + 1) / quizData.questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  // Results View
  if (showResults) {
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
                href="/dashboard/quiz/generate"
                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                New Quiz
              </Link>
            </div>
          </div>
        </nav>

        {/* Results Content */}
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-card border rounded-lg p-8 mb-6">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {score >= 70 ? (
                  <Trophy className="h-20 w-20 text-yellow-500" />
                ) : (
                  <BookOpen className="h-20 w-20 text-muted-foreground" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {score >= 70 ? 'Great Job!' : 'Keep Practicing!'}
              </h1>
              <p className="text-6xl font-bold text-primary my-4">{score}%</p>
              <p className="text-muted-foreground text-lg">
                You got {quizData.questions.filter((q) => q.isCorrect).length} out of{' '}
                {quizData.questions.length} correct
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 border px-4 py-3 rounded-md font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                Try New Quiz
              </button>
            </div>
          </div>

          {/* Review Questions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Review Your Answers</h2>
            {quizData.questions.map((question, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg border ${
                  question.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {question.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-3">
                      Q{idx + 1}: {question.question}
                    </p>

                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => {
                        const isUserAnswer = question.userAnswer === optIdx;
                        const isCorrectAnswer = question.correctAnswer === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-md ${
                              isCorrectAnswer
                                ? 'bg-green-100 border border-green-300'
                                : isUserAnswer
                                ? 'bg-red-100 border border-red-300'
                                : 'bg-white border'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">{option}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          💡 Explanation:
                        </p>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Quiz Taking View
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {answeredQuestions} / {quizData.questions.length} answered
              </span>
              <Link
                href="/dashboard/quiz/generate"
                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Exit Quiz
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Quiz Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-4 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Use arrow keys to navigate, numbers 1-4 to select answers, Enter/Space to confirm
          </p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {quizData.questions.length}
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h2 id="question-text" className="text-2xl font-semibold mb-6">{currentQuestion.question}</h2>

            {/* Options */}
            <div className="space-y-3" role="radiogroup" aria-labelledby="question-text">
              {currentQuestion.options.map((option, idx) => (
                <div
                  key={idx}
                  role="radio"
                  aria-checked={answers[currentIndex] === idx}
                  tabIndex={0}
                  onClick={() => handleAnswerSelect(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAnswerSelect(idx);
                    }
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    answers[currentIndex] === idx
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'hover:bg-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        answers[currentIndex] === idx
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      }`}
                      aria-hidden="true"
                    >
                      {answers[currentIndex] === idx && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-base">{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 border rounded-md font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={answeredQuestions === 0}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
                <CheckCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[currentIndex] === undefined}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-6 bg-card border rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Quick Navigation</p>
          <div className="flex flex-wrap gap-2" role="navigation" aria-label="Question navigation">
            {quizData.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to question ${idx + 1}${answers[idx] !== undefined ? ' (answered)' : ''}`}
                aria-current={idx === currentIndex ? 'step' : undefined}
                className={`w-10 h-10 rounded-md font-medium transition-colors ${
                  idx === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[idx] !== undefined
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
