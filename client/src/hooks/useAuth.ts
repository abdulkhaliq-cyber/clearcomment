import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
    user: User | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        loading: true,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthState({
                user,
                loading: false,
            });
        });

        return () => unsubscribe();
    }, []);

    return authState;
}
