import admin from 'firebase-admin';

let firebaseInitialized = false;

export function initializeFirebase() {
    if (firebaseInitialized) {
        return admin.app();
    }

    try {
        // Initialize with service account (from environment variable)
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
        );

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });

        firebaseInitialized = true;
        console.log('✅ Firebase Admin initialized');
        return admin.app();
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
        throw error;
    }
}

// Export getters instead of direct references
export function getDb() {
    return admin.firestore();
}

export function getAuth() {
    return admin.auth();
}

export default admin;
