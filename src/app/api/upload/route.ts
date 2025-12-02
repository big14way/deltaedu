// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { SYSTEM_PROMPTS, createSummaryPrompt } from '@/lib/prompts';

// Dynamic import for pdf-parse to handle edge runtime issues
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const notebook_id = formData.get('notebook_id') as string;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!notebook_id) {
      return NextResponse.json(
        { error: 'notebook_id is required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Extract text based on file type
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = '';

    try {
      if (file.type === 'application/pdf') {
        extractedText = await extractPdfText(buffer);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        extractedText = await extractDocxText(buffer);
      } else if (file.type === 'text/plain') {
        extractedText = buffer.toString('utf-8');
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' },
          { status: 400 }
        );
      }
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      return NextResponse.json(
        { error: 'Failed to extract text from file' },
        { status: 500 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No text content found in file' },
        { status: 400 }
      );
    }

    // Generate summary using AI
    let summary = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.SUMMARIZER },
          { role: 'user', content: createSummaryPrompt(extractedText.slice(0, 8000)) },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });
      summary = completion.choices[0].message.content || '';
    } catch (aiError) {
      console.error('Summary generation error:', aiError);
      // Continue without summary
    }

    // Save note to database
    const noteTitle = title || file.name.replace(/\.[^/.]+$/, '');
    
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        notebook_id,
        user_id: user.id,
        title: noteTitle,
        content: extractedText,
        summary,
      })
      .select()
      .single();

    if (noteError) {
      throw noteError;
    }

    return NextResponse.json({
      note,
      message: 'File uploaded and processed successfully',
      summary_generated: !!summary,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// Upload text directly (for copy-paste)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notebook_id, title, content } = body;

    if (!notebook_id || !title || !content) {
      return NextResponse.json(
        { error: 'notebook_id, title, and content are required' },
        { status: 400 }
      );
    }

    // Generate summary
    let summary = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.SUMMARIZER },
          { role: 'user', content: createSummaryPrompt(content.slice(0, 8000)) },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });
      summary = completion.choices[0].message.content || '';
    } catch (aiError) {
      console.error('Summary generation error:', aiError);
    }

    // Save note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        notebook_id,
        user_id: user.id,
        title,
        content,
        summary,
      })
      .select()
      .single();

    if (noteError) {
      throw noteError;
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Text upload error:', error);
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    );
  }
}
