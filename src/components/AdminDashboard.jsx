import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, Upload, Search, TrendingUp, Users, MessageSquare, Database, Trash2, Edit, Eye, FileText, X, ChevronRight, Filter } from 'lucide-react';
import KnowledgeBaseManager from './KnowledgeBaseManager';

const AdminDashboard = ({ supabase, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalQueries: 0,
    successfulResponses: 0,
    failedQueries: 0,
    avgConfidence: 0,
    activeUsers: 0,
    knowledgeChunks: 0
  });
  const [recentQueries, setRecentQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      
      try {
        // For now, using mock data until tables are created
        // TODO: Replace with actual Supabase queries
        setStats({
          totalQueries: 2847,
          successfulResponses: 2623,
          failedQueries: 224,
          avgConfidence: 0.91,
          activeUsers: 186,
          knowledgeChunks: 3456
        });

        setRecentQueries([
          { id: 1, query: "Spray booth not working", response: "Check spray nozzle alignment...", confidence: 0.95, helpful: true, timestamp: "2 mins ago" },
          { id: 2, query: "Error code E3", response: "This indicates low pressure...", confidence: 0.88, helpful: true, timestamp: "5 mins ago" },
          { id: 3, query: "Maintenance schedule", response: "Based on your model...", confidence: 0.92, helpful: true, timestamp: "12 mins ago" }
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const successRate = stats.totalQueries > 0 ? (stats.successfulResponses / stats.totalQueries * 100).toFixed(1) : 0;

  const chartData = [
    { name: 'Mon', queries: 345, successful: 320 },
    { name: 'Tue', queries: 412, successful: 385 },
    { name: 'Wed', queries: 378, successful: 350 },
    { name: 'Thu', queries: 489, successful: 450 },
    { name: 'Fri', queries: 523, successful: 480 },
    { name: 'Sat', queries: 456, successful: 420 },
    { name: 'Sun', queries: 298, successful: 275 }
  ];

  const commonIssues = [
    { name: "Spray Issues", value: 35, color: "#007AFF" },
    { name: "Error Codes", value: 28, color: "#34C759" },
    { name: "Maintenance", value: 20, color: "#FF9500" },
    { name: "Other", value: 17, color: "#86868B" }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'queries', label: 'Queries', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'users', label: 'Users', icon: Users }
  ];

  // Check if user is admin
  if (user?.email !== 'ambriahatcher@gmail.com') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#FF3B30] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-gray-50">Access Denied</h2>
          <p className="text-[#86868B] dark:text-zinc-400 mt-2">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1D1D1F] dark:text-gray-50">
            EquipIQ Admin Dashboard
          </h1>
          <p className="text-[#86868B] dark:text-zinc-400 mt-2">Equipment AI Troubleshooting System</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white dark:bg-zinc-900 rounded-lg shadow p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[#007AFF] text-white' 
                  : 'text-[#86868B] dark:text-zinc-400 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#86868B] dark:text-zinc-400">Total Queries</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] dark:text-gray-50">{stats.totalQueries.toLocaleString()}</p>
                        <p className="text-sm text-[#34C759] mt-1">+12% from last week</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-[#007AFF]" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#86868B] dark:text-zinc-400">Success Rate</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] dark:text-gray-50">{successRate}%</p>
                        <p className="text-sm text-[#34C759] mt-1">Above target!</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-[#34C759]" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#86868B] dark:text-zinc-400">Avg Confidence</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] dark:text-gray-50">{(stats.avgConfidence * 100).toFixed(0)}%</p>
                        <p className="text-sm text-[#86868B] dark:text-zinc-500 mt-1">AI certainty</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-[#FF9500]" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#86868B] dark:text-zinc-400">Knowledge Chunks</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] dark:text-gray-50">{stats.knowledgeChunks.toLocaleString()}</p>
                        <p className="text-sm text-[#007AFF] mt-1">In database</p>
                      </div>
                      <Database className="w-8 h-8 text-[#5856D6]" />
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-gray-50 mb-4">Weekly Query Volume</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                        <XAxis dataKey="name" stroke="#86868B" />
                        <YAxis stroke="#86868B" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="queries" stroke="#007AFF" name="Total Queries" strokeWidth={2} />
                        <Line type="monotone" dataKey="successful" stroke="#34C759" name="Successful" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-gray-50 mb-4">Common Issue Categories</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={commonIssues}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {commonIssues.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Queries Tab */}
            {activeTab === 'queries' && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
                <div className="p-6 border-b border-[#E5E5EA] dark:border-zinc-800">
                  <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-gray-50">Recent Queries</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9F9F9] dark:bg-zinc-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] dark:text-zinc-400 uppercase tracking-wider">Query</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] dark:text-zinc-400 uppercase tracking-wider">Response</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] dark:text-zinc-400 uppercase tracking-wider">Confidence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] dark:text-zinc-400 uppercase tracking-wider">Helpful?</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] dark:text-zinc-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5EA] dark:divide-zinc-800">
                      {recentQueries.map(query => (
                        <tr key={query.id} className="hover:bg-[#F9F9F9] dark:hover:bg-zinc-800">
                          <td className="px-6 py-4 text-sm text-[#1D1D1F] dark:text-gray-50">{query.query}</td>
                          <td className="px-6 py-4 text-sm text-[#86868B] dark:text-zinc-400">{query.response.substring(0, 50)}...</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-[#E5E5EA] dark:bg-zinc-700 rounded-full h-2 mr-2">
                                <div 
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${query.confidence * 100}%`,
                                    backgroundColor: query.confidence > 0.8 ? '#34C759' : query.confidence > 0.6 ? '#FF9500' : '#FF3B30'
                                  }}
                                />
                              </div>
                              <span className="text-sm text-[#86868B] dark:text-zinc-400">{(query.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {query.helpful ? (
                              <CheckCircle className="w-5 h-5 text-[#34C759]" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-[#FF3B30]" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#86868B] dark:text-zinc-400">{query.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Knowledge Base Tab */}
            {activeTab === 'knowledge' && (
              <KnowledgeBaseManager supabase={supabase} />
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-gray-50 mb-4">Active Users</h3>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-[#86868B] dark:text-zinc-500 mx-auto mb-4" />
                  <p className="text-[#86868B] dark:text-zinc-400">User analytics coming soon!</p>
                  <p className="text-sm text-[#86868B] dark:text-zinc-500 mt-2">Track user engagement and satisfaction</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;