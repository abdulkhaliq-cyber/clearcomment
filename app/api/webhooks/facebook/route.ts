import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { moderateComment } from '@/lib/moderation';
import { verifyFacebookSignature } from '@/lib/webhook-security';

// GET: Verification endpoint for Facebook
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
        console.log("Webhook verified successfully");
        return new NextResponse(challenge, { status: 200 });
    }

    console.error("Webhook verification failed. Token mismatch.");
    return new NextResponse('Forbidden', { status: 403 });
}

// POST: Webhook handler
export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-hub-signature-256');

        // 1. Verify Signature
        if (!verifyFacebookSignature(rawBody, signature, process.env.FACEBOOK_CLIENT_SECRET!)) {
            console.error("Invalid signature - Request rejected");
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = JSON.parse(rawBody);

        // 2. Respond immediately (Fire-and-forget processing)
        processEvent(body).catch(err => console.error("Async processing error:", err));

        return new NextResponse('EVENT_RECEIVED', { status: 200 });

    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

async function processEvent(body: any) {
    if (body.object === 'page') {
        for (const entry of body.entry) {
            const pageId = entry.id;

            // 3. Page Allowlist Check
            // We check if this page exists in our DB. If not, ignore.
            const internalPage = await prisma.facebookPage.findUnique({
                where: { pageId: pageId },
            });

            if (!internalPage) {
                console.warn(`Ignored event for unknown page ID: ${pageId}`);
                continue;
            }

            if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'feed' && change.value.item === 'comment') {
                        const { verb, comment_id, message, sender_name, sender_id, created_time, post_id, is_hidden } = change.value;

                        if (verb === 'add' || verb === 'edit') {
                            const eventId = `${comment_id}_${verb}`; // Unique ID for idempotency

                            // 4. Idempotency Check (Deduplication)
                            // Try to create a log entry. If it fails (unique constraint), we've already processed this.
                            try {
                                await prisma.webhookEventLog.create({
                                    data: {
                                        eventId,
                                        pageId: internalPage.id,
                                        eventType: `comment_${verb}`,
                                    }
                                });
                            } catch (e) {
                                console.log(`Skipping duplicate event: ${eventId}`);
                                continue;
                            }

                            console.log(`[${new Date().toISOString()}] Processing comment ${verb} for page ${pageId}`);

                            // Store/Update comment in DB
                            await prisma.comment.upsert({
                                where: { id: comment_id },
                                update: {
                                    message: message,
                                    isHidden: is_hidden === true,
                                },
                                create: {
                                    id: comment_id,
                                    postId: post_id,
                                    pageId: internalPage.id,
                                    message: message,
                                    authorName: sender_name || 'Unknown',
                                    authorId: sender_id || 'Unknown',
                                    isHidden: is_hidden === true,
                                    fbCreatedTime: new Date(created_time * 1000),
                                },
                            });

                            // TRIGGER AUTOMATED MODERATION
                            // Instead of processing immediately, we push to the queue
                            if (verb === 'add' && !is_hidden) {
                                try {
                                    await prisma.moderationQueue.create({
                                        data: {
                                            payload: {
                                                pageId: internalPage.id, // Internal DB ID
                                                commentId: comment_id,
                                                message: message,
                                                verb: verb
                                            },
                                            status: "PENDING"
                                        }
                                    });
                                    console.log(`Event queued for processing: ${comment_id}`);
                                } catch (err) {
                                    console.error("Failed to queue event:", err);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
}
