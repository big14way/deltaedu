// src/app/api/quiz/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SYSTEM_PROMPTS, createQuizPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      notebook_id, 
      num_questions = 5, 
      question_types = ['mcq', 'long_answer'] 
    } = body;

    if (!notebook_id) {
      return NextResponse.json(
        { error: 'notebook_id is required' },
        { status: 400 }
      );
    }

    // Fetch notes from the notebook
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('content, title')
      .eq('notebook_id', notebook_id);

    if (notesError || !notes || notes.length === 0) {
      return NextResponse.json(
        { error: 'No notes found in this notebook' },
        { status: 400 }
      );
    }

    // Combine notes content
    const combinedContent = notes
      .map(note => `## ${note.title}\n${note.content}`)
      .join('\n\n');

    // Generate quiz using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.QUIZ_GENERATOR },
        { role: 'user', content: createQuizPrompt(combinedContent, num_questions, question_types) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0].message.content || '';
    
    // Parse the JSON response
    let quizData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', parseError);
      return NextResponse.json(
        { error: 'Failed to generate quiz format' },
        { status: 500 }
      );
    }

    // Get notebook title for quiz title
    const { data: notebook } = await supabase
      .from('notebooks')
      .select('title')
      .eq('id', notebook_id)
      .single();

    // Save quiz to database
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        notebook_id,
        user_id: user.id,
        title: `Quiz: ${notebook?.title || 'Study Session'}`,
        questions: quizData.questions,
      })
      .select()
      .single();

    if (quizError) {
      throw quizError;
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

// Submit quiz answers
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quiz_id, answers } = body;

    if (!quiz_id || !answers) {
      return NextResponse.json(
        { error: 'quiz_id and answers are required' },
        { status: 400 }
      );
    }

    // Get the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quiz_id)
      .eq('user_id', user.id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const gradedQuestions = quiz.questions.map((q: any) => {
      const userAnswer = answers[q.id];
      let isCorrect = false;

      if (q.type === 'mcq') {
        isCorrect = userAnswer?.toUpperCase() === q.correct_answer.toUpperCase();
        if (isCorrect) correctCount++;
      }

      return {
        ...q,
        user_answer: userAnswer,
        is_correct: isCorrect,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    // Update quiz with answers and score
    const { data: updatedQuiz, error: updateError } = await supabase
      .from('quizzes')
      .update({
        questions: gradedQuestions,
        score,
        completed_at: new Date().toISOString(),
      })
      .eq('id', quiz_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      quiz: updatedQuiz,
      score,
      correct: correctCount,
      total: quiz.questions.length,
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
