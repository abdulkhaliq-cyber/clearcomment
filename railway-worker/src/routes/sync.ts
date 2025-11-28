import { Router, Request, Response } from 'express';
import { getDb } from '../config/firebase';

const router = Router();

// POST /sync/comments - Sync comments from Facebook for a page
router.post('/comments', async (req: Request, res: Response) => {
    try {
        const { pageId, pageAccessToken } = req.body;

        if (!pageId || !pageAccessToken) {
            return res.status(400).json({ error: 'Missing pageId or pageAccessToken' });
        }

        console.log(`🔄 Syncing comments for page: ${pageId}`);

        // Fetch page's posts from Graph API
        const postsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time&limit=10&access_token=${pageAccessToken}`
        );
        const postsData: any = await postsResponse.json();

        if (postsData.error) {
            throw new Error(postsData.error.message);
        }

        const posts = postsData.data || [];
        let totalComments = 0;
        const db = getDb();

        // For each post, fetch its comments
        for (const post of posts) {
            const commentsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${post.id}/comments?fields=id,message,from,created_time,is_hidden&limit=50&access_token=${pageAccessToken}`
            );
            const commentsData: any = await commentsResponse.json();

            if (commentsData.error) {
                console.error(`Error fetching comments for post ${post.id}:`, commentsData.error);
                continue;
            }

            const comments = commentsData.data || [];

            // Save each comment to Firestore
            for (const comment of comments) {
                try {
                    // Check if comment already exists
                    const existingComment = await db
                        .collection('comments')
                        .where('commentId', '==', comment.id)
                        .limit(1)
                        .get();

                    if (existingComment.empty) {
                        await db.collection('comments').add({
                            pageId: pageId,
                            postId: post.id,
                            postMessage: post.message || '',
                            commentId: comment.id,
                            message: comment.message || '',
                            authorName: comment.from?.name || 'Unknown',
                            authorId: comment.from?.id || '',
                            isHidden: comment.is_hidden || false,
                            fbCreatedTime: new Date(comment.created_time),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                        totalComments++;
                    }
                } catch (error) {
                    console.error(`Error saving comment ${comment.id}:`, error);
                }
            }
        }

        console.log(`✅ Synced ${totalComments} new comments`);

        res.json({
            success: true,
            synced: totalComments,
            message: `Successfully synced ${totalComments} comments`
        });
    } catch (error: any) {
        console.error('Error syncing comments:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
