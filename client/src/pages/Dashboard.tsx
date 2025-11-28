import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getUserPages, subscribeToPageComments, getDocument } from "../lib/firestore";
import Layout from "../components/Layout";
import { Trash2, Eye, EyeOff } from "lucide-react";

interface Page {
    id: string;
    pageId: string;
    pageName: string;
}

interface Comment {
    id: string;
    postId: string;
    postMessage: string;
    message: string;
    author: string;
    created_time: string;
    is_hidden: boolean;
}

export default function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<string>("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingPages, setLoadingPages] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    // Fetch connected pages on load
    useEffect(() => {
        if (!loading) {
            if (user) {
                fetchPages();
            } else {
                navigate("/login");
            }
        }
    }, [user, loading, navigate]);

    // Realtime Subscription with Firestore
    useEffect(() => {
        if (!selectedPage) return;

        const unsubscribe = subscribeToPageComments(selectedPage, (firestoreComments) => {
            const formattedComments = firestoreComments.map((comment: any) => ({
                id: comment.id,
                postId: comment.postId,
                postMessage: comment.postMessage || "",
                message: comment.message,
                author: comment.authorName,
                created_time: comment.fbCreatedTime?.toDate?.()?.toISOString() || new Date().toISOString(),
                is_hidden: comment.isHidden,
            }));
            setComments(formattedComments);
        });

        return () => {
            unsubscribe();
        };
    }, [selectedPage]);

    const fetchPages = async () => {
        if (!user) return;

        try {
            const firestorePages = await getUserPages(user.uid);
            const formattedPages = firestorePages.map((page: any) => ({
                id: page.id,
                pageId: page.pageId,
                pageName: page.pageName,
            }));
            setPages(formattedPages);
            if (formattedPages.length > 0) {
                setSelectedPage(formattedPages[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch pages", error);
        } finally {
            setLoadingPages(false);
        }
    };

    const handleSyncComments = async () => {
        if (!selectedPage) return;

        setSyncing(true);
        try {
            const selectedPageData = pages.find(p => p.id === selectedPage);
            if (!selectedPageData) return;

            // Get page access token from Firestore
            const pageDoc = await getDocument('pages', selectedPage);
            if (!pageDoc) {
                alert("Page not found");
                return;
            }

            const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL;
            if (!RAILWAY_URL) {
                alert("Railway URL not configured");
                return;
            }

            const response = await fetch(`${RAILWAY_URL}/sync/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId: selectedPageData.pageId,
                    pageAccessToken: (pageDoc as any).pageAccessToken
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Synced ${data.synced} comments!`);
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            console.error("Sync failed:", error);
            alert("Failed to sync comments");
        } finally {
            setSyncing(false);
        }
    };

    const handlePageSelect = (pageId: string) => {
        setSelectedPage(pageId);
        // Comments will be automatically loaded via the real-time subscription
    };

    const handleAction = async (commentId: string, action: "HIDE" | "UNHIDE" | "DELETE") => {
        setActionLoading(commentId);
        try {
            // Use Railway Worker URL if available, otherwise fallback to local proxy (which might fail if Next.js isn't running)
            const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL;
            const url = RAILWAY_URL
                ? `${RAILWAY_URL}/moderation/action`
                : `/api/moderation/${action.toLowerCase()}`;

            const body = RAILWAY_URL
                ? { pageId: selectedPage, commentId, action }
                : { pageId: selectedPage, commentId };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setComments((prev) =>
                    prev.map((c) => {
                        if (c.id === commentId) {
                            if (action === "DELETE") return null;
                            if (action === "HIDE") return { ...c, is_hidden: true };
                            if (action === "UNHIDE") return { ...c, is_hidden: false };
                        }
                        return c;
                    }).filter(Boolean) as Comment[]
                );
            } else {
                alert("Failed to perform action");
            }
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading || loadingPages) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <Layout pages={pages} selectedPage={selectedPage} onPageSelect={handlePageSelect}>
            {pages.length === 0 ? (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">No Pages Connected</h2>
                    <p className="text-slate-600 mb-8">Connect a Facebook Page to start moderating comments.</p>
                    <Link
                        to="/connect"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Connect a Page
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-900">Latest Comments</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSyncComments}
                                disabled={syncing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {syncing ? "Syncing..." : "Sync Comments"}
                            </button>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live Updates
                            </div>
                        </div>
                    </div>

                    {comments.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                            No comments found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className={`bg-white p-6 rounded-xl border ${comment.is_hidden ? 'border-yellow-200 bg-yellow-50' : 'border-slate-200'} transition-all hover:shadow-md`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{comment.author}</span>
                                            <span className="text-xs text-slate-500">• {new Date(comment.created_time).toLocaleString()}</span>
                                            {comment.is_hidden && (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Hidden</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {comment.is_hidden ? (
                                                <button
                                                    onClick={() => handleAction(comment.id, "UNHIDE")}
                                                    disabled={actionLoading === comment.id}
                                                    className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                                    title="Unhide"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(comment.id, "HIDE")}
                                                    disabled={actionLoading === comment.id}
                                                    className="p-2 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                                    title="Hide"
                                                >
                                                    <EyeOff className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAction(comment.id, "DELETE")}
                                                disabled={actionLoading === comment.id}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-slate-800 mb-2">{comment.message}</p>
                                    <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                        On post: <span className="italic">{comment.postMessage ? comment.postMessage.substring(0, 50) + '...' : 'No text'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
}
