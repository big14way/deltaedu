// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ notes: [] });
    }

    const supabase = createAdminClient();

    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Notes fetch error:', error);
      return NextResponse.json({ notes: [] });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error: any) {
    console.error('Notes API error:', error);
    return NextResponse.json({ notes: [] });
  }
}

