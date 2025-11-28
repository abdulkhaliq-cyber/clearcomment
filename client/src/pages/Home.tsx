import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        C
                    </div>
                    <span className="text-xl font-bold text-slate-900">ClearComment</span>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <Link
                            to="/dashboard"
                            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-slate-600 hover:text-slate-900 font-medium"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-8 py-20 flex flex-col items-center text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                    Automate your Facebook <br />
                    <span className="text-blue-600">Comment Moderation</span>
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl">
                    Keep your community clean and engaging. Automatically hide spam, reply to customers, and moderate content with AI.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/register"
                        className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        Start Free Trial
                    </Link>
                    <a
                        href="#features"
                        className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition"
                    >
                        Learn More
                    </a>
                </div>

                {/* Feature Preview */}
                <div className="mt-20 w-full max-w-5xl bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-2xl">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                                    ⚡️
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">Real-time Actions</h3>
                                <p className="text-sm text-slate-600">Instantly hide or delete comments based on your custom rules.</p>
                            </div>
                            <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                                    🤖
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">AI Moderation</h3>
                                <p className="text-sm text-slate-600">Let AI detect toxic content, spam, and harassment automatically.</p>
                            </div>
                            <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                                    💬
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">Auto Replies</h3>
                                <p className="text-sm text-slate-600">Engage with your audience by automatically replying to common questions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
