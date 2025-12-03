// src/app/api/quiz/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch user's quiz history with results
    const { data: quizHistory, error } = await supabase
      .from('quiz_results')
      .select(`
        id,
        quiz_id,
        topic,
        difficulty,
        total_questions,
        correct_answers,
        score,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Quiz history fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: quizHistory || [],
      count: quizHistory?.length || 0,
    });
  } catch (error: any) {
    console.error('Quiz history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz history' },
      { status: 500 }
    );
  }
}
