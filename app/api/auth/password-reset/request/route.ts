import { NextRequest, NextResponse } from 'next/server';
import { PasswordResetService } from '@/lib/password-reset';
import { rateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';

// Rate limiting for password reset requests (max 3 per hour per IP)
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per hour
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const { success } = await limiter.check(ip, 3); // 3 requests per hour

    if (!success) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await PasswordResetService.getUserByEmail(normalizedEmail);
    
    // Always return success to prevent email enumeration
    // but only send email if user exists
    if (user) {
      try {
        const resetToken = await PasswordResetService.createResetToken(normalizedEmail, {
          ipAddress: ip,
          userAgent: request.headers.get('user-agent'),
        });
        
        if (resetToken) {
          const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.APP_URL ||
            request.nextUrl.origin;

          const resetLink = `${baseUrl.replace(/\/$/, '')}/password-reset?token=${encodeURIComponent(
            resetToken.token
          )}`;

          const emailResult = await sendPasswordResetEmail({
            to: normalizedEmail,
            name: user.name,
            resetLink,
            expiresAt: resetToken.expires_at,
            ipAddress: ip,
            userAgent: request.headers.get('user-agent'),
          });

          if (!emailResult.delivered && !emailResult.skipped) {
            console.error('Password reset email failed to send', emailResult.error);
          }

          if (emailResult.skipped) {
            console.info('Password reset email delivery skipped; reset link logged for development:', {
              email: normalizedEmail,
              resetLink,
            });
          }
        }
      } catch (error) {
        console.error('Error generating reset token:', error);
        // Still return success to prevent enumeration
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
