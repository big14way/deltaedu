// instrumentation.ts
/**
 * Next.js instrumentation file
 * Runs once when the server starts (before any requests are handled)
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate environment variables on server startup
    const { validateEnv } = await import('./src/lib/env');
    validateEnv();
  }
}
