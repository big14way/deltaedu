// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get total notes count
    const { count: totalNotes, error: notesError } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (notesError) {
      console.error('Error fetching notes count:', notesError);
    }

    // Get quizzes completed count
    const { count: quizzesTaken, error: quizzesError } = await supabase
      .from('quiz_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (quizzesError) {
      console.error('Error fetching quizzes count:', quizzesError);
    }

    // Get average score from quiz results
    const { data: scoreData, error: scoresError } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('user_id', userId);

    let averageScore = 0;
    if (!scoresError && scoreData && scoreData.length > 0) {
      const totalScore = scoreData.reduce((sum, item) => sum + item.score, 0);
      averageScore = Math.round(totalScore / scoreData.length);
    }

    // Get total study time in hours from study sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('duration')
      .eq('user_id', userId);

    let studyTime = 0;
    if (!sessionsError && sessionsData && sessionsData.length > 0) {
      const totalSeconds = sessionsData.reduce((sum, item) => sum + item.duration, 0);
      // Convert seconds to hours and round to 1 decimal place
      studyTime = Math.round((totalSeconds / 3600) * 10) / 10;
    }

    // Return stats
    return NextResponse.json({
      stats: {
        totalNotes: totalNotes || 0,
        quizzesTaken: quizzesTaken || 0,
        studyTime: studyTime,
        averageScore: averageScore,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    );
  }
}
