import React, { useState, useEffect, useRef } from 'react';

// --- V3 Mock Data ---
const initialFiles = [
    { id: 1, name: 'Q4_2024_Financials.pdf', source: 'Google Drive', size: '2.1 MB', lastUpdated: '2025-07-15', tags: ['finance', 'quarterly-report', 'revenue'], contentChunks: 15 },
    { id: 2, name: 'Onboarding_Process_v3.docx', source: 'Notion', size: '850 KB', lastUpdated: '2025-07-12', tags: ['hr', 'policy', 'onboarding'], contentChunks: 22 },
    { id: 3, name: 'Product_Roadmap_2026.pdf', source: 'Google Drive', size: '5.4 MB', lastUpdated: '2025-07-10', tags: ['product', 'strategy', 'roadmap'], contentChunks: 45 },
    { id: 4, name: 'Support_Tickets_June.csv', source: 'Zendesk', size: '12.3 MB', lastUpdated: '2025-07-01', tags: ['support', 'customer-data'], contentChunks: 152 },
    { id: 5, name: 'Marketing_Campaign_Brief_Fall.docx', source: 'Notion', size: '450 KB', lastUpdated: '2025-06-28', tags: ['marketing', 'campaign'], contentChunks: 8 },
    { id: 6, name: 'API_Documentation_v2.1.md', source: 'GitLab', size: '1.2 MB', lastUpdated: '2025-07-16', tags: ['technical', 'product', 'docs'], contentChunks: 78 },
];

const initialJobs = [
    { id: 'job-001', name: 'v1.0-initial-launch', baseModel: 'Claude 3 Sonnet', status: 'Completed', trainedOnTags: ['finance', 'hr', 'policy'], createdAt: '2025-07-10', duration: '45 mins' },
    { id: 'job-002', name: 'v1.1-with-product-docs', baseModel: 'Llama 3 8B', status: 'Completed', trainedOnTags: ['finance', 'hr', 'policy', 'product', 'strategy'], createdAt: '2025-07-12', duration: '1.2 hours' },
    { id: 'job-003', name: 'v2.0-q4-and-support', baseModel: 'GPT-4o', status: 'Completed', trainedOnTags: ['finance', 'quarterly-report', 'revenue', 'support'], createdAt: '2025-07-16', duration: '2.5 hours' },
];

const initialModels = [
    { id: 'model-001', name: 'v1.0-initial-launch', fineTuneJobId: 'job-001', createdAt: '2025-07-10', accuracy: 82, cost: 0.50, latency: 450, trainedOnTags: ['finance', 'hr', 'policy'] },
    { id: 'model-002', name: 'v1.1-with-product-docs', fineTuneJobId: 'job-002', createdAt: '2025-07-12', accuracy: 86, cost: 0.65, latency: 520, trainedOnTags: ['finance', 'hr', 'policy', 'product', 'strategy'] },
    { id: 'model-003', name: 'v2.0-q4-and-support', fineTuneJobId: 'job-003', createdAt: '2025-07-16', accuracy: 89, cost: 1.20, latency: 650, trainedOnTags: ['finance', 'quarterly-report', 'revenue', 'support'] },
];

const goldenSet = [
    { id: 1, question: "What was the revenue in Q4 2024?", v2_answer: "$12.5M, an 8% QoQ increase.", v1_answer: "$12.5M", status: 'improved' },
    { id: 2, question: "What is our company's vacation policy?", v2_answer: "The vacation policy was updated in v3 of the onboarding docs.", v1_answer: "Employees get 20 days of paid time off.", status: 'regression' },
];

const initialFeedback = [
    { id: 1, rating: 1, query: "How do I get a refund?", response: "Go to the settings page.", comment: "This is useless, where in settings??", timestamp: "2025-07-17 10:45:12" },
    { id: 2, rating: 5, query: "What's the price of the enterprise plan?", response: "The enterprise plan is custom-quoted. I can connect you with a sales representative.", comment: "perfect, thanks!", timestamp: "2025-07-17 10:42:03" },
    { id: 3, rating: 2, query: "Cancel my subscription", response: "I cannot perform that action. Please contact support.", comment: "why can't the bot do this?", timestamp: "2025-07-17 10:31:54" },
    { id: 4, rating: 4, query: "What are your support hours?", response: "Our support team is available 24/7 via email and from 9am-6pm ET via phone.", comment: "", timestamp: "2025-07-17 10:25:01" },
];

const initialImprovementCases = [
    { id: 'case-01', query: "How do I get a refund?", badResponse: "Go to the settings page.", suggestedResponse: "You can request a refund within 30 days by visiting your account dashboard under 'Order History' and clicking the 'Request Refund' button.", status: 'pending' },
    { id: 'case-02', query: "Cancel my subscription", badResponse: "I cannot perform that action. Please contact support.", suggestedResponse: "To cancel your subscription, go to 'Billing' in your account settings and click 'Cancel Subscription'. Please note this action is irreversible.", status: 'pending' },
];

// --- Helper Components & Icons ---
const Icon = ({ name, className }) => {
    const icons = {
        layout: <path d="M3 9.5L12 3l9 6.5V21h-6v-8h-6v8H3V9.5z" />,
        database: <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3zM3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />,
        sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
        play: <path d="M6 3l12 9-12 9V3z" />,
        rocket: <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.1S5.21 15.66 4.5 16.5zM19 3c-1.5 1.5-2.08 4.5-2 5 .08 1.5.8 2.9 2 4 .9.8 2.1 1 3.2 1 1.8 0 3-1.8 3-3 0-1.5-.5-2.9-1.8-4C21.9 4.5 19 3 19 3zm-9 6c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />,
        check: <path d="M20 6L9 17l-5-5" />,
        x: <path d="M18 6L6 18M6 6l12 12" />,
        plus: <path d="M12 5v14m-7-7h14" />,
        arrowRight: <path d="M5 12h14m-7-7l7 7-7 7" />,
        file: <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />,
        cpu: <path d="M5 2v2h14V2H5zm0 18v2h14v-2H5zm12-2H7a2 2 0 00-2 2v2h14v-2a2 2 0 00-2-2zM7 4h10v12H7V4z" />,
        dollarSign: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
        zap: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
        arrowUp: <path d="M12 19V5m-7 7l7-7 7 7" />,
        arrowDown: <path d="M12 5v14m-7-7l7 7 7 7" />,
        clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>,
        star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    };
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name] || <circle cx="12" cy="12" r="10" />}</svg>;
};

const Card = ({ children, className = '' }) => <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 ${className}`}>{children}</div>;

const Modal = ({ show, onClose, children, title }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="x" className="w-6 h-6" /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

// --- View Components ---

const DashboardView = ({ setActiveView, jobs, models }) => {
    const liveModel = models.find(m => m.id === 'model-003');
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Mission Control</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center"><Icon name="star" className="w-5 h-5 mr-3 text-yellow-400" />User Feedback</h2>
                    <p className="text-gray-400">Avg. Rating (24h)</p>
                    <p className="text-yellow-400 font-bold text-3xl mt-1">3.8 / 5.0</p>
                    <p className="text-red-400 font-semibold mt-4">2 New Low-Rated Cases</p>
                    <button onClick={() => setActiveView('feedback')} className="mt-4 w-full text-center bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold py-2 rounded-lg hover:bg-yellow-500/20 transition-all">Analyze Feedback</button>
                </Card>
                <Card>
                    <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center"><Icon name="rocket" className="w-5 h-5 mr-3 text-purple-400" />Live Model: {liveModel.name}</h2>
                    <div className="flex justify-around mt-4 text-center">
                        <div><p className="text-gray-400 text-sm">Accuracy</p><p className="text-green-400 font-bold text-2xl">{liveModel.accuracy}%</p></div>
                        <div><p className="text-gray-400 text-sm">Cost/1k</p><p className="text-white font-bold text-2xl">${liveModel.cost.toFixed(2)}</p></div>
                        <div><p className="text-gray-400 text-sm">Latency</p><p className="text-white font-bold text-2xl">{liveModel.latency}ms</p></div>
                    </div>
                </Card>
                 <Card>
                    <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center"><Icon name="database" className="w-5 h-5 mr-3 text-green-400" />Knowledge Base</h2>
                    <p className="text-gray-400">Documents</p><p className="text-white text-2xl font-bold mt-1">{initialFiles.length}</p>
                    <p className="text-gray-400 mt-4">Total Chunks</p><p className="text-white text-2xl font-bold mt-1">{initialFiles.reduce((acc, f) => acc + f.contentChunks, 0)}</p>
                </Card>
            </div>
        </div>
    );
};

const DataPrepView = () => { /* ... No changes ... */ return <div>Data Prep View</div>; };

const FineTuningView = ({ jobs, setJobs }) => {
    const [activeTab, setActiveTab] = useState('jobs');
    const [improvementCases, setImprovementCases] = useState(initialImprovementCases);

    const handleCaseAction = (caseId, status) => {
        setImprovementCases(cases => cases.map(c => c.id === caseId ? {...c, status} : c));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Fine-Tuning & Improvements</h1>
            <div className="flex border-b border-gray-700 mb-6">
                <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 font-semibold ${activeTab === 'jobs' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}>Jobs</button>
                <button onClick={() => setActiveTab('improvements')} className={`px-4 py-2 font-semibold ${activeTab === 'improvements' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}>
                    Improvement Queue <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{improvementCases.filter(c => c.status === 'pending').length}</span>
                </button>
            </div>
            {activeTab === 'jobs' && <FineTuningJobsView jobs={jobs} setJobs={setJobs} />}
            {activeTab === 'improvements' && <ImprovementQueueView cases={improvementCases} onAction={handleCaseAction} />}
        </div>
    );
};

const FineTuningJobsView = ({ jobs, setJobs }) => {
    // This is the original content of FineTuningView
    return (
        <Card className="p-0">
            <table className="w-full text-left">
                <thead className="border-b border-gray-700"><tr><th className="p-4 font-semibold text-gray-400">Job Name</th><th className="p-4 font-semibold text-gray-400">Base Model</th><th className="p-4 font-semibold text-gray-400">Status</th><th className="p-4 font-semibold text-gray-400">Trained On</th></tr></thead>
                <tbody>
                    {jobs.map(job => (
                        <tr key={job.id} className="border-b border-gray-800 hover:bg-gray-800/60">
                            <td className="p-4 text-white font-medium">{job.name}</td>
                            <td className="p-4 text-gray-300">{job.baseModel}</td>
                            <td className="p-4"><span className="text-green-400 font-semibold flex items-center"><Icon name="check" className="w-4 h-4 mr-2"/>Completed</span></td>
                            <td className="p-4 text-gray-400 text-xs">{(job.trainedOnTags || []).join(', ')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
};

const ImprovementQueueView = ({ cases, onAction }) => {
    const pendingCases = cases.filter(c => c.status === 'pending');
    return (
        <Card className="p-0">
            <div className="p-4 text-gray-400">Review AI-suggested improvements based on user feedback. Approved cases will be added to the dataset for the next fine-tuning job.</div>
            <table className="w-full text-left">
                <thead className="border-b border-gray-700"><tr><th className="p-4 font-semibold text-gray-400 w-1/4">Original Query</th><th className="p-4 font-semibold text-gray-400 w-1/3">Bad Response</th><th className="p-4 font-semibold text-gray-400 w-1/3">Suggested Improvement</th><th className="p-4 font-semibold text-gray-400">Actions</th></tr></thead>
                <tbody>
                    {pendingCases.map(c => (
                        <tr key={c.id} className="border-b border-gray-800">
                            <td className="p-4 text-sm text-gray-300 font-medium">{c.query}</td>
                            <td className="p-4 text-sm text-red-400/80 bg-red-900/10">{c.badResponse}</td>
                            <td className="p-4 text-sm text-green-300 bg-green-900/10">{c.suggestedResponse}</td>
                            <td className="p-4 space-x-2">
                                <button onClick={() => onAction(c.id, 'approved')} className="bg-green-500/20 text-green-300 font-bold p-2 rounded-lg hover:bg-green-500/40"><Icon name="check" className="w-5 h-5"/></button>
                                <button onClick={() => onAction(c.id, 'rejected')} className="bg-red-500/20 text-red-300 font-bold p-2 rounded-lg hover:bg-red-500/40"><Icon name="x" className="w-5 h-5"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {pendingCases.length === 0 && <p className="p-6 text-center text-gray-500">No pending improvement cases. Great job!</p>}
        </Card>
    );
};

const EvaluationView = () => { /* ... No changes ... */ return <div>Evaluation View</div>; };
const DeploymentView = () => { /* ... No changes ... */ return <div>Deployment View</div>; };

const FeedbackView = () => {
    const [feedback, setFeedback] = useState(initialFeedback);

    const createImprovementCase = (feedbackItem) => {
        console.log("Creating improvement case for feedback ID:", feedbackItem.id);
        // In a real app, this would trigger a backend process
        // and add a new item to the improvement queue.
        alert(`Improvement case created for: "${feedbackItem.query}"`);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Feedback Analysis</h1>
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Feedback Triage Queue</h2>
                <p className="text-gray-400 mb-6">Review recent user feedback. Create improvement cases for low-rated conversations to feed the learning loop.</p>
                <table className="w-full text-left">
                    <thead className="border-b border-gray-700"><tr><th className="p-4 font-semibold text-gray-400">Rating</th><th className="p-4 font-semibold text-gray-400">Query</th><th className="p-4 font-semibold text-gray-400">Bot Response</th><th className="p-4 font-semibold text-gray-400">Comment</th><th className="p-4 font-semibold text-gray-400">Action</th></tr></thead>
                    <tbody>
                        {feedback.map(item => (
                            <tr key={item.id} className="border-b border-gray-800">
                                <td className="p-4 font-bold text-lg text-yellow-400">{item.rating} <span className="text-gray-500">/ 5</span></td>
                                <td className="p-4 text-gray-300">{item.query}</td>
                                <td className="p-4 text-gray-400">{item.response}</td>
                                <td className="p-4 text-white italic">"{item.comment}"</td>
                                <td className="p-4">
                                    {item.rating <= 2 && (
                                        <button onClick={() => createImprovementCase(item)} className="bg-cyan-500 text-white font-bold py-1.5 px-3 rounded-lg text-sm hover:bg-cyan-600">Create Case</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [jobs, setJobs] = useState(initialJobs);
    const [models, setModels] = useState(initialModels);

    const NavItem = ({ view, icon, label, badgeCount }) => (
        <button onClick={() => setActiveView(view)} className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-lg transition-all ${activeView === view ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <div className="flex items-center">
                <Icon name={icon} className={`w-6 h-6 mr-4 ${activeView === view ? 'text-cyan-400' : ''}`} />
                <span className="font-semibold">{label}</span>
            </div>
            {badgeCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badgeCount}</span>}
        </button>
    );

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView setActiveView={setActiveView} jobs={jobs} models={models} />;
            case 'data-prep': return <DataPrepView />;
            case 'tuning': return <FineTuningView jobs={jobs} setJobs={setJobs} />;
            case 'evaluation': return <EvaluationView />;
            case 'deployment': return <DeploymentView />;
            case 'feedback': return <FeedbackView />;
            default: return <DashboardView setActiveView={setActiveView} jobs={jobs} models={models} />;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-200 font-sans min-h-screen flex">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'); body { font-family: 'Inter', sans-serif; }`}</style>
            <nav className="w-64 bg-gray-900/70 backdrop-blur-xl border-r border-gray-800/50 p-6 flex-shrink-0">
                <div className="flex items-center mb-12"><div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-lg mr-3"></div><h1 className="font-black text-xl text-white">AI Center</h1></div>
                <div className="space-y-3">
                    <NavItem view="dashboard" icon="layout" label="Dashboard" />
                    <NavItem view="feedback" icon="star" label="Feedback" badgeCount={initialImprovementCases.filter(c => c.status === 'pending').length} />
                    <NavItem view="data-prep" icon="clipboard" label="Data Prep" />
                    <NavItem view="tuning" icon="sliders" label="Fine-Tuning" />
                    <NavItem view="evaluation" icon="play" label="Evaluation" />
                    <NavItem view="deployment" icon="rocket" label="Deployment" />
                </div>
            </nav>
            <main className="flex-grow p-8 overflow-auto">{renderView()}</main>
        </div>
    );
}
