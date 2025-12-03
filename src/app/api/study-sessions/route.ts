// src/app/api/study-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, page_type, note_id, duration, started_at, ended_at } = body;

    if (!user_id || !page_type || !duration) {
      return NextResponse.json(
        { error: 'user_id, page_type, and duration are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Insert study session
    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id,
        page_type,
        note_id,
        duration,
        started_at: started_at || new Date().toISOString(),
        ended_at: ended_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Study session insert error:', error);
      return NextResponse.json(
        { error: 'Failed to log study session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
      message: 'Study session logged successfully',
    });
  } catch (error: any) {
    console.error('Study sessions API error:', error);
    return NextResponse.json(
      { error: 'Failed to log study session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch user's study sessions
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Study sessions fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch study sessions' },
        { status: 500 }
      );
    }

    // Calculate total study time
    const totalSeconds = sessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    return NextResponse.json({
      sessions: sessions || [],
      count: sessions?.length || 0,
      totalStudyTime: totalHours,
    });
  } catch (error: any) {
    console.error('Study sessions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study sessions' },
      { status: 500 }
    );
  }
}
