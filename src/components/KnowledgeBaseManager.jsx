import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Search, Plus, ChevronRight, X } from 'lucide-react';

const KnowledgeBaseManager = ({ supabase }) => {
  const [equipment, setEquipment] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch equipment models
  useEffect(() => {
    fetchEquipment();
  }, []);

  // Fetch documents when model selected
  useEffect(() => {
    if (selectedModel) {
      fetchDocuments();
    }
  }, [selectedModel]);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_models')
        .select(`
          *,
          equipment_manufacturers (name)
        `)
        .order('category', { ascending: true });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('equipment_model_id', selectedModel.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, documentType) => {
    if (!selectedModel) return;

    setLoading(true);
    try {
      // Read file content
      const text = await file.text();
      
      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          equipment_model_id: selectedModel.id,
          title: file.name,
          content: text,
          document_type: documentType,
          metadata: {
            file_size: file.size,
            file_type: file.type
          }
        })
        .select()
        .single();

      if (docError) throw docError;

      // Generate embedding via edge function
      const { error: embedError } = await supabase.functions.invoke('generate-embedding', {
        body: { text: text.substring(0, 8000), documentId: doc.id } // Limit text for embedding
      });

      if (embedError) throw embedError;

      // Refresh documents
      await fetchDocuments();
      setUploadModalOpen(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const groupedEquipment = equipment.reduce((acc, model) => {
    if (!acc[model.category]) acc[model.category] = [];
    acc[model.category].push(model);
    return acc;
  }, {});

  const categoryLabels = {
    spray_booth: 'Spray Booths',
    hydration_station: 'Hydration Stations',
    uv_bed: 'UV Beds'
  };

  return (
    <div className="flex h-full">
      {/* Equipment List Sidebar */}
      <div className="w-80 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Equipment Models</h3>
        </div>
        
        {Object.entries(groupedEquipment).map(([category, models]) => (
          <div key={category} className="border-b border-gray-200 dark:border-zinc-800">
            <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {categoryLabels[category] || category}
              </p>
            </div>
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${
                  selectedModel?.id === model.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {model.model_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {model.equipment_manufacturers.name}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Document Management Area */}
      <div className="flex-1 bg-gray-50 dark:bg-zinc-950">
        {selectedModel ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                    {selectedModel.model_name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedModel.equipment_manufacturers.name} • {documents.length} documents
                  </p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-50"
                />
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Upload manuals, FAQs, and troubleshooting guides
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {documents
                    .filter(doc => !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(doc => (
                      <div key={doc.id} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                              {doc.title}
                            </h4>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded">
                                {doc.document_type}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {doc.content.length.toLocaleString()} characters
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Select an equipment model to manage documents</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Upload Document
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <UploadForm
              onUpload={handleFileUpload}
              onCancel={() => setUploadModalOpen(false)}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const UploadForm = ({ onUpload, onCancel, loading }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('manual');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload(file, documentType);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-50"
          >
            <option value="manual">Manual</option>
            <option value="troubleshooting">Troubleshooting Guide</option>
            <option value="faq">FAQ</option>
            <option value="maintenance">Maintenance Schedule</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File
          </label>
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx,.md"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!file || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
};

export default KnowledgeBaseManager;