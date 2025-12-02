// src/app/api/notes/upload/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const files = formData.getAll('files') as File[];

    if (!title || files.length === 0) {
      return NextResponse.json(
        { error: 'Title and files are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process files and extract text
    const fileContents: string[] = [];
    for (const file of files) {
      const text = await file.text();
      fileContents.push(text);
    }

    // Create note record
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: session.user.id,
        title,
        description: description || null,
        content: fileContents.join('\n\n'),
        file_count: files.length,
      })
      .select()
      .single();

    if (noteError) {
      console.error('Note creation error:', noteError);
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ note, message: 'Upload successful' });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload notes' },
      { status: 500 }
    );
  }
}
