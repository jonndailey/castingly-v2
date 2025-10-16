/**
 * Dailey Core Authentication Client for Castingly
 * Handles authentication with the centralized Dailey Core auth system
 */

export interface DaileyCoreUser {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
  email_verified: boolean;
  status: string;
  tenant_id?: string;
  profile_image?: string;
}

export interface DaileyCoreAuthResponse {
  user: DaileyCoreUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface DaileyCoreMfaChallengeResponse {
  mfa_required: true;
  challenge_token: string;
  challenge_id?: string;
  challenge_expires_in: number;
  mfa_type: string;
  methods?: string[];
  user: {
    id: string;
    email: string;
    name?: string;
    email_verified?: boolean;
  };
}

export interface DaileyCoreValidateResponse {
  valid: boolean;
  user: DaileyCoreUser;
  roles: string[];
}

class DaileyCoreAuthClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret?: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'http://100.105.97.19:3002';
    this.clientId = 'castingly-client';
    this.clientSecret = process.env.CASTINGLY_CLIENT_SECRET;
  }

  /**
   * Authenticate user with Dailey Core
   */
  async login(email: string, password: string): Promise<DaileyCoreAuthResponse | DaileyCoreMfaChallengeResponse> {
    console.log(`🎭 Castingly → Dailey Core Auth: Attempting login for ${email}`);
    
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
        'User-Agent': 'Castingly/2.0'
      },
      body: JSON.stringify({
        email,
        password,
        app_slug: 'castingly'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('🎭 Dailey Core Auth Error:', data);
      throw new Error(data.error || 'Authentication failed');
    }

    if ((data as DaileyCoreMfaChallengeResponse).mfa_required) {
      console.log('🔐 Dailey Core MFA challenge required for', email);
      return data as DaileyCoreMfaChallengeResponse;
    }

    console.log('✅ Dailey Core Auth Success:', { user: data.user?.email, roles: data.user?.roles });
    return data;
  }

  /**
   * Complete an MFA challenge
   */
  async verifyMfaChallenge(params: {
    challengeToken: string;
    code?: string;
    backupCode?: string;
  }): Promise<DaileyCoreAuthResponse> {
    const { challengeToken, code, backupCode } = params;

    if (!challengeToken) {
      throw new Error('Challenge token is required');
    }

    if (!code && !backupCode) {
      throw new Error('MFA code or backup code is required');
    }

    const payload: Record<string, unknown> = {
      token: challengeToken,
      app_slug: 'castingly',
      app_name: 'Castingly'
    };

    if (code) {
      payload.code = code;
    }

    if (backupCode) {
      payload.backup_code = backupCode;
    }

    const response = await fetch(`${this.baseUrl}/auth/mfa/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
        'User-Agent': 'Castingly/2.0'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('🎭 Dailey Core MFA verification error:', data);
      throw new Error(data.error || 'MFA verification failed');
    }

    console.log('✅ Dailey Core MFA verification success for', data.user?.email);
    return data as DaileyCoreAuthResponse;
  }

  /**
   * Validate JWT token with Dailey Core
   */
  async validateToken(token: string): Promise<DaileyCoreValidateResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Client-Id': this.clientId,
          'User-Agent': 'Castingly/2.0'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🎭 Token validation failed:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<DaileyCoreAuthResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Castingly/2.0'
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          client_id: this.clientId
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      console.log('🔄 Token refreshed successfully');
      return data;
    } catch (error) {
      console.error('🎭 Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Castingly/2.0'
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });
      console.log('🎭 Logout successful');
    } catch (error) {
      console.error('🎭 Logout error:', error);
      // Continue with local logout even if server logout fails
    }
  }

  /**
   * Map Dailey Core user to Castingly user format
   */
  mapToCastinglyUser(coreUser: DaileyCoreUser): {
    id: string;
    email: string;
    name: string;
    role: 'actor' | 'agent' | 'casting_director' | 'admin' | 'investor';
    avatar_url: string;
    email_verified: boolean;
    forum_display_name: string;
    forum_signature: string | null;
    is_verified_professional: boolean;
    is_investor: boolean;
    forum_last_seen_at: string | null;
  } {
    // Map Dailey Core roles to Castingly roles
    const castinglyRole = this.mapToCastinglyRole(coreUser.roles);
    const normalizedRoles = (coreUser.roles || []).map((role) => role.toLowerCase());
    
    const isInvestor =
      normalizedRoles.includes('investor') ||
      normalizedRoles.includes('vip_investor') ||
      normalizedRoles.includes('partner.investor');

    const isVerifiedProfessional =
      normalizedRoles.includes('verified_professional') ||
      normalizedRoles.includes('professional.verified') ||
      normalizedRoles.includes('vip') ||
      normalizedRoles.includes('vip_professional');
    
    // Build full name
    const name = coreUser.name || 
                 `${coreUser.first_name || ''} ${coreUser.last_name || ''}`.trim() ||
                 coreUser.email.split('@')[0];

    // Generate avatar URL
    const avatar_url = coreUser.profile_image || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9C27B0&color=fff`;

    return {
      id: coreUser.id,
      email: coreUser.email,
      name,
      role: castinglyRole,
      avatar_url,
      email_verified: coreUser.email_verified,
      forum_display_name: name,
      forum_signature: null,
      is_verified_professional: isVerifiedProfessional,
      is_investor: isInvestor,
      forum_last_seen_at: null
    };
  }

  /**
   * Map Dailey Core roles to Castingly role
  */
  private mapToCastinglyRole(coreRoles: string[]): 'actor' | 'agent' | 'casting_director' | 'admin' | 'investor' {
    const roles = coreRoles || [];
    // Priority order: admin > casting_director > agent > actor (default)
    if (roles.includes('admin') || roles.includes('tenant.admin') || roles.includes('core.admin')) {
      return 'admin';
    }
    if (roles.includes('casting_director')) {
      return 'casting_director';
    }
    if (roles.includes('agent')) {
      return 'agent';
    }
    if (roles.includes('investor') || roles.includes('vip_investor')) {
      return 'investor';
    }
    return 'actor'; // Default role
  }

  /**
   * Check if Dailey Core auth is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'Castingly/2.0' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const daileyCoreAuth = new DaileyCoreAuthClient();
export default daileyCoreAuth;
