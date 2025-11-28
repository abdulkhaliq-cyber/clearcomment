import { getDb } from '../config/firebase';
import axios from 'axios';

interface CommentData {
    comment_id: string;
    message: string;
    post_id: string;
    from?: {
        name: string;
        id: string;
    };
}

interface Rule {
    id: string;
    keywords: string[];
    action: 'HIDE' | 'DELETE' | 'REPLY' | 'DM';
    responseMessage?: string;
    enabled: boolean;
}

export async function processComment(pageId: string, commentData: CommentData) {
    console.log(`🔍 Processing comment ${commentData.comment_id} for page ${pageId}`);

    const db = getDb();

    // Get active rules for this page
    const rulesSnapshot = await db
        .collection('rules')
        .where('pageId', '==', pageId)
        .where('enabled', '==', true)
        .get();

    const rules: Rule[] = rulesSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    } as Rule));

    if (rules.length === 0) {
        console.log('ℹ️  No active rules for this page');
        return { matched: false, action: null };
    }

    const message = commentData.message?.toLowerCase() || '';

    // Check each rule
    for (const rule of rules) {
        const matched = rule.keywords.some(keyword =>
            message.includes(keyword.toLowerCase())
        );

        if (matched) {
            console.log(`✅ Rule matched: ${rule.id} - Action: ${rule.action}`);

            // Perform moderation action
            await performModerationAction(pageId, commentData.comment_id, rule.action, rule.responseMessage);

            // Log the action
            const db = getDb();
            await db.collection('logs').add({
                pageId,
                commentId: commentData.comment_id,
                commentText: commentData.message,
                ruleId: rule.id,
                action: rule.action,
                success: true,
                performedAt: new Date(),
            });

            return { matched: true, action: rule.action };
        }
    }

    console.log('ℹ️  No rules matched');
    return { matched: false, action: null };
}

export async function performModerationAction(
    pageId: string,
    commentId: string,
    action: 'HIDE' | 'DELETE' | 'REPLY' | 'DM',
    messageContent?: string
) {
    try {
        const db = getDb();

        // Get page access token from Firestore
        const pageDoc = await db.collection('pages').doc(pageId).get();
        if (!pageDoc.exists) {
            throw new Error('Page not found');
        }

        const pageData = pageDoc.data();
        const accessToken = pageData?.pageAccessToken; // TODO: Decrypt this

        if (!accessToken) {
            throw new Error('No access token for page');
        }

        // Call Facebook Graph API
        let endpoint = `https://graph.facebook.com/v18.0/${commentId}`;
        let method = 'post';
        const params: any = { access_token: accessToken };

        if (action === 'DELETE') {
            method = 'delete';
        } else if (action === 'HIDE') {
            params.is_hidden = true;
        } else if (action === 'REPLY') {
            endpoint = `https://graph.facebook.com/v18.0/${commentId}/comments`;
            params.message = messageContent || 'Auto-reply';
        } else if (action === 'DM') {
            // For DM, we need to find the user ID and send a message via Messenger API
            // Note: Private replies to comments are a specific endpoint
            endpoint = `https://graph.facebook.com/v18.0/${commentId}/private_replies`;
            params.message = messageContent || 'Auto-reply';
        }

        await axios({
            method,
            url: endpoint,
            params,
        });

        // Update comment in Firestore
        const commentQuery = await db
            .collection('comments')
            .where('commentId', '==', commentId)
            .limit(1)
            .get();

        if (!commentQuery.empty) {
            const commentDoc = commentQuery.docs[0];
            if (action === 'DELETE') {
                await commentDoc.ref.delete();
            } else if (action === 'HIDE') {
                await commentDoc.ref.update({ isHidden: true, updatedAt: new Date() });
            }
        }

        console.log(`✅ ${action} action completed for comment ${commentId}`);
    } catch (error) {
        console.error(`❌ Failed to ${action} comment:`, error);
        throw error;
    }
}
