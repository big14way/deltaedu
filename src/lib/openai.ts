// src/lib/openai.ts
import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Alternative: Use Google Gemini (free tier, no credit card needed)
// Uncomment below and comment out OpenAI if you prefer Gemini

/*
import { GoogleGenerativeAI } from '@google/generative-ai';

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
*/

// Helper function to generate chat completion
export async function generateChatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo', // Use 'gpt-4' for better quality, 'gpt-3.5-turbo' for speed
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 1000,
    stream: options?.stream ?? false,
  });

  if (options?.stream) {
    return response;
  }

  return response.choices[0].message.content;
}

// Helper for streaming responses
export async function* streamChatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Generate embeddings for semantic search
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}
