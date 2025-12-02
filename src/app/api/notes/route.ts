// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ notes: [] });
    }

    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ notes: notes || [] });
  } catch (error: any) {
    console.error('Notes API error:', error);
    return NextResponse.json({ notes: [] });
  }
}

