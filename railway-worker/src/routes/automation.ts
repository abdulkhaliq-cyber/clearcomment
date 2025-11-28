import { Router, Request, Response } from 'express';
import { processComment } from '../services/automation';

const router = Router();

// POST /automation/rules - Manually trigger rule processing for a comment
router.post('/rules', async (req: Request, res: Response) => {
    try {
        const { pageId, commentData } = req.body;

        if (!pageId || !commentData) {
            return res.status(400).json({ error: 'Missing pageId or commentData' });
        }

        const result = await processComment(pageId, commentData);

        res.json({
            success: true,
            action: result.action,
            matched: result.matched
        });
    } catch (error: any) {
        console.error('Error processing rules:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
