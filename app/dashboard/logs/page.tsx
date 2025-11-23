"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Log {
    id: string;
    action: string;
    commentText: string | null;
    ruleId: string | null;
    success: boolean;
    performedAt: string;
}

import { Suspense } from "react";

function LogsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pageId = searchParams.get("pageId");

    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (!pageId) {
            router.push("/dashboard/pages");
            return;
        }
        fetchLogs();
    }, [pageId]);

    const fetchLogs = async (cursor?: string) => {
        try {
            const url = new URL("/api/logs", window.location.origin);
            url.searchParams.set("pageId", pageId!);
            if (cursor) url.searchParams.set("cursor", cursor);

            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                if (cursor) {
                    setLogs((prev) => [...prev, ...data.logs]);
                } else {
                    setLogs(data.logs);
                }
                setNextCursor(data.nextCursor);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (nextCursor) {
            setLoadingMore(true);
            fetchLogs(nextCursor);
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
                    <Link href="/dashboard/pages" className="text-slate-500 hover:text-slate-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Moderation Logs</h1>
                </div>
                <button
                    onClick={() => fetchLogs()}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </header>

            <div className="max-w-6xl mx-auto p-8">
                {logs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No Logs Yet</h3>
                        <p className="text-slate-500">Moderation actions will appear here once they occur.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Comment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trigger</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(log.performedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${log.action === "HIDE"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : log.action === "DELETE"
                                                        ? "bg-red-100 text-red-800"
                                                        : log.action === "REPLY"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : log.action === "UNHIDE"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900 max-w-md truncate" title={log.commentText || ""}>
                                                {log.commentText || <span className="text-slate-400 italic">No content</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {log.ruleId ? (
                                                <span className="flex items-center gap-1 text-purple-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Auto Rule
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Manual
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.success ? (
                                                <span className="text-green-600 flex items-center gap-1 text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-1 text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {nextCursor && (
                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-50"
                                >
                                    {loadingMore ? "Loading..." : "Load More Logs"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LogsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <LogsContent />
        </Suspense>
    );
}
