"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    category: string;
    tasks: string[];
}

export default function ConnectPages() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch pages when session is ready
    useEffect(() => {
        if (status === "authenticated" && (session as any)?.accessToken) {
            fetchPages((session as any).accessToken);
        }
    }, [status, session]);

    const fetchPages = async (accessToken: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
            );
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            setPages(data.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch pages from Facebook.");
        } finally {
            setLoading(false);
        }
    };

    const togglePageSelection = (pageId: string) => {
        const newSelected = new Set(selectedPages);
        if (newSelected.has(pageId)) {
            newSelected.delete(pageId);
        } else {
            newSelected.add(pageId);
        }
        setSelectedPages(newSelected);
    };

    const handleConnect = async () => {
        if (selectedPages.size === 0) return;

        setConnecting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/facebook/sync-pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shortLivedToken: (session as any)?.accessToken,
                    selectedPageIds: Array.from(selectedPages),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to connect pages.");
            }

            setSuccess(`Successfully connected ${data.count} page(s)!`);
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "An error occurred while connecting pages.");
        } finally {
            setConnecting(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Connect Facebook</h1>
                    <p className="text-slate-600 mb-8">
                        Sign in with Facebook to select the pages you want to moderate.
                    </p>
                    <button
                        onClick={() => signIn("facebook", { callbackUrl: "/connect" })}
                        className="w-full py-3 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.79-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Continue with Facebook
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-slate-900">Connect Pages</h1>
                        <p className="text-slate-600 mt-1">
                            Select the Facebook Pages you want to enable for auto-moderation.
                        </p>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                                {success}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : pages.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No Facebook Pages found for this account.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pages.map((page) => (
                                    <div
                                        key={page.id}
                                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition ${selectedPages.has(page.id)
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-slate-200 hover:border-blue-300"
                                            }`}
                                        onClick={() => togglePageSelection(page.id)}
                                    >
                                        <div className="flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={selectedPages.has(page.id)}
                                                onChange={() => togglePageSelection(page.id)}
                                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h3 className="text-lg font-medium text-slate-900">{page.name}</h3>
                                            <p className="text-sm text-slate-500 capitalize">{page.category}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={selectedPages.size === 0 || connecting}
                            className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold transition ${selectedPages.size === 0 || connecting
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-blue-700"
                                }`}
                        >
                            {connecting ? "Connecting..." : `Connect ${selectedPages.size} Page(s)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
