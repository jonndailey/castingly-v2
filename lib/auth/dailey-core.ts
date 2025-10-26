/**
 * Dailey Core Authentication Client for Castingly
 * Handles authentication with the centralized Dailey Core auth system
 */

import { resolveWebAvatarUrl } from '@/lib/image-url'
import { verifyJwtRS256 } from '@/lib/auth/jwks-verify'

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
  private clientId?: string;
  private clientSecret?: string;
  private appSlug: string;
  private tenantSlug?: string;

  constructor() {
    this.baseUrl =
      process.env.DAILEY_CORE_AUTH_URL ||
      process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL ||
      'https://core.dailey.cloud';
    // Only send a client id header if explicitly provided by env; Core may reject unknown IDs
    this.clientId = process.env.DAILEY_CORE_CLIENT_ID;
    this.clientSecret = process.env.CASTINGLY_CLIENT_SECRET;
    this.appSlug = process.env.DAILEY_CORE_APP_SLUG || 'castingly-portal';
    this.tenantSlug = process.env.DAILEY_CORE_TENANT_SLUG || 'castingly';
  }

  /**
   * Authenticate user with Dailey Core
   */
  async login(email: string, password: string): Promise<DaileyCoreAuthResponse | DaileyCoreMfaChallengeResponse> {
    console.log(
      `🎭 Castingly → Dailey Core Auth: Attempting login for ${email} (baseUrl=${this.baseUrl}, appSlug=${this.appSlug}, tenant=${this.tenantSlug || 'n/a'}, clientId=${this.clientId || 'n/a'})`
    );

    const payload: Record<string, unknown> = {
      email,
      password,
      app_slug: this.appSlug,
      ...(this.tenantSlug ? { tenant_slug: this.tenantSlug } : {}),
    };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Align with DMAPI: send app slug via X-Client-Id (Core treats it as app slug)
      'X-Client-Id': this.appSlug,
      ...(this.tenantSlug ? { 'X-Tenant-Slug': this.tenantSlug } : {}),
      'User-Agent': 'Castingly/2.0',
    };
    const debugPayload = { ...payload, password: '***' };
    console.log('🔎 Core request payload:', debugPayload, 'headers:', headers);
    
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('🎭 Dailey Core Auth Error:', { status: response.status, data });
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
      app_slug: this.appSlug,
      app_name: 'Castingly',
      ...(this.tenantSlug ? { tenant_slug: this.tenantSlug } : {}),
    };

    if (code) {
      payload.code = code;
    }

    if (backupCode) {
      payload.backup_code = backupCode;
    }

    const mfaHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Castingly/2.0',
    };
    if (this.clientId) {
      mfaHeaders['X-Client-Id'] = this.clientId;
    }

    const response = await fetch(`${this.baseUrl}/auth/mfa/challenge`, {
      method: 'POST',
      headers: mfaHeaders,
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
      const validateHeaders: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Castingly/2.0',
      };
      if (this.clientId) {
        validateHeaders['X-Client-Id'] = this.clientId;
      }

      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        headers: validateHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      // Fallback to local JWKS verification if Core validate is unavailable
      const local = await verifyJwtRS256(token, {
        jwksBaseUrl: this.baseUrl,
        issuer: 'dailey-core-auth',
      })
      if (local?.payload) {
        const p = local.payload as any
        const roles: string[] = Array.isArray(p.roles) ? p.roles : []
        const user: DaileyCoreUser = {
          id: String(p.sub),
          email: String(p.email || ''),
          name: typeof p.name === 'string' ? p.name : undefined,
          roles,
          email_verified: Boolean(p.email_verified ?? true),
          status: 'active',
          tenant_id: p.tenant,
        }
        return { valid: true, user, roles }
      }
      return null;
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
      const refreshBody: Record<string, unknown> = {
        refresh_token: refreshToken,
      };
      if (this.clientId) {
        refreshBody.client_id = this.clientId;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Castingly/2.0'
        },
        body: JSON.stringify(refreshBody)
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

    // Generate a web-safe avatar URL (avoid local file paths from Core)
    const avatar_url = resolveWebAvatarUrl(coreUser.profile_image, name) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9C27B0&color=fff`

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
    // Note: investor is not a primary role, it's a flag. Investors can be actors, agents, etc.
    if (roles.includes('admin') || roles.includes('tenant.admin') || roles.includes('core.admin')) {
      return 'admin';
    }
    if (roles.includes('casting_director')) {
      return 'casting_director';
    }
    if (roles.includes('agent')) {
      return 'agent';
    }
    // Don't return 'investor' as a role - it's a secondary attribute
    // Investors should have their primary role (actor, agent, etc.)
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
