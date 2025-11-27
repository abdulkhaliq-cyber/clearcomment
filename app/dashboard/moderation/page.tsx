"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Comment {
    id: string;
    postId: string;
    postMessage: string;
    message: string;
    authorName: string;
    authorId: string;
    createdAt: string;
    isHidden: boolean;
    sentiment?: string;
    sentimentScore?: number;
}

import { Suspense } from "react";

function ModerationFeedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pageId = searchParams.get("pageId");

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    // Fetch initial comments
    useEffect(() => {
        if (!pageId) {
            router.push("/dashboard/pages");
            return;
        }
        fetchComments();
    }, [pageId]);

    // Realtime Subscription
    useEffect(() => {
        if (!pageId) return;

        const channel = supabase
            .channel("realtime-moderation")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "Comment",
                    filter: `pageId=eq.${pageId}`,
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newComment = payload.new as any;
                        setComments((prev) => [
                            {
                                id: newComment.id,
                                postId: newComment.postId,
                                postMessage: "",
                                message: newComment.message,
                                authorName: newComment.authorName,
                                authorId: newComment.authorId,
                                createdAt: newComment.fbCreatedTime || newComment.createdAt,
                                isHidden: newComment.isHidden,
                                sentiment: newComment.sentiment,
                                sentimentScore: newComment.sentimentScore,
                            },
                            ...prev,
                        ]);
                    } else if (payload.eventType === "UPDATE") {
                        const updated = payload.new as any;
                        setComments((prev) =>
                            prev.map((c) =>
                                c.id === updated.id ? { ...c, isHidden: updated.isHidden, sentiment: updated.sentiment, sentimentScore: updated.sentimentScore } : c
                            )
                        );
                    } else if (payload.eventType === "DELETE") {
                        const deleted = payload.old as any;
                        setComments((prev) => prev.filter((c) => c.id !== deleted.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pageId]);

    const fetchComments = async () => {
        try {
            // We reuse the existing API but ensure it returns the fields we need
            const res = await fetch(`/api/moderation/comments?pageId=${pageId}`);
            if (res.ok) {
                const data = await res.json();
                // Map API response to our interface if needed
                // The API currently returns a flattened structure
                setComments(data.comments.map((c: any) => ({
                    id: c.commentId || c.id,
                    postId: c.postId,
                    postMessage: c.postMessage,
                    message: c.message,
                    authorName: c.authorName || c.author,
                    authorId: c.authorId,
                    createdAt: c.createdAt || c.created_time,
                    isHidden: c.isHidden || c.is_hidden,
                    sentiment: c.sentiment,
                    sentimentScore: c.sentimentScore
                })));
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (commentId: string, action: "HIDE" | "UNHIDE" | "DELETE") => {
        setActionLoading(commentId);
        try {
            // Optimistic Update
            setComments((prev) =>
                prev.map((c) => {
                    if (c.id === commentId) {
                        if (action === "HIDE") return { ...c, isHidden: true };
                        if (action === "UNHIDE") return { ...c, isHidden: false };
                    }
                    return c;
                })
            );

            if (action === "DELETE") {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }

            const res = await fetch(`/api/moderation/${action.toLowerCase()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId,
                    commentId,
                }),
            });

            if (!res.ok) {
                throw new Error("Action failed");
            }
        } catch (error) {
            console.error("Action failed", error);
            alert("Failed to perform action. Refreshing...");
            fetchComments(); // Revert on error
        } finally {
            setActionLoading(null);
        }
    };

    const handleReply = async (commentId: string) => {
        if (!replyText.trim()) return;
        setActionLoading(commentId);
        try {
            const res = await fetch("/api/moderation/reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId,
                    commentId,
                    message: replyText,
                }),
            });

            if (res.ok) {
                setReplyingTo(null);
                setReplyText("");
                alert("Reply sent!");
            } else {
                alert("Failed to send reply");
            }
        } catch (error) {
            console.error("Reply failed", error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/pages" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Back to Pages">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Moderation Feed</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-slate-600">Live Updates Active</span>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-500">No comments found. Waiting for new activity...</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className={`bg-white rounded-xl border shadow-sm transition-all ${comment.isHidden ? "border-yellow-300 bg-yellow-50" : "border-slate-200"
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                            {comment.authorName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{comment.authorName}</h3>
                                            <p className="text-xs text-slate-500">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {comment.sentiment && (
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${comment.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                                                comment.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                                                    'bg-slate-100 text-slate-800'
                                                }`}>
                                                {comment.sentiment}
                                            </span>
                                        )}
                                        {comment.isHidden && (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                Hidden
                                            </span>
                                        )}
                                        <a
                                            href={`https://facebook.com/${comment.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-blue-600 transition"
                                            title="View on Facebook"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                        </a>
                                    </div>
                                </div>

                                <p className="text-slate-800 text-base mb-4 leading-relaxed">
                                    {comment.message}
                                </p>

                                {comment.postMessage && (
                                    <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100">
                                        On Post: <span className="italic">{comment.postMessage.substring(0, 80)}...</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                    {comment.isHidden ? (
                                        <button
                                            onClick={() => handleAction(comment.id, "UNHIDE")}
                                            disabled={actionLoading === comment.id}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-green-600 transition"
                                        >
                                            Unhide
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAction(comment.id, "HIDE")}
                                            disabled={actionLoading === comment.id}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition"
                                        >
                                            Hide
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleAction(comment.id, "DELETE")}
                                        disabled={actionLoading === comment.id}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                                    >
                                        Delete
                                    </button>

                                    <button
                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition ml-auto"
                                    >
                                        Reply
                                    </button>
                                </div>

                                {replyingTo === comment.id && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm mb-3"
                                            rows={3}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleReply(comment.id)}
                                                disabled={actionLoading === comment.id || !replyText.trim()}
                                                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                            >
                                                {actionLoading === comment.id ? "Sending..." : "Send Reply"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function ModerationFeed() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <ModerationFeedContent />
        </Suspense>
    );
}
