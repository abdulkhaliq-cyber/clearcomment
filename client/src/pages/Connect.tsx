
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FacebookAuthProvider, linkWithPopup, reauthenticateWithPopup } from "firebase/auth";
import { where } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { COLLECTIONS, createDocument, getDocuments, updateDocument } from "../lib/firestore";
import Layout from "../components/Layout";

export default function Connect() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleConnect = async () => {
        if (!user) return;

        setIsLoading(true);
        setError("");

        try {
            const provider = new FacebookAuthProvider();
            // Request permissions to manage pages and comments
            provider.addScope('pages_show_list');
            provider.addScope('pages_read_engagement');
            provider.addScope('pages_manage_engagement');
            provider.addScope('pages_manage_posts');
            provider.addScope('pages_manage_metadata');

            let result;
            try {
                // Try to link the Facebook account to the existing user
                result = await linkWithPopup(user, provider);
            } catch (linkError: any) {
                if (linkError.code === 'auth/provider-already-linked') {
                    // If already linked, re-authenticate to get fresh token with new scopes
                    result = await reauthenticateWithPopup(user, provider);
                } else if (linkError.code === 'auth/credential-already-in-use') {
                    throw new Error("This Facebook account is already connected to another user.");
                } else {
                    // If linking fails for other reasons (e.g. popup closed), throw it
                    throw linkError;
                }
            }

            // Get the Access Token
            const credential = FacebookAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;

            if (!accessToken) {
                throw new Error("No access token received from Facebook");
            }

            console.log("Connected! Fetching pages...");

            // Fetch user's pages from Graph API
            const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const pages = data.data || [];

            if (pages.length === 0) {
                setError("No Facebook Pages found for this account.");
                setIsLoading(false);
                return;
            }

            // Save pages to Firestore
            for (const page of pages) {
                // Check if page already exists
                const existingPages = await getDocuments(COLLECTIONS.PAGES, [
                    where('pageId', '==', page.id),
                    where('userId', '==', user.uid)
                ]);

                const pageData = {
                    userId: user.uid,
                    pageId: page.id,
                    pageName: page.name,
                    pageAccessToken: page.access_token,
                    moderationEnabled: true
                };

                if (existingPages.length > 0) {
                    // Update existing page
                    await updateDocument(COLLECTIONS.PAGES, existingPages[0].id, pageData);
                    console.log(`Updated page: ${page.name}`);
                } else {
                    // Create new page
                    await createDocument(COLLECTIONS.PAGES, pageData);
                    console.log(`Created page: ${page.name}`);
                }
            }

            console.log("All pages saved!");
            navigate("/dashboard");

        } catch (err: any) {
            console.error("Failed to connect page", err);
            setError(err.message || "Failed to connect Facebook Page");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout pages={[]} selectedPage="" onPageSelect={() => { }}>
            <div className="max-w-2xl mx-auto text-center py-12">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Connect Your Facebook Page</h1>
                <p className="text-slate-600 mb-8">
                    To start moderating comments, we need permission to access your Facebook Pages.
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
                >
                    {isLoading ? (
                        <>Connecting...</>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Connect Facebook Page
                        </>
                    )}
                </button>

                <p className="mt-6 text-sm text-slate-500">
                    We only use these permissions to read and hide/delete comments on your behalf.
                </p>
            </div>
        </Layout>
    );
}
