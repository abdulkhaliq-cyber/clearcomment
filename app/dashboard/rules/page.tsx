"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Page {
    id: string;
    pageName: string;
}

interface Rule {
    id: string;
    type: "BLOCK_KEYWORD" | "AUTO_REPLY";
    keyword: string;
    replyText?: string;
    isEnabled: boolean;
}

export default function RulesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<string>("");
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [newRuleType, setNewRuleType] = useState<"BLOCK_KEYWORD" | "AUTO_REPLY">("BLOCK_KEYWORD");
    const [newKeyword, setNewKeyword] = useState("");
    const [newReplyText, setNewReplyText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            fetchPages();
        } else if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status]);

    useEffect(() => {
        if (selectedPage) {
            fetchRules(selectedPage);
        } else {
            setRules([]);
        }
    }, [selectedPage]);

    const fetchPages = async () => {
        try {
            const res = await fetch("/api/pages");
            if (res.ok) {
                const data = await res.json();
                setPages(data);
                if (data.length > 0) {
                    setSelectedPage(data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch pages", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRules = async (pageId: string) => {
        try {
            const res = await fetch(`/api/rules?pageId=${pageId}`);
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch rules", error);
        }
    };

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId: selectedPage,
                    type: newRuleType,
                    keyword: newKeyword,
                    replyText: newRuleType === "AUTO_REPLY" ? newReplyText : undefined,
                }),
            });

            if (res.ok) {
                const newRule = await res.json();
                setRules([newRule, ...rules]);
                setShowModal(false);
                setNewKeyword("");
                setNewReplyText("");
            } else {
                alert("Failed to add rule");
            }
        } catch (error) {
            console.error("Error adding rule", error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleRule = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setRules(rules.map(r => r.id === id ? { ...r, isEnabled: !currentStatus } : r));

        try {
            await fetch("/api/rules", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isEnabled: !currentStatus }),
            });
        } catch (error) {
            console.error("Error toggling rule", error);
            // Revert on error
            setRules(rules.map(r => r.id === id ? { ...r, isEnabled: currentStatus } : r));
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        // Optimistic update
        setRules(rules.filter(r => r.id !== id));

        try {
            await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
        } catch (error) {
            console.error("Error deleting rule", error);
            fetchRules(selectedPage); // Re-fetch to sync
        }
    };

    if (status === "loading" || loading) {
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
                    <div className="flex items-center gap-8">
                        <h1 className="text-xl font-bold text-blue-600">ClearComment</h1>
                        <nav className="hidden md:flex gap-4">
                            <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">Moderation</Link>
                            <Link href="/dashboard/rules" className="text-slate-900 font-medium">Rules</Link>
                            <Link href="/connect" className="text-slate-500 hover:text-slate-900">Connect Pages</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedPage}
                            onChange={(e) => setSelectedPage(e.target.value)}
                            className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            {pages.map((page) => (
                                <option key={page.id} value={page.id}>
                                    {page.pageName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Moderation Rules</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Rule
                    </button>
                </div>

                {rules.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-500 mb-4">No rules defined for this page.</p>
                        <button onClick={() => setShowModal(true)} className="text-blue-600 hover:underline">Create your first rule</button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Condition</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {rules.map((rule) => (
                                    <tr key={rule.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${rule.type === 'BLOCK_KEYWORD' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {rule.type === 'BLOCK_KEYWORD' ? 'Block' : 'Auto-Reply'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            Contains: <span className="font-mono bg-slate-100 px-1 rounded">{rule.keyword}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {rule.type === 'BLOCK_KEYWORD' ? 'Hide Comment' : `Reply: "${rule.replyText?.substring(0, 20)}..."`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleRule(rule.id, rule.isEnabled)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${rule.isEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => deleteRule(rule.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Add Rule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Rule</h3>
                        <form onSubmit={handleAddRule}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rule Type</label>
                                <select
                                    value={newRuleType}
                                    onChange={(e) => setNewRuleType(e.target.value as any)}
                                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="BLOCK_KEYWORD">Block Keyword</option>
                                    <option value="AUTO_REPLY">Auto Reply</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    If comment contains:
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    placeholder="e.g. spam, link, badword"
                                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            {newRuleType === "AUTO_REPLY" && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Reply with:
                                    </label>
                                    <textarea
                                        required
                                        value={newReplyText}
                                        onChange={(e) => setNewReplyText(e.target.value)}
                                        placeholder="Thanks for your comment! Please send us a DM."
                                        className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows={3}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : "Save Rule"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
