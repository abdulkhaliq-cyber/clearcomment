/**
 * Webhook Security & Verification Guide
 * 
 * 1. Signature Verification
 *    Facebook sends an X-Hub-Signature-256 header containing "sha256=<signature>".
 *    We compute the HMAC-SHA256 of the raw request body using our FACEBOOK_CLIENT_SECRET.
 *    If they match, the request is authentic.
 * 
 * 2. Page Allowlist
 *    We check if the incoming page_id exists in our FacebookPage table.
 *    If not found, we ignore the event (return 200) to stop Facebook from retrying.
 * 
 * 3. Idempotency (Deduplication)
 *    We store processed event IDs in WebhookEventLog.
 *    If we see the same ID again, we skip processing.
 */

import crypto from 'crypto';

export function verifyFacebookSignature(
    rawBody: string,
    signatureHeader: string | null,
    appSecret: string
): boolean {
    if (!signatureHeader) return false;

    // Facebook sends: "sha256=..."
    const [algorithm, signature] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !signature) return false;

    const hmac = crypto.createHmac('sha256', appSecret);
    const digest = hmac.update(rawBody).digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);

    if (sigBuffer.length !== digestBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}

/*
  CURL TESTING COMMANDS:

  1. Generate a signature for testing:
     echo -n '{"object":"page","entry":[{"id":"123","time":123456,"changes":[{"field":"feed","value":{"item":"comment","verb":"add","comment_id":"test_comment_1","message":"Hello"}}]}]}' | openssl dgst -sha256 -hmac "YOUR_APP_SECRET"

  2. Send Valid Request:
     curl -X POST http://localhost:3000/api/webhooks/facebook \
       -H "Content-Type: application/json" \
       -H "x-hub-signature-256: sha256=<OUTPUT_FROM_STEP_1>" \
       -d '{"object":"page","entry":[{"id":"123","time":123456,"changes":[{"field":"feed","value":{"item":"comment","verb":"add","comment_id":"test_comment_1","message":"Hello"}}]}]}'

  3. Send Invalid Signature (Should fail 401):
     curl -X POST http://localhost:3000/api/webhooks/facebook \
       -H "Content-Type: application/json" \
       -H "x-hub-signature-256: sha256=invalid_signature" \
       -d '{"object":"page"}'
*/
