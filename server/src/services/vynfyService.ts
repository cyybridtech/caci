export interface VynfySendOptions {
  recipients: string[]; // Phone numbers
  message: string;
  senderId?: string;
}

export interface VynfySendResult {
  success: boolean;
  messageId?: string;
  status: string;
  recipientCount: number;
  rawResponse?: any;
  error?: string;
}

// User-provided Vynfy API key
const VYNFY_API_KEY = process.env.VYNFY_API_KEY || 'a5a9ec5fb9c6612a0df7f953b53f4507';
const DEFAULT_SENDER_ID = process.env.VYNFY_SENDER_ID || 'CACI ';

/**
 * Normalize phone numbers to international Ghana format (e.g. 233241234567)
 */
export function formatGhanaPhoneNumber(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0') && clean.length === 10) {
    return '233' + clean.substring(1);
  }
  if (clean.startsWith('233') && clean.length === 12) {
    return clean;
  }
  if (clean.length === 9) {
    return '233' + clean;
  }
  return clean;
}

/**
 * Dispatch SMS via official Vynfy SMS Gateway (https://sms.vynfy.com/api/v1/send)
 * Includes smart matching for portal sender IDs (with or without trailing spaces).
 */
export async function sendVynfySMS(options: VynfySendOptions): Promise<VynfySendResult> {
  const formattedRecipients = options.recipients
    .map(formatGhanaPhoneNumber)
    .filter(p => p.length >= 10);

  if (formattedRecipients.length === 0) {
    return {
      success: false,
      status: 'FAILED',
      recipientCount: 0,
      error: 'No valid phone numbers provided'
    };
  }

  const baseSender = (options.senderId || DEFAULT_SENDER_ID).trim();
  const message = options.message;

  // Try exact sender variations (e.g., "CACI ", "CACI") to match the exact registration in the portal
  const candidateSenders = [
    `${baseSender} `, // Vynfy registration has trailing space "CACI "
    baseSender,
    baseSender.toUpperCase(),
    `${baseSender.toUpperCase()} `
  ];

  // Remove duplicates while preserving order
  const uniqueSenders = Array.from(new Set(candidateSenders));

  let lastResponseData: any = null;
  let lastStatus = 403;

  for (const senderAttempt of uniqueSenders) {
    try {
      const payload = {
        sender: senderAttempt,
        recipients: formattedRecipients,
        message: message
      };

      console.log(`[Vynfy SMS] Dispatching to ${formattedRecipients.length} recipients via https://sms.vynfy.com/api/v1/send with sender ID "${senderAttempt}"`);

      const response = await fetch('https://sms.vynfy.com/api/v1/send', {
        method: 'POST',
        headers: {
          'X-API-Key': VYNFY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (response.ok && responseData.success !== false) {
        console.log(`[Vynfy SMS] Successfully sent via Vynfy (${senderAttempt}):`, responseData);
        return {
          success: true,
          messageId: responseData.data?.task_id || responseData.task_id || responseData.id || 'vynfy-' + Date.now(),
          status: 'DELIVERED',
          recipientCount: formattedRecipients.length,
          rawResponse: responseData
        };
      } else {
        lastStatus = response.status;
        lastResponseData = responseData;
        console.warn(`[Vynfy SMS Gateway] Attempt with "${senderAttempt}" returned ${response.status}:`, responseData);
      }
    } catch (err: any) {
      console.error(`[Vynfy SMS] Exception with "${senderAttempt}":`, err.message);
      lastResponseData = { message: err.message };
    }
  }

  // If all variations fail
  return {
    success: false,
    status: lastStatus === 403 ? 'SENDER_ID_APPROVAL_REQUIRED' : 'GATEWAY_ERROR',
    recipientCount: formattedRecipients.length,
    error: lastResponseData?.message || `Vynfy Gateway Error (${lastStatus})`,
    rawResponse: lastResponseData
  };
}
