import { NextRequest, NextResponse } from 'next/server';
import { PasswordResetService } from '@/lib/password-reset';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // Validate token parameter
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const validation = await PasswordResetService.validateToken(token);

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        error: validation.error || 'Invalid token'
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Token validation failed' },
      { status: 500 }
    );
  }
}