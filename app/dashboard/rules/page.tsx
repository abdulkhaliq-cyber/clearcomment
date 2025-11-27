"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Rule {
    id: string;
    type: "BLOCK_KEYWORD" | "AUTO_REPLY" | "BLOCK_LINK" | "BLOCK_IMAGE" | "REGEX_MATCH";
    keyword?: string;
    replyText?: string;
    isEnabled: boolean;
    lastTriggeredAt?: string;
    createdAt: string;
    ruleConfig?: any;
}

import { Suspense } from "react";

function RulesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pageId = searchParams.get("pageId");

    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [ruleType, setRuleType] = useState<Rule["type"]>("BLOCK_KEYWORD");
    const [keyword, setKeyword] = useState("");
    const [replyText, setReplyText] = useState("");
    const [exactMatch, setExactMatch] = useState(false);

    useEffect(() => {
        if (!pageId) {
            router.push("/dashboard/pages");
            return;
        }
        fetchRules();
    }, [pageId]);

    const fetchRules = async () => {
        try {
            const res = await fetch(`/api/rules?pageId=${pageId}`);
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch rules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId,
                    type: ruleType,
                    keyword: ruleType === "BLOCK_KEYWORD" || ruleType === "REGEX_MATCH" ? keyword : undefined,
                    replyText: ruleType === "AUTO_REPLY" ? replyText : undefined,
                    ruleConfig: { exactMatch },
                }),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setKeyword("");
                setReplyText("");
                setExactMatch(false);
                fetchRules();
            } else {
                alert("Failed to create rule");
            }
        } catch (error) {
            console.error("Error creating rule", error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleRule = async (ruleId: string, currentStatus: boolean) => {
        // Optimistic update
        setRules((prev) =>
            prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !currentStatus } : r))
        );

        try {
            await fetch("/api/rules", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ruleId, isEnabled: !currentStatus }),
            });
        } catch (error) {
            console.error("Failed to toggle rule", error);
            fetchRules(); // Revert
        }
    };

    const deleteRule = async (ruleId: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        // Optimistic update
        setRules((prev) => prev.filter((r) => r.id !== ruleId));

        try {
            await fetch(`/api/rules?ruleId=${ruleId}`, {
                method: "DELETE",
            });
        } catch (error) {
            console.error("Failed to delete rule", error);
            fetchRules(); // Revert
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
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/pages"
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Back to Pages"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Moderation Rules</h1>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Rule
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto p-8">
                {rules.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No Rules Configured</h3>
                        <p className="text-slate-500 mb-6">Create rules to automatically hide spam or reply to comments.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Create First Rule
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Configuration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Triggered</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.type === "BLOCK_KEYWORD"
                                                    ? "bg-red-100 text-red-800"
                                                    : rule.type === "AUTO_REPLY"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : rule.type === "BLOCK_LINK"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : "bg-purple-100 text-purple-800"
                                                    }`}
                                            >
                                                {rule.type.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">
                                                {rule.type === "BLOCK_KEYWORD" && (
                                                    <>
                                                        Block if contains: <span className="font-mono bg-slate-100 px-1 rounded">{rule.keyword}</span>
                                                    </>
                                                )}
                                                {rule.type === "REGEX_MATCH" && (
                                                    <>
                                                        Regex Match: <span className="font-mono bg-slate-100 px-1 rounded">{rule.keyword}</span>
                                                    </>
                                                )}
                                                {rule.type === "AUTO_REPLY" && (
                                                    <>
                                                        Reply: <span className="italic text-slate-600">"{rule.replyText}"</span>
                                                    </>
                                                )}
                                                {rule.type === "BLOCK_LINK" && "Block all comments containing URLs"}
                                                {rule.type === "BLOCK_IMAGE" && "Block all comments with images/GIFs"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={rule.isEnabled}
                                                    onChange={() => toggleRule(rule.id, rule.isEnabled)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).toLocaleDateString() : "Never"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => deleteRule(rule.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Rule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleCreateRule}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Add New Rule</h3>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Rule Type</label>
                                            <select
                                                value={ruleType}
                                                onChange={(e) => setRuleType(e.target.value as any)}
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                            >
                                                <option value="BLOCK_KEYWORD">Block Keyword</option>
                                                <option value="AUTO_REPLY">Auto Reply</option>
                                                <option value="BLOCK_LINK">Block Links</option>
                                                <option value="BLOCK_IMAGE">Block Images</option>
                                                <option value="REGEX_MATCH">Regex Match</option>
                                            </select>
                                        </div>

                                        {(ruleType === "BLOCK_KEYWORD" || ruleType === "REGEX_MATCH") && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    {ruleType === "REGEX_MATCH" ? "Regular Expression" : "Keyword / Phrase"}
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={keyword}
                                                    onChange={(e) => setKeyword(e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder={ruleType === "REGEX_MATCH" ? "^[0-9]+$" : "e.g. spam"}
                                                />
                                            </div>
                                        )}

                                        {ruleType === "AUTO_REPLY" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Reply Message</label>
                                                <textarea
                                                    required
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    rows={3}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="Thanks for your comment! We will get back to you shortly."
                                                />
                                            </div>
                                        )}

                                        {ruleType === "BLOCK_KEYWORD" && (
                                            <div className="flex items-center">
                                                <input
                                                    id="exact-match"
                                                    type="checkbox"
                                                    checked={exactMatch}
                                                    onChange={(e) => setExactMatch(e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="exact-match" className="ml-2 block text-sm text-gray-900">
                                                    Exact match only
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {submitting ? "Creating..." : "Create Rule"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RulesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <RulesContent />
        </Suspense>
    );
}
