// src/lib/env.ts
/**
 * Environment Variable Validation
 * Validates required environment variables at application startup
 */

interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // AI Provider (at least one required)
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const aiProviderVars = ['GROQ_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_AI_API_KEY'];

/**
 * Validates environment variables and throws if any required variables are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check AI provider (at least one required)
  const hasAIProvider = aiProviderVars.some((key) => process.env[key]);
  if (!hasAIProvider) {
    missing.push('At least one AI provider key (GROQ_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY)');
  }

  // Log warnings for optional but recommended variables
  if (!process.env.NEXTAUTH_SECRET) {
    warnings.push('NEXTAUTH_SECRET not set - session management may not work properly');
  }

  // Throw error if any required variables are missing
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\n💡 Copy .env.example to .env and fill in your values\n');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
    console.warn('');
  }

  // Success message
  console.log('✅ Environment variables validated successfully');
}

/**
 * Gets a validated environment variable (server-side only)
 */
export function getEnv(key: keyof EnvConfig): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Checks if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
