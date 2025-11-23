"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
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
                    <h1 className="text-xl font-bold text-slate-900">User Profile</h1>
                </div>
            </header>

            <div className="max-w-3xl mx-auto p-8 space-y-8">

                {/* User Info Card */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900">Personal Information</h3>
                    </div>
                    <div className="p-6 flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                            {session?.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-slate-400">
                                    {session?.user?.name?.charAt(0) || "U"}
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-slate-900">{session?.user?.name}</h2>
                            <p className="text-slate-500">{session?.user?.email}</p>
                            <div className="pt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active Account
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Card */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-slate-900">Subscription Plan</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide">
                            Free Tier
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-medium text-slate-900">Current Plan: Free</h4>
                                <p className="text-sm text-slate-500 mt-1">You are currently on the free tier. Upgrade to unlock advanced AI features.</p>
                            </div>
                            <button
                                disabled
                                className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed"
                            >
                                Upgrade (Coming Soon)
                            </button>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "25%" }}></div>
                        </div>
                        <p className="text-xs text-slate-400 text-right">Usage: 250 / 1,000 comments this month</p>
                    </div>
                </div>

                {/* Security & Actions */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900">Account Security</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-slate-900">Password</h4>
                                <p className="text-sm text-slate-500">Change your account password.</p>
                            </div>
                            <button
                                disabled
                                className="px-4 py-2 border border-slate-300 text-slate-400 rounded-lg font-medium cursor-not-allowed bg-slate-50"
                                title="Managed by OAuth provider"
                            >
                                Change Password
                            </button>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full py-3 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
