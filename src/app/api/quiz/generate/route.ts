// src/app/api/quiz/generate/route.ts
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

    const groq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: false,
    });

    const body = await request.json();
    const { topic, difficulty, questionCount, userId } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `Generate a multiple-choice quiz on the topic: "${topic}" with ${questionCount} questions at ${difficulty} difficulty level.

Format the response as a valid JSON array with this EXACT structure:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

REQUIREMENTS:
- Make questions clear, educational, and appropriate for ${difficulty} level
- For WAEC, NECO, or JAMB standards, follow Nigerian curriculum standards
- For tech/programming topics (JavaScript, HTML, CSS, Python, etc.), create practical coding questions that test understanding of concepts
- correctAnswer must be the index (0-3) of the correct option
- Include 4 options for each question
- Provide a brief explanation for each answer that helps reinforce learning

CRITICAL: Return ONLY the JSON array with no markdown formatting, no \`\`\`json\`\`\`, no additional text.`;

    // Use llama-3.3-70b-versatile (FREE and powerful)
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator that creates educational multiple-choice questions. You MUST respond with ONLY valid JSON, no markdown, no extra text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
      top_p: 1,
    });

    let text = completion.choices[0]?.message?.content || '[]';

    // Clean up response - remove markdown and extra text
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Find JSON array in the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const questions = JSON.parse(text);

    // Validate questions structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }

    // Try to save quiz to database if userId is provided
    if (userId) {
      try {
        const supabase = createAdminClient();

        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            user_id: userId,
            topic,
            difficulty,
            question_count: questionCount,
            questions,
          })
          .select()
          .single();

        if (quizError) {
          console.error('Error saving quiz (non-fatal):', quizError);
          // Don't fail - fall through to generated ID
        } else if (quiz) {
          // Successfully saved to database
          return NextResponse.json({
            quizId: quiz.id,
            questions,
            topic,
            difficulty,
            questionCount,
          });
        }
      } catch (dbError) {
        console.error('Database save failed (non-fatal):', dbError);
        // Continue with fallback
      }
    }

    // Fallback to generated ID (works without database)
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      quizId,
      questions,
      topic,
      difficulty,
      questionCount
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz', details: error.message },
      { status: 500 }
    );
  }
}
