import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../config/firebase';
import { processComment } from '../services/automation';

const router = Router();

// Verify webhook signature
function verifySignature(req: Request): boolean {
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) return false;

    const elements = signature.split('=');
    const signatureHash = elements[1];

    const expectedHash = crypto
        .createHmac('sha256', process.env.FACEBOOK_APP_SECRET || '')
        .update(req.body)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
    );
}

// GET /webhook/facebook - Verification endpoint
router.get('/facebook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        console.error('❌ Webhook verification failed');
        res.sendStatus(403);
    }
});

// POST /webhook/facebook - Receive webhook events
router.post('/facebook', async (req: Request, res: Response) => {
    // Verify signature
    if (!verifySignature(req)) {
        console.error('❌ Invalid signature');
        return res.sendStatus(403);
    }

    // Parse body (it's raw, so we need to parse it)
    const body = JSON.parse(req.body.toString());

    console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

    // Respond quickly to Facebook
    res.sendStatus(200);

    // Process webhook asynchronously
    if (body.object === 'page') {
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field === 'feed' && change.value?.item === 'comment') {
                    const commentData = change.value;

                    // Store comment in Firestore
                    try {
                        const db = getDb();
                        await db.collection('comments').add({
                            pageId: entry.id,
                            postId: commentData.post_id,
                            commentId: commentData.comment_id,
                            message: commentData.message || '',
                            authorName: commentData.from?.name || 'Unknown',
                            authorId: commentData.from?.id || '',
                            isHidden: false,
                            fbCreatedTime: new Date(commentData.created_time * 1000),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });

                        console.log('✅ Comment stored in Firestore');

                        // Process comment for auto-moderation
                        await processComment(entry.id, commentData);
                    } catch (error) {
                        console.error('❌ Error processing comment:', error);
                    }
                }
            }
        }
    }
});

export default router;
