// src/app/api/activity/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, activity_type, activity_data } = body;

    if (!user_id || !activity_type) {
      return NextResponse.json(
        { error: 'User ID and activity type are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Insert activity
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id,
        activity_type,
        activity_data: activity_data || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity: data });
  } catch (error: any) {
    console.error('Activity log error:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
