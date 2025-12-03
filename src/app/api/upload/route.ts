// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createGroqChatCompletion } from '@/lib/groq-client';

// Use Node.js runtime instead of Edge runtime
export const runtime = 'nodejs';

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
    const supabase = createAdminClient();

    // Get form data from request
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const file = formData.get('file') as File;
    const notebook_id = formData.get('notebook_id') as string;
    const title = formData.get('title') as string;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

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

    // Generate summary using Groq AI
    let summary = '';
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        console.error('GROQ_API_KEY is not set - skipping summary generation');
        // Continue without summary
      } else {
        const completion = await createGroqChatCompletion(apiKey, {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert summarizer. Create concise, accurate summaries of study materials that highlight key points and main ideas.'
            },
            {
              role: 'user',
              content: `Summarize the following study material in 2-3 concise paragraphs:\n\n${extractedText.slice(0, 8000)}`
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        });
        summary = completion.choices[0]?.message?.content || '';
      }
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
        user_id: userId,
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
    const supabase = createAdminClient();

    const body = await request.json();
    const { notebook_id, title, content, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    if (!notebook_id || !title || !content) {
      return NextResponse.json(
        { error: 'notebook_id, title, and content are required' },
        { status: 400 }
      );
    }

    // Generate summary using Groq AI
    let summary = '';
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        console.error('GROQ_API_KEY is not set - skipping summary generation');
        // Continue without summary
      } else {
        const completion = await createGroqChatCompletion(apiKey, {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert summarizer. Create concise, accurate summaries of study materials that highlight key points and main ideas.'
            },
            {
              role: 'user',
              content: `Summarize the following study material in 2-3 concise paragraphs:\n\n${content.slice(0, 8000)}`
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        });
        summary = completion.choices[0]?.message?.content || '';
      }
    } catch (aiError) {
      console.error('Summary generation error:', aiError);
    }

    // Save note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        notebook_id,
        user_id: userId,
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
