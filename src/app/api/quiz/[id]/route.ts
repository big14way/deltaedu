// src/app/api/quiz/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;

    const supabase = createAdminClient();

    // Fetch quiz from database
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (error || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      quizId: quiz.id,
      questions: quiz.questions,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questionCount: quiz.question_count,
    });
  } catch (error: any) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Delete quiz (only if it belongs to the user)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)
      .eq('user_id', userId);

    if (error) {
      console.error('Quiz delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete quiz' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error: any) {
    console.error('Quiz delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}
