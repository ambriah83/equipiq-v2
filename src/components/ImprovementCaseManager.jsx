import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, ThumbsDown, Clock, CheckCircle } from 'lucide-react';

const ImprovementCaseManager = ({ supabase }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [updatingCase, setUpdatingCase] = useState(null);

  useEffect(() => {
    fetchCases();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('improvement_cases_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'improvement_cases' },
        () => {
          fetchCases();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('improvement_cases')
        .select(`
          *,
          feedback (
            rating,
            comment,
            messages (
              content,
              conversations (
                equipment_models (
                  model_name,
                  equipment_manufacturers (name)
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseAction = async (caseId, action) => {
    setUpdatingCase(caseId);
    
    try {
      if (action === 'approve') {
        // First update the case status
        const { error: updateError } = await supabase
          .from('improvement_cases')
          .update({ 
            status: 'approved',
            approved_by: (await supabase.auth.getUser()).data.user.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', caseId);

        if (updateError) throw updateError;

        // Get the case details
        const { data: caseData } = await supabase
          .from('improvement_cases')
          .select('*')
          .eq('id', caseId)
          .single();

        // Create training example from approved case
        if (caseData) {
          const { error: trainingError } = await supabase
            .from('training_examples')
            .insert({
              improvement_case_id: caseId,
              equipment_model_id: caseData.equipment_model_id,
              system_prompt: 'You are EquipIQ, an expert troubleshooting assistant.',
              user_prompt: caseData.original_query,
              assistant_response: caseData.suggested_response
            });

          if (trainingError) console.error('Error creating training example:', trainingError);
        }
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('improvement_cases')
          .update({ status: 'rejected' })
          .eq('id', caseId);

        if (error) throw error;
      } else if (action === 'regenerate') {
        // Call edge function to generate new suggestion
        const { data: caseData } = await supabase
          .from('improvement_cases')
          .select('*')
          .eq('id', caseId)
          .single();

        if (caseData) {
          // This would call your AI to generate a better response
          const newSuggestion = await generateImprovedResponse(caseData.original_query, caseData.original_response);
          
          const { error } = await supabase
            .from('improvement_cases')
            .update({ suggested_response: newSuggestion })
            .eq('id', caseId);

          if (error) throw error;
        }
      }

      await fetchCases();
    } catch (error) {
      console.error('Error updating case:', error);
      alert('Failed to update case');
    } finally {
      setUpdatingCase(null);
    }
  };

  const generateImprovedResponse = async (query, badResponse) => {
    // This would call your edge function to generate a better response
    // For now, returning a placeholder
    return `[AI would generate an improved response for: "${query}"]`;
  };

  const filteredCases = cases.filter(c => {
    if (activeTab === 'pending') return c.status === 'pending';
    if (activeTab === 'approved') return c.status === 'approved';
    if (activeTab === 'rejected') return c.status === 'rejected';
    return true;
  });

  const stats = {
    pending: cases.filter(c => c.status === 'pending').length,
    approved: cases.filter(c => c.status === 'approved').length,
    rejected: cases.filter(c => c.status === 'rejected').length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          Improvement Case Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review AI responses flagged by users and approve improvements for future training
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <X className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
        {['pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && stats.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No {activeTab} cases</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map(caseItem => (
            <div key={caseItem.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
              {/* Case Header */}
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <ThumbsDown className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Rating: {caseItem.feedback?.rating || 'N/A'}/5
                      </span>
                      {caseItem.feedback?.messages?.conversations?.equipment_models && (
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {caseItem.feedback.messages.conversations.equipment_models.equipment_manufacturers.name} - 
                          {caseItem.feedback.messages.conversations.equipment_models.model_name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {caseItem.feedback?.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        User feedback: "{caseItem.feedback.comment}"
                      </p>
                    )}
                  </div>
                  
                  {caseItem.status === 'approved' && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-full">
                      Approved
                    </span>
                  )}
                  {caseItem.status === 'rejected' && (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-full">
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Case Content */}
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Query:</h4>
                  <p className="text-sm bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                    {caseItem.original_query}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Bad Response:</h4>
                    <div className="text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                      {caseItem.original_response}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Suggested Improvement:</h4>
                    <div className="text-sm bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                      {caseItem.suggested_response || <span className="text-gray-400 italic">Generating suggestion...</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Case Actions */}
              {caseItem.status === 'pending' && (
                <div className="p-4 bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleCaseAction(caseItem.id, 'reject')}
                    disabled={updatingCase === caseItem.id}
                    className="px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleCaseAction(caseItem.id, 'regenerate')}
                    disabled={updatingCase === caseItem.id}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => handleCaseAction(caseItem.id, 'approve')}
                    disabled={updatingCase === caseItem.id || !caseItem.suggested_response}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingCase === caseItem.id ? 'Processing...' : 'Approve & Add to Training'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImprovementCaseManager;