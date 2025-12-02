// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createAdminClient } from '@/lib/supabase/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
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
        content: `You are an expert AI tutor helping students understand their study materials. You are patient, encouraging, and provide clear, detailed explanations.

GUIDELINES:
- Answer questions based on the student's study material when provided
- Break down complex concepts into simple, understandable parts
- Use examples and analogies to clarify difficult topics
- Encourage critical thinking by asking follow-up questions
- If the study material is provided, focus your answers on that specific content
- For WAEC/JAMB students, align explanations with Nigerian curriculum standards
- Be supportive and motivational${noteContext}`,
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

