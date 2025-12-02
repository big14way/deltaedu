// src/components/quiz/QuizComponent.tsx
'use client';

import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Trophy,
  Loader2,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'long_answer';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  user_answer?: string;
  is_correct?: boolean;
}

interface QuizComponentProps {
  notebookId: string;
  onComplete?: (score: number) => void;
}

export function QuizComponent({ notebookId, onComplete }: QuizComponentProps) {
  const [quiz, setQuiz] = useState<{ id: string; questions: QuizQuestion[] } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    correct: number;
    total: number;
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateQuiz = async () => {
    setIsGenerating(true);
    setResults(null);
    setAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebookId,
          num_questions: 5,
          question_types: ['mcq'],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setQuiz(data.quiz);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quiz.id,
          answers,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResults({
        score: data.score,
        correct: data.correct,
        total: data.total,
      });
      setQuiz(data.quiz);
      setShowExplanation(true);

      if (onComplete) {
        onComplete(data.score);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = quiz?.questions[currentIndex];
  const isLastQuestion = currentIndex === (quiz?.questions.length ?? 0) - 1;
  const progress = quiz ? ((currentIndex + 1) / quiz.questions.length) * 100 : 0;

  // Initial state - no quiz generated
  if (!quiz && !isGenerating) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Test Your Knowledge?</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Generate a quiz based on your notes. The AI will create questions 
            to help you study effectively.
          </p>
          <Button onClick={generateQuiz} size="lg">
            Generate Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium">Generating Your Quiz...</h3>
          <p className="text-muted-foreground text-sm mt-2">
            AI is analyzing your notes and creating questions
          </p>
        </CardContent>
      </Card>
    );
  }

  // Results state
  if (results) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {results.score >= 70 ? (
              <Trophy className="h-16 w-16 text-yellow-500" />
            ) : (
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {results.score >= 70 ? 'Great Job!' : 'Keep Practicing!'}
          </CardTitle>
          <p className="text-4xl font-bold text-primary mt-2">
            {results.score}%
          </p>
          <p className="text-muted-foreground">
            You got {results.correct} out of {results.total} correct
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Review Questions */}
          {showExplanation && quiz?.questions.map((q, idx) => (
            <div 
              key={q.id}
              className={cn(
                'p-4 rounded-lg border',
                q.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              )}
            >
              <div className="flex items-start gap-2">
                {q.is_correct ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">Q{idx + 1}: {q.question}</p>
                  <p className="text-sm mt-1">
                    Your answer: <span className="font-medium">{q.user_answer || 'Not answered'}</span>
                  </p>
                  {!q.is_correct && (
                    <p className="text-sm text-green-700">
                      Correct: {q.correct_answer}
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-sm text-muted-foreground mt-2">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button onClick={generateQuiz} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => setResults(null)} className="flex-1">
              Review Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz in progress
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {quiz?.questions.length}
          </span>
          <span className="text-sm font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {currentQuestion && (
          <>
            <div>
              <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
            </div>

            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => 
                  setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
                }
                className="space-y-3"
              >
                {currentQuestion.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      answers[currentQuestion.id] === option.charAt(0)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => 
                      setAnswers(prev => ({ ...prev, [currentQuestion.id]: option.charAt(0) }))
                    }
                  >
                    <RadioGroupItem 
                      value={option.charAt(0)} 
                      id={`option-${idx}`} 
                    />
                    <Label 
                      htmlFor={`option-${idx}`} 
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'long_answer' && (
              <Textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => 
                  setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))
                }
                placeholder="Type your answer here..."
                rows={5}
              />
            )}
          </>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          
          {isLastQuestion ? (
            <Button 
              onClick={submitQuiz}
              disabled={isSubmitting || Object.keys(answers).length === 0}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={!answers[currentQuestion?.id || '']}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuizComponent;
