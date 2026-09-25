/**
 * AQUA-LENS SMS Notification & Telemetry Dispatcher
 * 
 * Server-side abstraction for sending SMS tracking confirmations to citizens.
 * Supports environment-configured SMS providers (Twilio, Fast2SMS, MSG91, or custom REST gateways)
 * with automatic fallback and simulation mode.
 * 
 * Environment Variables supported:
 * - SMS_PROVIDER (e.g. "twilio", "fast2sms", "msg91", "http")
 * - SMS_API_KEY
 * - SMS_API_SECRET
 * - SMS_SENDER_ID
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 * - FAST2SMS_API_KEY
 */

export interface SmsPayload {
  toPhoneNumber: string;
  trackingId: string;
  complaintNumber?: string;
  category?: string;
  department?: string;
  locationName?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  status: "SENT" | "SIMULATED" | "FAILED";
  provider: string;
  recipient: string;
  message: string;
  error?: string;
}

/**
 * Format and validate Indian phone number into E.164 standard (+91XXXXXXXXXX)
 */
export function formatIndianPhoneNumber(phone: string): { raw: string; formatted: string; isValid: boolean } {
  if (!phone) return { raw: "", formatted: "", isValid: false };

  // Remove non-digit characters except leading plus
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with +91, strip +91 for validation
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Check 10-digit Indian mobile format (starts with 6, 7, 8, 9)
  const isValid = /^[6-9]\d{9}$/.test(cleaned);
  const formatted = isValid ? `+91${cleaned}` : `+91${cleaned.slice(-10)}`;

  return {
    raw: cleaned,
    formatted,
    isValid,
  };
}

/**
 * Safely masks a phone number for privacy preservation (+91 ******3210)
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "Not Provided";
  const { formatted, isValid, raw } = formatIndianPhoneNumber(phone);
  const digits = raw.slice(-10);
  if (digits.length < 10) return "+91 ******" + digits.slice(-4);
  return `+91 ******${digits.slice(-4)}`;
}

/**
 * Sends grievance registration SMS confirmation using configured SMS provider abstraction
 */
export async function sendGrievanceSmsConfirmation(
  payload: SmsPayload
): Promise<SmsResult> {
  const { toPhoneNumber, trackingId } = payload;
  const phoneInfo = formatIndianPhoneNumber(toPhoneNumber);

  // Exact standard SMS message format required by system specification:
  // "Aqua-Lens: Your grievance has been registered successfully. Tracking ID: AQL-2026-TN-RAM-000124. Use this ID to track your complaint."
  const smsText = `Aqua-Lens: Your grievance has been registered successfully. Tracking ID: ${trackingId}. Use this ID to track your complaint.`;

  const providerEnv = (process.env.SMS_PROVIDER || "").toLowerCase().trim();
  const apiKey = process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY || "";
  const apiSecret = process.env.SMS_API_SECRET || process.env.TWILIO_AUTH_TOKEN || "";
  const senderId = process.env.SMS_SENDER_ID || process.env.TWILIO_PHONE_NUMBER || "AQUALN";

  // 1. Generic / Environment-configured Provider Integration
  if (providerEnv === "twilio" || (process.env.TWILIO_ACCOUNT_SID && apiSecret)) {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID || apiKey;
    if (twilioSid && apiSecret && senderId) {
      try {
        const authHeader = "Basic " + Buffer.from(`${twilioSid}:${apiSecret}`).toString("base64");
        const bodyParams = new URLSearchParams({
          To: phoneInfo.formatted,
          From: senderId,
          Body: smsText,
        });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          }
        );

        if (res.ok) {
          const json = await res.json();
          console.log(`📱 [SMS SENT via Twilio] Message SID: ${json.sid} to ${phoneInfo.formatted}`);
          return {
            success: true,
            messageId: json.sid,
            status: "SENT",
            provider: "Twilio SMS",
            recipient: phoneInfo.formatted,
            message: smsText,
          };
        } else {
          const errText = await res.text();
          console.warn("⚠️ Twilio SMS error HTTP", res.status, errText);
          return {
            success: false,
            status: "FAILED",
            provider: "Twilio SMS",
            recipient: phoneInfo.formatted,
            message: smsText,
            error: `Twilio HTTP ${res.status}: ${errText.slice(0, 100)}`,
          };
        }
      } catch (err: any) {
        console.warn("⚠️ Twilio SMS exception:", err);
        return {
          success: false,
          status: "FAILED",
          provider: "Twilio SMS",
          recipient: phoneInfo.formatted,
          message: smsText,
          error: err.message || "Twilio network failure",
        };
      }
    }
  }

  // 2. Fast2SMS / Indian Gateway Integration
  if (providerEnv === "fast2sms" || apiKey) {
    if (apiKey) {
      try {
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "q",
            message: smsText,
            numbers: phoneInfo.raw,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          console.log(`📱 [SMS SENT via Fast2SMS] to ${phoneInfo.formatted}:`, json);
          return {
            success: true,
            messageId: json.request_id || "fast2sms-" + Date.now(),
            status: "SENT",
            provider: "Fast2SMS Gateway",
            recipient: phoneInfo.formatted,
            message: smsText,
          };
        }
      } catch (err: any) {
        console.warn("⚠️ Fast2SMS dispatch exception:", err);
      }
    }
  }

  // 3. Default fallback: High-reliability Server Telemetry Simulation Dispatch
  const simMessageId = `SMS-AQL-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  console.log(`
📱 ============================================================
📱 AQUA-LENS AUTOMATED SMS DISPATCHER (LIVE TELEMETRY LOG)
📱 ============================================================
📱 RECIPIENT PHONE: ${phoneInfo.formatted}
📱 TRACKING ID: ${trackingId}
📱 SMS TEXT: "${smsText}"
📱 TIMESTAMP: ${new Date().toISOString()}
📱 MESSAGE ID: ${simMessageId}
📱 STATUS: DISPATCHED SUCCESSFULLY (SIMULATED ENDPOINT)
📱 ============================================================
  `);

  return {
    success: true,
    messageId: simMessageId,
    status: "SIMULATED",
    provider: "Aqua-Lens SMS Dispatcher",
    recipient: phoneInfo.formatted,
    message: smsText,
  };
}
