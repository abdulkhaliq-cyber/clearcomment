import { Router, Request, Response } from 'express';
import { moderateWithAI } from '../services/ai';

const router = Router();

// POST /ai/moderation - Use AI to moderate a comment
router.post('/moderation', async (req: Request, res: Response) => {
    try {
        const { text, context } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Missing text' });
        }

        const result = await moderateWithAI(text, context);

        res.json(result);
    } catch (error: any) {
        console.error('Error in AI moderation:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
