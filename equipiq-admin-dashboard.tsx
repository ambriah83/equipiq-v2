import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, Upload, Search, TrendingUp, Users, MessageSquare, Database, Trash2, Edit, Eye, FileText, X, ChevronRight, Filter, Image, Video, Link, File, Sun, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
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
  const [commonIssues, setCommonIssues] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [googleLink, setGoogleLink] = useState('');
  
  // Knowledge Base States
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Mock data - replace with actual Supabase calls
  useEffect(() => {
    // Simulate fetching data
    setStats({
      totalQueries: 2847,
      successfulResponses: 2623,
      failedQueries: 224,
      avgConfidence: 0.91,
      activeUsers: 186,
      knowledgeChunks: 3456
    });

    setRecentQueries([
      { id: 1, query: "VersaSpa Pro not spraying evenly", response: "Check spray nozzle alignment and solution levels...", confidence: 0.95, helpful: true, timestamp: "2 mins ago", source: "VersaSpa Pro Manual - Troubleshooting" },
      { id: 2, query: "Red light therapy bed not warming up", response: "Verify power settings and check bulb functionality...", confidence: 0.88, helpful: true, timestamp: "5 mins ago", source: "Skin Wellness Guide" },
      { id: 3, query: "Norvell booth making strange noise", response: "Inspect turbine motor and check for obstructions...", confidence: 0.82, helpful: false, timestamp: "12 mins ago", source: "Norvell Maintenance Manual" },
      { id: 4, query: "UV bed timer not working", response: "Reset control panel and check timer settings...", confidence: 0.94, helpful: true, timestamp: "18 mins ago", source: "Prestige 1400 User Guide" }
    ]);

    setCommonIssues([
      { name: "Spray Issues", value: 35, color: "#FF6B6B" },
      { name: "UV/Red Light", value: 28, color: "#4ECDC4" },
      { name: "Timer/Controls", value: 20, color: "#45B7D1" },
      { name: "Maintenance", value: 17, color: "#F9A826" }
    ]);

    // Tanning salon equipment types
    setEquipmentTypes([
      { id: 1, name: "Skin Wellness", icon: "✨", itemCount: 145, lastUpdated: "2 days ago" },
      { id: 2, name: "VersaSpa Pro", icon: "💦", itemCount: 89, lastUpdated: "1 week ago" },
      { id: 3, name: "Norvell Auto Revolution", icon: "🌟", itemCount: 67, lastUpdated: "3 days ago" },
      { id: 4, name: "Prestige 1400", icon: "☀️", itemCount: 124, lastUpdated: "Today" },
      { id: 5, name: "Vitality TLT", icon: "💡", itemCount: 56, lastUpdated: "5 days ago" },
      { id: 6, name: "Sun Angel", icon: "😇", itemCount: 78, lastUpdated: "1 day ago" },
      { id: 7, name: "General Maintenance", icon: "🔧", itemCount: 234, lastUpdated: "Today" },
      { id: 8, name: "Client FAQs", icon: "❓", itemCount: 189, lastUpdated: "2 hours ago" }
    ]);
  }, []);

  // Load knowledge items when equipment is selected
  useEffect(() => {
    if (selectedEquipment) {
      // Mock loading knowledge items for tanning equipment
      const mockItems = {
        "VersaSpa Pro": [
          { 
            id: 1, 
            title: "Uneven Spray Coverage", 
            content: "1. Check all spray nozzles for clogs\n2. Verify solution pressure is between 40-60 PSI\n3. Clean nozzles with provided cleaning solution\n4. Run diagnostic spray test",
            tags: ["spray", "nozzles", "coverage"],
            lastModified: "2024-03-15",
            usageCount: 89,
            attachments: [
              { type: "image", name: "nozzle-diagram.png", url: "#" },
              { type: "video", name: "cleaning-procedure.mp4", url: "#" }
            ]
          },
          { 
            id: 2, 
            title: "Solution Not Flowing", 
            content: "Check solution reservoir levels. Ensure pump is primed. Verify no air bubbles in lines. Replace filter if clogged.",
            tags: ["solution", "pump", "flow"],
            lastModified: "2024-03-10",
            usageCount: 67,
            attachments: [
              { type: "pdf", name: "pump-manual.pdf", url: "#" }
            ]
          }
        ],
        "Skin Wellness": [
          { 
            id: 3, 
            title: "Red Light Not Activating", 
            content: "1. Check power connections\n2. Verify control panel settings\n3. Test individual bulb panels\n4. Reset system breaker if needed",
            tags: ["red-light", "power", "activation"],
            lastModified: "2024-03-18",
            usageCount: 45,
            attachments: [
              { type: "google-doc", name: "Troubleshooting Guide", url: "https://docs.google.com/..." }
            ]
          }
        ]
      };
      
      setKnowledgeItems(mockItems[selectedEquipment.name] || [
        { 
          id: 1, 
          title: "General Maintenance Schedule", 
          content: "Daily: Clean surfaces, check solution levels\nWeekly: Deep clean, test all functions\nMonthly: Replace filters, calibrate systems",
          tags: ["maintenance", "schedule", "cleaning"],
          lastModified: "2024-03-20",
          usageCount: 156,
          attachments: []
        }
      ]);
    }
  }, [selectedEquipment]);

  const successRate = stats.totalQueries > 0 ? (stats.successfulResponses / stats.totalQueries * 100).toFixed(1) : 0;

  const chartData = [
    { name: 'Mon', queries: 345, successful: 320 },
    { name: 'Tue', queries: 412, successful: 385 },
    { name: 'Wed', queries: 378, successful: 350 },
    { name: 'Thu', queries: 489, successful: 450 },
    { name: 'Fri', queries: 523, successful: 480 },
    { name: 'Sat', queries: 656, successful: 620 },
    { name: 'Sun', queries: 298, successful: 275 }
  ];

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...files]);
    }
  };

  const handleGoogleLinkAdd = () => {
    if (googleLink) {
      const linkFile = {
        name: `Google Doc/Sheet/Slides`,
        type: 'google-link',
        url: googleLink,
        size: 0
      };
      setUploadFiles(prev => [...prev, linkFile]);
      setGoogleLink('');
    }
  };

  const removeFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setUploading(true);
    // Simulate upload - replace with actual Supabase function calls
    setTimeout(() => {
      setUploading(false);
      setUploadFiles([]);
      alert(`Successfully uploaded ${uploadFiles.length} files! 🎉`);
    }, 2000);
  };

  const getFileIcon = (file) => {
    if (file.type === 'google-link') return <Link className="w-5 h-5" />;
    if (file.type?.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type?.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const handleDeleteItem = (itemId) => {
    if (confirm('Are you sure you want to delete this knowledge item?')) {
      setKnowledgeItems(prev => prev.filter(item => item.id !== itemId));
      // Call Supabase delete here
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setKnowledgeItems(prev => prev.map(item => 
      item.id === editingItem.id ? editingItem : item
    ));
    setShowEditModal(false);
    setEditingItem(null);
  };

  const filteredKnowledgeItems = knowledgeItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'queries', label: 'Queries', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'users', label: 'Users', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            EquipIQ Admin Dashboard <Sun className="w-8 h-8 text-yellow-500" /> <Sparkles className="w-6 h-6 text-purple-500" />
          </h1>
          <p className="text-gray-600 mt-2">Tanning Equipment AI Troubleshooting System</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg shadow p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Queries</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalQueries.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">+12% from last week</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
                    <p className="text-sm text-green-600 mt-1">Above target!</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Confidence</p>
                    <p className="text-2xl font-bold text-gray-900">{(stats.avgConfidence * 100).toFixed(0)}%</p>
                    <p className="text-sm text-gray-600 mt-1">AI certainty</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-pink-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Knowledge Chunks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.knowledgeChunks.toLocaleString()}</p>
                    <p className="text-sm text-blue-600 mt-1">In database</p>
                  </div>
                  <Database className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Weekly Query Volume</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="queries" stroke="#8B5CF6" name="Total Queries" />
                    <Line type="monotone" dataKey="successful" stroke="#EC4899" name="Successful" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Common Issue Categories</h3>
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
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Recent Queries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Preview</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Helpful?</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentQueries.map(query => (
                    <tr key={query.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{query.query}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{query.response.substring(0, 50)}...</td>
                      <td className="px-6 py-4 text-sm text-purple-600 hover:text-purple-800 cursor-pointer">{query.source}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="h-2 rounded-full"
                              style={{
                                width: `${query.confidence * 100}%`,
                                backgroundColor: query.confidence > 0.8 ? '#10B981' : query.confidence > 0.6 ? '#F59E0B' : '#EF4444'
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{(query.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {query.helpful ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{query.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            {!selectedEquipment ? (
              <>
                {/* Equipment Grid */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Equipment Types</h3>
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Add Equipment</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equipmentTypes.map(equipment => (
                      <div
                        key={equipment.id}
                        onClick={() => setSelectedEquipment(equipment)}
                        className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-4xl">{equipment.icon}</span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                        <h4 className="font-semibold text-lg mb-2">{equipment.name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{equipment.itemCount} knowledge items</p>
                          <p>Updated {equipment.lastUpdated}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Upload Knowledge Base</h3>
                  
                  {/* Drag and Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      multiple
                      accept=".png,.jpg,.jpeg,.mp4,.mov,.pdf,.doc,.docx,.txt,.csv"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Choose files
                    </label>
                    <span className="text-gray-600"> or drag and drop</span>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPEG, MP4, PDF, Word docs, and more • Multiple files supported
                    </p>
                  </div>

                  {/* Google Link Input */}
                  <div className="mt-4 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Paste Google Docs/Sheets/Slides link..."
                      value={googleLink}
                      onChange={(e) => setGoogleLink(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={handleGoogleLinkAdd}
                      disabled={!googleLink}
                      className={`px-4 py-2 rounded-md ${
                        googleLink 
                          ? 'bg-purple-500 text-white hover:bg-purple-600' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Add Link
                    </button>
                  </div>

                  {/* File List */}
                  {uploadFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Files to upload ({uploadFiles.length})</h4>
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="text-purple-500">{getFileIcon(file)}</span>
                            <span className="text-sm">{file.name || file.url}</span>
                            {file.size > 0 && (
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={handleBulkUpload}
                        disabled={uploading}
                        className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors ${
                          !uploading
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File${uploadFiles.length > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Equipment Detail View */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setSelectedEquipment(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          ← Back
                        </button>
                        <h3 className="text-xl font-semibold flex items-center space-x-2">
                          <span>{selectedEquipment.icon}</span>
                          <span>{selectedEquipment.name}</span>
                        </h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search knowledge..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors">
                          Add Knowledge
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {filteredKnowledgeItems.map(item => (
                        <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                              <p className="text-gray-600 mb-3 whitespace-pre-line">{item.content}</p>
                              
                              {/* Attachments */}
                              {item.attachments && item.attachments.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Attachments:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.attachments.map((attachment, idx) => (
                                      <span key={idx} className="inline-flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded">
                                        {attachment.type === 'image' && <Image className="w-3 h-3" />}
                                        {attachment.type === 'video' && <Video className="w-3 h-3" />}
                                        {attachment.type === 'pdf' && <FileText className="w-3 h-3" />}
                                        {attachment.type === 'google-doc' && <Link className="w-3 h-3" />}
                                        <span>{attachment.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <Filter className="w-4 h-4" />
                                  <span>Tags: {item.tags.join(', ')}</span>
                                </div>
                                <span>Used {item.usageCount} times</span>
                                <span>Modified {item.lastModified}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="text-purple-600 hover:text-purple-800 p-2"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-green-600 hover:text-green-800 p-2"
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-800 p-2"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Active Users</h3>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">User analytics coming soon!</p>
              <p className="text-sm text-gray-500 mt-2">Track salon staff engagement and satisfaction</p>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit Knowledge Item</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({...editingItem, content: e.target.value})}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 h-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingItem.tags.join(', ')}
                    onChange={(e) => setEditingItem({...editingItem, tags: e.target.value.split(',').map(t => t.trim())})}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Knowledge Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{selectedItem.title}</h4>
                  <p className="text-gray-600 mt-2 whitespace-pre-line">{selectedItem.content}</p>
                </div>
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Metadata</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tags:</span> {selectedItem.tags.join(', ')}
                    </div>
                    <div>
                      <span className="text-gray-600">Usage Count:</span> {selectedItem.usageCount} times
                    </div>
                    <div>
                      <span className="text-gray-600">Last Modified:</span> {selectedItem.lastModified}
                    </div>
                    <div>
                      <span className="text-gray-600">ID:</span> {selectedItem.id}
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Related Queries</h5>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      • "VersaSpa not spraying evenly" - 95% confidence
                    </div>
                    <div className="text-sm text-gray-600">
                      • "Spray booth maintenance schedule" - 88% confidence
                    </div>
                    <div className="text-sm text-gray-600">
                      • "How to clean spray nozzles" - 82% confidence
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;