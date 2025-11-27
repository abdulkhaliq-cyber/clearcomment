"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

interface PageDetails {
    id: string;
    pageId: string;
    pageName: string;
    moderationEnabled: boolean;
    createdAt: string;
}

import { Suspense } from "react";

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pageId = searchParams.get("pageId");

    const [page, setPage] = useState<PageDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState(false);

    useEffect(() => {
        if (!pageId) {
            router.push("/dashboard/pages");
            return;
        }
        fetchPageDetails();
    }, [pageId]);

    const fetchPageDetails = async () => {
        try {
            // Reuse the generic pages API but filter client-side or create a specific GET /api/pages/[id]
            // For simplicity, we'll fetch all and find the one we need
            const res = await fetch("/api/pages");
            if (res.ok) {
                const data = await res.json();
                const found = data.find((p: any) => p.id === pageId);
                if (found) {
                    setPage(found);
                } else {
                    router.push("/dashboard/pages");
                }
            }
        } catch (error) {
            console.error("Failed to fetch page details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReconnect = () => {
        // Trigger Facebook OAuth flow again to refresh tokens
        signIn("facebook", { callbackUrl: "/dashboard/pages" });
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure? This will delete all logs, rules, and comments associated with this page.")) return;

        setDisconnecting(true);
        try {
            const res = await fetch(`/api/pages/${pageId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/dashboard/pages");
            } else {
                alert("Failed to disconnect page");
            }
        } catch (error) {
            console.error("Disconnect failed", error);
        } finally {
            setDisconnecting(false);
        }
    };

    const handleTestWebhook = async () => {
        setTestingWebhook(true);
        try {
            const res = await fetch("/api/webhooks/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId }),
            });

            if (res.ok) {
                alert("Test event sent! Check the Logs page.");
            } else {
                alert("Test failed");
            }
        } catch (error) {
            console.error("Test failed", error);
        } finally {
            setTestingWebhook(false);
        }
    };

    const toggleModeration = async () => {
        if (!page) return;
        // Optimistic update
        setPage({ ...page, moderationEnabled: !page.moderationEnabled });

        try {
            await fetch(`/api/pages/${page.id}/toggle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !page.moderationEnabled }),
            });
        } catch (error) {
            console.error("Toggle failed", error);
            fetchPageDetails(); // Revert
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!page) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/pages" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Back to Pages">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Page Settings</h1>
                </div>
            </header>

            <div className="max-w-3xl mx-auto p-8 space-y-8">

                {/* Page Info Card */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900">General Information</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                                <img
                                    src={`https://graph.facebook.com/v19.0/${page.pageId}/picture?type=square`}
                                    alt={page.pageName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{page.pageName}</h2>
                                <p className="text-slate-500">Facebook Page ID: {page.pageId}</p>
                                <p className="text-sm text-slate-400 mt-1">Connected on {new Date(page.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div>
                                <h4 className="font-medium text-slate-900">Auto-Moderation</h4>
                                <p className="text-sm text-slate-500">Enable or disable all automated rules for this page.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={page.moderationEnabled}
                                    onChange={toggleModeration}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Connection Settings */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900">Connection & Testing</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-slate-900">Reconnect Page</h4>
                                <p className="text-sm text-slate-500">Refresh permissions or update access tokens.</p>
                            </div>
                            <button
                                onClick={handleReconnect}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition"
                            >
                                Reconnect with Facebook
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div>
                                <h4 className="font-medium text-slate-900">Test Webhook</h4>
                                <p className="text-sm text-slate-500">Send a dummy event to verify your webhook integration.</p>
                            </div>
                            <button
                                onClick={handleTestWebhook}
                                disabled={testingWebhook}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition disabled:opacity-50"
                            >
                                {testingWebhook ? "Sending..." : "Send Test Event"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                        <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-slate-900">Disconnect Page</h4>
                                <p className="text-sm text-slate-500">Remove this page and delete all associated data.</p>
                            </div>
                            <button
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
                            >
                                {disconnecting ? "Disconnecting..." : "Disconnect Page"}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
