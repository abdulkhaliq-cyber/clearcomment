import { useState, useEffect } from 'react';

interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

interface Session {
    user?: User;
    expires: string;
}

export function useSession() {
    const [data, setData] = useState<Session | null>(null);
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(session => {
                if (session && Object.keys(session).length > 0) {
                    setData(session);
                    setStatus("authenticated");
                } else {
                    setData(null);
                    setStatus("unauthenticated");
                }
            })
            .catch(() => {
                setData(null);
                setStatus("unauthenticated");
            });
    }, []);

    return { data, status };
}
