import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/db_existing';
import { daileyCoreAuth } from '@/lib/auth/dailey-core';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    console.log('🎭 Castingly Login Attempt:', email);
    
    // First, try Dailey Core authentication
    try {
      const coreAuthResult = await daileyCoreAuth.login(email, password);

      if ('mfa_required' in coreAuthResult) {
        console.log('🔐 Dailey Core requires MFA for:', email);
        return NextResponse.json({
          mfa_required: true,
          challenge_token: coreAuthResult.challenge_token,
          challenge_id: coreAuthResult.challenge_id,
          challenge_expires_in: coreAuthResult.challenge_expires_in,
          mfa_type: coreAuthResult.mfa_type,
          methods: coreAuthResult.methods,
          user: coreAuthResult.user,
          source: 'dailey-core'
        });
      }

      const castinglyUser = daileyCoreAuth.mapToCastinglyUser(coreAuthResult.user);
      
      console.log('✅ Dailey Core authentication successful for:', email);
      
      // Return user data in Castingly format with Dailey Core token
      return NextResponse.json({
        user: castinglyUser,
        token: coreAuthResult.access_token,
        refresh_token: coreAuthResult.refresh_token,
        source: 'dailey-core'
      });
      
    } catch (coreError: any) {
      console.log('🎭 Dailey Core auth failed, trying legacy auth:', coreError.message);
      
      // Fallback to legacy Castingly authentication
      try {
        const user = await auth.verifyPassword(email, password);
        
        if (!user) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }
        
        // Generate legacy JWT token
        const token = jwt.sign(
          { 
            id: user.id,
            email: user.email,
            role: user.role
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        console.log('✅ Legacy authentication successful for:', email);
        
        // Return user data in Castingly format
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar_url: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=9C27B0&color=fff`,
            email_verified: user.email_verified,
            forum_display_name: user.forum_display_name || user.name,
            forum_signature: user.forum_signature || null,
            is_verified_professional: Boolean(user.is_verified_professional),
            is_investor: Boolean(user.is_investor),
            forum_last_seen_at: user.forum_last_seen_at ? new Date(user.forum_last_seen_at).toISOString() : null
          },
          token,
          source: 'legacy'
        });
        
      } catch (legacyError) {
        console.error('❌ Both Dailey Core and legacy auth failed:', legacyError);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    }
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
