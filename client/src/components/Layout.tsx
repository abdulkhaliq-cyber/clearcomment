import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface LayoutProps {
    children: React.ReactNode;
    pages?: { id: string; pageName: string }[];
    selectedPage?: string;
    onPageSelect?: (pageId: string) => void;
}

export default function Layout({ children, pages = [], selectedPage, onPageSelect }: LayoutProps) {
    const { user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <h1 className="text-xl font-bold text-blue-600">ClearComment</h1>
                        <nav className="hidden md:flex gap-4">
                            <Link to="/dashboard" className="text-slate-900 font-medium hover:text-blue-600">Dashboard</Link>
                            <Link to="/dashboard/moderation" className="text-slate-500 hover:text-slate-900">Moderation</Link>
                            <Link to="/dashboard/rules" className="text-slate-500 hover:text-slate-900">Rules</Link>
                            <Link to="/dashboard/logs" className="text-slate-500 hover:text-slate-900">Logs</Link>
                            <Link to="/connect" className="text-slate-500 hover:text-slate-900">Connect Pages</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        {pages.length > 0 && onPageSelect && (
                            <select
                                value={selectedPage}
                                onChange={(e) => onPageSelect(e.target.value)}
                                className="hidden sm:block px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition cursor-pointer"
                            >
                                {pages.map((page) => (
                                    <option key={page.id} value={page.id}>
                                        📄 {page.pageName}
                                    </option>
                                ))}
                            </select>
                        )}
                        <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                            {user?.photoURL && (
                                <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                            )}
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="hidden md:block text-sm text-slate-500 hover:text-red-600 font-medium"
                        >
                            Sign Out
                        </button>
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-500 hover:text-slate-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white">
                        <nav className="px-4 py-2 space-y-1">
                            <Link to="/dashboard" className="block px-3 py-2 text-slate-900 font-medium hover:bg-slate-50 rounded-lg">Dashboard</Link>
                            <Link to="/dashboard/moderation" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Moderation</Link>
                            <Link to="/dashboard/rules" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Rules</Link>
                            <Link to="/dashboard/logs" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Logs</Link>
                            <Link to="/connect" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Connect Pages</Link>
                            <button
                                onClick={handleSignOut}
                                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                            >
                                Sign Out
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
