import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    type DocumentData,
    type QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    PAGES: 'pages',
    COMMENTS: 'comments',
    RULES: 'rules',
    LOGS: 'logs',
};

// Types
export interface FirestoreUser {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface FirestorePage {
    id?: string;
    userId: string;
    pageId: string;
    pageName: string;
    pageAccessToken: string; // Encrypted
    moderationEnabled: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface FirestoreComment {
    id?: string;
    pageId: string;
    postId: string;
    postMessage?: string;
    commentId: string; // Facebook comment ID
    message: string;
    authorName: string;
    authorId: string;
    isHidden: boolean;
    fbCreatedTime: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface FirestoreRule {
    id?: string;
    pageId: string;
    keywords: string[];
    action: 'HIDE' | 'DELETE';
    enabled: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface FirestoreLog {
    id?: string;
    pageId: string;
    action: string;
    commentId?: string;
    commentText?: string;
    ruleId?: string;
    success: boolean;
    performedAt: Timestamp;
}

// Helper: Get collection reference
export const getCollectionRef = (collectionName: string) => {
    return collection(db, collectionName);
};

// Helper: Get document reference
export const getDocRef = (collectionName: string, docId: string) => {
    return doc(db, collectionName, docId);
};

// CRUD Operations

// Create
export const createDocument = async (collectionName: string, data: DocumentData) => {
    const docRef = await addDoc(getCollectionRef(collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
};

// Read single document
export const getDocument = async (collectionName: string, docId: string) => {
    const docRef = getDocRef(collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

// Read multiple documents with query
export const getDocuments = async (
    collectionName: string,
    constraints: QueryConstraint[] = []
) => {
    const q = query(getCollectionRef(collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Update
export const updateDocument = async (
    collectionName: string,
    docId: string,
    data: Partial<DocumentData>
) => {
    const docRef = getDocRef(collectionName, docId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
};

// Delete
export const deleteDocument = async (collectionName: string, docId: string) => {
    const docRef = getDocRef(collectionName, docId);
    await deleteDoc(docRef);
};

// Real-time listener
export const subscribeToCollection = (
    collectionName: string,
    constraints: QueryConstraint[],
    callback: (data: DocumentData[]) => void
) => {
    const q = query(getCollectionRef(collectionName), ...constraints);

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(data);
    });
};

// Specific helper functions

// Get user's pages
export const getUserPages = async (userId: string) => {
    return getDocuments(COLLECTIONS.PAGES, [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    ]);
};

// Get page comments
export const getPageComments = async (pageId: string, limitCount = 50) => {
    return getDocuments(COLLECTIONS.COMMENTS, [
        where('pageId', '==', pageId),
        orderBy('fbCreatedTime', 'desc'),
        limit(limitCount)
    ]);
};

// Subscribe to page comments (real-time)
export const subscribeToPageComments = (
    pageId: string,
    callback: (comments: DocumentData[]) => void
) => {
    return subscribeToCollection(
        COLLECTIONS.COMMENTS,
        [
            where('pageId', '==', pageId),
            orderBy('fbCreatedTime', 'desc'),
            limit(50)
        ],
        callback
    );
};

// Get page rules
export const getPageRules = async (pageId: string) => {
    return getDocuments(COLLECTIONS.RULES, [
        where('pageId', '==', pageId),
        where('enabled', '==', true)
    ]);
};

// Get page logs
export const getPageLogs = async (pageId: string, limitCount = 100) => {
    return getDocuments(COLLECTIONS.LOGS, [
        where('pageId', '==', pageId),
        orderBy('performedAt', 'desc'),
        limit(limitCount)
    ]);
};

// Subscribe to page logs (real-time)
export const subscribeToPageLogs = (
    pageId: string,
    callback: (logs: DocumentData[]) => void
) => {
    return subscribeToCollection(
        COLLECTIONS.LOGS,
        [
            where('pageId', '==', pageId),
            orderBy('performedAt', 'desc'),
            limit(100)
        ],
        callback
    );
};
