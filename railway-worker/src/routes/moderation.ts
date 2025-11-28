import { Router, Request, Response } from 'express';
import { performModerationAction } from '../services/automation';

const router = Router();

// POST /moderation/action - Perform manual moderation action
router.post('/action', async (req: Request, res: Response) => {
    try {
        const { pageId, commentId, action } = req.body;

        if (!pageId || !commentId || !action) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['HIDE', 'DELETE', 'REPLY', 'DM'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        await performModerationAction(pageId, commentId, action);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error performing moderation action:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
