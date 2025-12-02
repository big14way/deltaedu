// src/app/api/quiz/results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      quiz_id,
      user_id,
      topic,
      difficulty,
      total_questions,
      correct_answers,
      score,
      answers,
    } = body;

    if (!quiz_id || !user_id) {
      return NextResponse.json(
        { error: 'Quiz ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Insert quiz result into database
    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        quiz_id,
        user_id,
        topic,
        difficulty,
        total_questions,
        correct_answers,
        score,
        answers,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving quiz result:', error);
      return NextResponse.json(
        { error: 'Failed to save quiz result', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (error: any) {
    console.error('Quiz results API error:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz result', details: error.message },
      { status: 500 }
    );
  }
}
