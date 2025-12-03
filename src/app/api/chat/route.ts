// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createAdminClient } from '@/lib/supabase/server';

// Use Node.js runtime instead of Edge runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check if Groq API key is available
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const { messages, noteId, userId } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Fetch note content if noteId is provided for context-aware responses
    let noteContext = '';
    if (noteId && userId) {
      try {
        const supabase = createAdminClient();
        const { data: note } = await supabase
          .from('notes')
          .select('title, content')
          .eq('id', noteId)
          .eq('user_id', userId)
          .single();

        if (note) {
          // Truncate content to avoid token limits (keep first 3000 chars)
          const truncatedContent = note.content.substring(0, 3000);
          noteContext = `\n\nSTUDY MATERIAL CONTEXT:\nTitle: ${note.title}\n\nContent:\n${truncatedContent}${note.content.length > 3000 ? '\n[...content truncated...]' : ''}`;
        }
      } catch (error) {
        console.error('Error fetching note context:', error);
      }
    }

    // Format messages for Groq
    const formattedMessages = [
      {
        role: 'system',
        content: `You are an expert AI tutor helping students learn and master various subjects. You are patient, encouraging, and provide clear, detailed explanations.

GUIDELINES:
- Answer questions based on the student's study material when provided
- Break down complex concepts into simple, understandable parts
- Use examples and analogies to clarify difficult topics
- Encourage critical thinking by asking follow-up questions
- If the study material is provided, focus your answers on that specific content

FOR EXAM PREPARATION (WAEC/NECO/JAMB):
- Align explanations with Nigerian curriculum standards
- Focus on exam-style questions and common patterns
- Provide tips for answering multiple-choice and essay questions

FOR TECH LEARNING (Programming, Web Development, etc.):
- Explain programming concepts using beginner-friendly language
- Provide simple code examples when explaining JavaScript, HTML, CSS, Python, etc.
- Start from fundamentals and build up to more complex topics
- Emphasize practical applications and real-world use cases
- Encourage hands-on practice and experimentation
- Suggest mini-projects to reinforce learning

Be supportive, motivational, and adapt your teaching style to the subject matter - whether it's academic subjects for exams or technical skills for beginners.${noteContext}`,
      },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    // Use llama-3.3-70b-versatile (FREE, powerful, and fast)
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const text = completion.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({ message: text });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat', details: error.message },
      { status: 500 }
    );
  }
}

