import Layout from "../components/Layout";

export default function Moderation() {
    return (
        <Layout pages={[]} selectedPage="" onPageSelect={() => { }}>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Moderation Settings</h1>
                <p className="text-slate-600">Configure your automated moderation rules here.</p>
                <div className="mt-8 p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                    Feature coming soon
                </div>
            </div>
        </Layout>
    );
}
