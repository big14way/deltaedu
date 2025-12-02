// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

// Extract text from file based on type
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (fileType === 'application/pdf') {
    // PDF extraction
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    // DOCX extraction
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (fileType === 'text/plain') {
    // Plain text
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Chunk text for processing
export function chunkText(text: string, maxChunkSize: number = 2000): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

// Calculate reading time
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF, DOCX, and TXT files are supported' };
  }

  return { valid: true };
}

// Score quiz
export function scoreQuiz(
  questions: Array<{ correct_answer: string; user_answer?: string; type: string }>
): { score: number; total: number; percentage: number } {
  let correct = 0;
  const total = questions.length;

  for (const q of questions) {
    if (q.type === 'mcq') {
      if (q.user_answer?.toUpperCase() === q.correct_answer.toUpperCase()) {
        correct++;
      }
    }
    // Long answer questions need manual or AI grading
  }

  return {
    score: correct,
    total,
    percentage: Math.round((correct / total) * 100),
  };
}

// Subject colors for UI
export const subjectColors: Record<string, string> = {
  Mathematics: 'bg-blue-500',
  English: 'bg-green-500',
  Physics: 'bg-purple-500',
  Chemistry: 'bg-orange-500',
  Biology: 'bg-emerald-500',
  Economics: 'bg-yellow-500',
  Government: 'bg-red-500',
  Literature: 'bg-pink-500',
  default: 'bg-gray-500',
};

export function getSubjectColor(subject?: string): string {
  return subjectColors[subject || 'default'] || subjectColors.default;
}
