// src/types/index.ts

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'teacher';
  created_at: string;
}

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  notes_count?: number;
}

export interface Note {
  id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  content: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  notebook_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'long_answer';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  user_answer?: string;
  is_correct?: boolean;
}

export interface Quiz {
  id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  questions: QuizQuestion[];
  score?: number;
  completed_at?: string;
  created_at: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Chat types
export interface ChatRequest {
  message: string;
  notebook_id: string;
  context?: string[];
}

export interface QuizGenerateRequest {
  notebook_id: string;
  num_questions?: number;
  question_types?: ('mcq' | 'long_answer')[];
}
