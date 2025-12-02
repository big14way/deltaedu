// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Create user with email confirmation disabled for development
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 400 }
      );
    }

    // Check if email confirmation is required
    if (authData.session) {
      // User is automatically signed in (email confirmation disabled)
      return NextResponse.json({
        message: 'Registration successful',
        user: authData.user,
        session: authData.session,
      });
    } else {
      // Email confirmation required
      return NextResponse.json({
        message: 'Registration successful. Please check your email for confirmation.',
        user: authData.user,
        requiresEmailConfirmation: true,
      });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
