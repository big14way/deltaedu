// src/app/api/quiz/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, questionCount } = body;

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
- For WAEC or JAMB standards, follow Nigerian curriculum standards
- correctAnswer must be the index (0-3) of the correct option
- Include 4 options for each question
- Provide a brief explanation for each answer

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

    // Generate a simple quiz ID
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({ quizId, questions });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz', details: error.message },
      { status: 500 }
    );
  }
}
