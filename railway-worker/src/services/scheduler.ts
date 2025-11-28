import cron from 'node-cron';
import { getDb } from '../config/firebase';

// Initialize scheduled tasks
export function initScheduler() {
    console.log('⏰ Initializing scheduler...');

    // 1. Daily Cleanup: Run at 00:00 (Midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('🧹 Running daily cleanup...');
        await cleanupOldLogs();
    });

    console.log('✅ Scheduler initialized');
}

// Task: Cleanup logs older than 30 days
async function cleanupOldLogs() {
    try {
        const db = getDb();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const snapshot = await db.collection('logs')
            .where('performedAt', '<', thirtyDaysAgo)
            .limit(500) // Process in batches
            .get();

        if (snapshot.empty) {
            console.log('✨ No old logs to clean up');
            return;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`🗑️ Deleted ${snapshot.size} old logs`);
    } catch (error) {
        console.error('❌ Error cleaning up logs:', error);
    }
}
