import crypto from 'crypto';
import { query } from './db_existing';

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
  used_at?: Date;
  ip_address?: string | null;
  user_agent?: string | null;
}

export class PasswordResetService {
  private static readonly TOKEN_EXPIRY_HOURS = 1; // 1 hour expiry
  private static readonly TOKEN_LENGTH = 32;

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a secure random token for password reset
   */
  private static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Create a password reset token for a user
   */
  static async createResetToken(
    email: string,
    options?: { ipAddress?: string | null; userAgent?: string | null }
  ): Promise<{ token: string; expires_at: Date } | null> {
    try {
      // Check if user exists
      const users = await query(
        'SELECT id, email FROM users WHERE email = ?',
        [email]
      ) as any[];

      if (users.length === 0) {
        return null; // User not found
      }

      const user = users[0];
      const token = this.generateToken();
      const hashedToken = this.hashToken(token);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Invalidate any existing tokens for this user
      await query(
        'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW(), expires_at = NOW() WHERE user_id = ? AND used = FALSE',
        [user.id]
      );

      // Create new token
      try {
        await query(
          `INSERT INTO password_reset_tokens (
            user_id, token, expires_at, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            user.id,
            hashedToken,
            expiresAt,
            options?.ipAddress ?? null,
            options?.userAgent ?? null,
          ]
        );
      } catch (insertError) {
        console.warn('Falling back to legacy password_reset_tokens insert shape:', insertError);
        await query(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
          [user.id, hashedToken, expiresAt]
        );
      }

      return { token, expires_at: expiresAt };
    } catch (error) {
      console.error('Error creating reset token:', error);
      throw error;
    }
  }

  /**
   * Validate a password reset token
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    user_id?: number;
    token_id?: number;
    error?: string;
  }> {
    try {
      const hashedToken = this.hashToken(token);

      let tokens = await query(
        `SELECT prt.*, u.email 
         FROM password_reset_tokens prt 
         JOIN users u ON prt.user_id = u.id 
         WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
        [hashedToken]
      ) as any[];

      if (tokens.length === 0) {
        tokens = await query(
          `SELECT prt.*, u.email 
           FROM password_reset_tokens prt 
           JOIN users u ON prt.user_id = u.id 
           WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
          [token]
        ) as any[];
      }

      if (tokens.length === 0) {
        return { valid: false, error: 'Invalid or expired token' };
      }

      const resetToken = tokens[0];
      return { valid: true, user_id: resetToken.user_id, token_id: resetToken.id };
    } catch (error) {
      console.error('Error validating token:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  /**
   * Reset password using a valid token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate token first
      const validation = await this.validateToken(token);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      if (!validation.user_id || !validation.token_id) {
        return { success: false, error: 'Reset token is incomplete or missing required data' };
      }

      // Hash the new password (using SHA256 to match existing system)
      const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

      // Update user password
      await query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, validation.user_id]
      );

      // Mark token as used
      await query(
        'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = ?',
        [validation.token_id]
      );

      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: 'Password reset failed' };
    }
  }

  /**
   * Clean up expired and used tokens (for maintenance)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await query(
        'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE'
      ) as any;

      return result.affectedRows || 0;
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
      return 0;
    }
  }

  /**
   * Get user info by email (for password reset request)
   */
  static async getUserByEmail(email: string): Promise<{ id: number; email: string; name: string } | null> {
    try {
      const users = await query(
        'SELECT id, email, CONCAT(first_name, " ", last_name) as name FROM users WHERE email = ?',
        [email]
      ) as any[];

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
}
