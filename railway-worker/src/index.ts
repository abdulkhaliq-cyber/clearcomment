import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase';
import webhookRouter from './routes/webhook';
import automationRouter from './routes/automation';
import aiRouter from './routes/ai';
import moderationRouter from './routes/moderation';
import syncRouter from './routes/sync';
import { initScheduler } from './services/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin
initializeFirebase();

// Initialize Scheduler
initScheduler();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Webhook route needs raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));

// Other routes use JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (keeps Railway warm)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/webhook', webhookRouter);
app.use('/automation', automationRouter);
app.use('/ai', aiRouter);
app.use('/moderation', moderationRouter);
app.use('/sync', syncRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Railway worker running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔥 Firebase initialized`);
});

export default app;
