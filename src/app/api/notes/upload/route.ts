// src/app/api/notes/upload/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const userId = formData.get('userId') as string;
    const files = formData.getAll('files') as File[];

    if (!title || files.length === 0 || !userId) {
      return NextResponse.json(
        { error: 'Title, files, and userId are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Process files and extract text
    const fileContents: string[] = [];
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      let text = '';

      try {
        // Handle different file types
        if (fileName.endsWith('.txt')) {
          // Plain text files
          text = await file.text();
        } else if (fileName.endsWith('.pdf')) {
          // PDF files - extract text using pdf-parse
          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const data = await pdf(buffer);
            text = data.text;

            if (!text || text.trim().length === 0) {
              text = `[Note: ${file.name} appears to be a PDF with no extractable text. It might be an image-based PDF. Please use a text-based PDF or convert the content to plain text.]`;
            }
          } catch (pdfError) {
            console.error('PDF parsing error:', pdfError);
            text = `[Note: Could not extract text from ${file.name}. The PDF might be encrypted or corrupted. Please try converting it to plain text.]`;
          }
        } else if (fileName.endsWith('.docx')) {
          // DOCX files - extract text using mammoth
          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;

            if (!text || text.trim().length === 0) {
              text = `[Note: ${file.name} appears to be empty or could not be read. Please check the file and try again.]`;
            }
          } catch (docxError) {
            console.error('DOCX parsing error:', docxError);
            text = `[Note: Could not extract text from ${file.name}. The file might be corrupted. Please try saving it as a PDF or plain text.]`;
          }
        } else if (fileName.endsWith('.doc')) {
          // Old DOC format - not supported, suggest conversion
          text = `[Note: ${file.name} is an old Word format (.doc). Please:\n1. Open it in Word\n2. Save as .docx or PDF\n3. Re-upload the new file]`;
        } else {
          // Try to read as text anyway
          text = await file.text();
        }
      } catch (e) {
        console.error('File processing error:', e);
        text = `[Unable to extract text from ${file.name}. Please use a plain text (.txt) or PDF file.]`;
      }

      // Remove null bytes and other problematic characters for PostgreSQL
      text = text.replace(/\u0000/g, '').replace(/\0/g, '');

      // Clean up excessive whitespace
      text = text.replace(/\n{3,}/g, '\n\n').trim();

      fileContents.push(text);
    }

    // Create a notebook first or get the default one
    // For simplicity, create a default notebook for this user if it doesn't exist
    const { data: notebook } = await supabase
      .from('notebooks')
      .select('id')
      .eq('user_id', userId)
      .eq('title', 'My Notes')
      .single();

    let notebookId = notebook?.id;

    if (!notebookId) {
      // Create default notebook
      const { data: newNotebook } = await supabase
        .from('notebooks')
        .insert({
          user_id: userId,
          title: 'My Notes',
        })
        .select('id')
        .single();
      notebookId = newNotebook?.id;
    }

    // Create note record with required notebook_id
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        notebook_id: notebookId,
        title,
        content: fileContents.join('\n\n'),
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

    // Log activity
    try {
      await supabase.from('user_activities').insert({
        user_id: userId,
        activity_type: 'note_upload',
        activity_data: {
          note_id: note.id,
          title: title,
        },
      });
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
      // Don't fail the request if activity logging fails
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
