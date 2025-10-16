import SignalClient, { SignalError } from './signal-client';

const SIGNAL_API_KEY =
  process.env.SIGNAL_API_KEY ||
  process.env.DAILEY_SIGNAL_API_KEY ||
  process.env.DAILEY_SIGNAL_SK ||
  '';
const SIGNAL_API_BASE_URL =
  process.env.SIGNAL_API_URL ||
  process.env.DAILEY_SIGNAL_URL ||
  'http://localhost:4001';
const SIGNAL_REQUEST_TIMEOUT = Number.parseInt(
  process.env.SIGNAL_REQUEST_TIMEOUT ?? '15000',
  10
);
const SIGNAL_USER_AGENT = process.env.SIGNAL_USER_AGENT || 'castingly/2.0.0';

let cachedSignalClient: SignalClient | null = null;
let cachedApiKey: string | null = null;

function getSignalClient(): SignalClient | null {
  if (!SIGNAL_API_KEY) {
    return null;
  }

  if (cachedSignalClient && cachedApiKey === SIGNAL_API_KEY) {
    return cachedSignalClient;
  }

  try {
    cachedSignalClient = new SignalClient(SIGNAL_API_KEY, {
      baseUrl: SIGNAL_API_BASE_URL,
      timeout: SIGNAL_REQUEST_TIMEOUT,
      userAgent: SIGNAL_USER_AGENT,
    });
    cachedApiKey = SIGNAL_API_KEY;
    return cachedSignalClient;
  } catch (error) {
    console.error('Failed to initialise Signal client:', error);
    return null;
  }
}

type SendEmailResult = {
  delivered: boolean;
  skipped?: boolean;
  error?: string;
  details?: unknown;
};

type SendSignalEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
};

type PasswordResetEmailOptions = {
  to: string;
  name?: string | null;
  resetLink: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendSignalEmail(
  options: SendSignalEmailOptions
): Promise<SendEmailResult> {
  const client = getSignalClient();

  if (!client) {
    console.info('[SignalEmail:MockDelivery]', {
      to: options.to,
      subject: options.subject,
      html: options.html,
      metadata: options.metadata,
    });
    return { delivered: false, skipped: true, error: 'missing_api_key' };
  }

  const textFallback = options.text ?? htmlToText(options.html);

  try {
    const response = await client.sendMessage({
      channel: 'EMAIL',
      subject: options.subject,
      content: options.html,
      to: {
        email: options.to,
        ...(options.name ? { name: options.name } : {}),
        metadata: {
          ipAddress: options.ipAddress ?? null,
          userAgent: options.userAgent ?? null,
        },
      },
      tags: options.tags ?? ['password-reset'],
      priority: options.priority ?? 'normal',
      metadata: {
        ...options.metadata,
        template: 'password-reset',
        expiresAt: options.expiresAt.toISOString(),
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        app: 'castingly',
        textFallback,
      },
    });

    return { delivered: true, details: response };
  } catch (error) {
    if (error instanceof SignalError) {
      console.error('Failed to send email via Dailey Signal:', {
        status: error.status,
        response: error.response,
      });
      return {
        delivered: false,
        error: error.message,
        details: error.response,
      };
    }

    console.error('Dailey Signal request failed:', error);
    return {
      delivered: false,
      error: error instanceof Error ? error.message : 'Unknown Signal error',
    };
  }
}

export async function sendPasswordResetEmail(
  options: PasswordResetEmailOptions
): Promise<SendEmailResult> {
  const subject = 'Castingly Password Reset Instructions';
  const greeting = options.name ? `Hi ${options.name},` : 'Hello,';
  const expiresAt = options.expiresAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const textBody = [
    greeting,
    '',
    'We received a request to reset the password for your Castingly account.',
    'If you made this request, please use the link below to choose a new password:',
    options.resetLink,
    '',
    `This link will expire on ${expiresAt}.`,
    'If you did not request a password reset, you can safely ignore this email.',
    '',
    'For security, the link can only be used once.',
    '',
    '— The Castingly Team',
  ].join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #1f2933; line-height: 1.5;">
      <p>${greeting}</p>
      <p>We received a request to reset the password for your Castingly account.</p>
      <p>If you made this request, click the button below to choose a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${options.resetLink}" style="background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: 600; display: inline-block;">
          Reset your password
        </a>
      </p>
      <p>Or copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #7c3aed;">${options.resetLink}</p>
      <p style="margin-top: 24px; font-size: 14px;">
        This link will expire on <strong>${expiresAt}</strong>. After expiration you will need to request a new password reset email.
      </p>
      <p>If you did not request this password reset you can safely ignore this message.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #52606d;">
        Request details:<br />
        IP Address: ${options.ipAddress ?? 'Unknown'}<br />
        Browser: ${options.userAgent ?? 'Unknown'}
      </p>
      <p style="font-size: 12px; color: #9aa5b1;">This link can only be used once for your security.</p>
      <p style="margin-top: 24px;">— The Castingly Team</p>
    </div>
  `.trim();

  return sendSignalEmail({
    to: options.to,
    subject,
    html: htmlBody,
    text: textBody,
    tags: ['password-reset'],
    metadata: {
      template: 'password-reset',
      expiresAt: options.expiresAt.toISOString(),
      ipAddress: options.ipAddress ?? null,
      userAgent: options.userAgent ?? null,
      app: 'castingly',
    },
  });
}
