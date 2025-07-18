import React, { useState, useEffect } from 'react';
import { Brain, Play, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const FineTuningManager = ({ supabase }) => {
  const [jobs, setJobs] = useState([]);
  const [approvedCases, setApprovedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    // Check status every 30 seconds
    const interval = setInterval(checkJobStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch fine-tuning jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('fine_tuning_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Fetch approved improvement cases count
      const { count, error: countError } = await supabase
        .from('improvement_cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      if (countError) throw countError;
      setApprovedCases(count || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startFineTuning = async () => {
    if (approvedCases < 10) {
      alert('Need at least 10 approved improvement cases to start fine-tuning');
      return;
    }

    setProcessing(true);
    try {
      // Create a new fine-tuning job record
      const { data: newJob, error: jobError } = await supabase
        .from('fine_tuning_jobs')
        .insert({
          name: `Fine-tuning ${new Date().toLocaleDateString()}`,
          base_model: 'gpt-3.5-turbo',
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Trigger the fine-tuning processor
      const { error: processError } = await supabase.functions.invoke('process-fine-tuning-jobs', {
        body: { job_id: newJob.id }
      });

      if (processError) throw processError;

      // Refresh the jobs list
      await fetchData();
      alert('Fine-tuning job started successfully!');
    } catch (error) {
      console.error('Error starting fine-tuning:', error);
      alert('Failed to start fine-tuning: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const checkJobStatuses = async () => {
    const runningJobs = jobs.filter(job => job.status === 'running');
    if (runningJobs.length === 0) return;

    try {
      const { error } = await supabase.functions.invoke('check-fine-tuning-status');
      if (!error) {
        await fetchData(); // Refresh if status was updated
      }
    } catch (error) {
      console.error('Error checking job statuses:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
      case 'preparing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'running':
      case 'preparing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          Fine-tuning Manager
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Train custom AI models based on user feedback
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved Cases</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{approvedCases}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {approvedCases < 10 ? `Need ${10 - approvedCases} more` : 'Ready to train'}
              </p>
            </div>
            <AlertCircle className={`w-8 h-8 ${approvedCases >= 10 ? 'text-green-500' : 'text-orange-500'}`} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{jobs.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {jobs.filter(j => j.status === 'completed').length} completed
              </p>
            </div>
            <Brain className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {jobs.filter(j => ['running', 'preparing'].includes(j.status)).length}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Currently processing
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={startFineTuning}
          disabled={processing || approvedCases < 10}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-5 h-5" />
          {processing ? 'Starting...' : 'Start New Fine-tuning Job'}
        </button>
        {approvedCases < 10 && (
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
            ⚠️ You need at least 10 approved improvement cases to start fine-tuning
          </p>
        )}
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Fine-tuning Jobs
          </h3>
        </div>
        
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No fine-tuning jobs yet. Start your first one above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Job Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Examples
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {job.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {job.base_model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      {job.error_message && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {job.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {job.training_examples_count || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {job.started_at ? new Date(job.started_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {job.started_at && job.completed_at ? (
                        `${Math.round((new Date(job.completed_at) - new Date(job.started_at)) / 60000)} min`
                      ) : job.started_at ? (
                        'Running...'
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              How Fine-tuning Works
            </h4>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Collect user feedback and improvement cases</li>
              <li>Approve cases that should be used for training</li>
              <li>Start a fine-tuning job when you have enough examples</li>
              <li>The AI learns from the approved examples</li>
              <li>New model is evaluated and can be activated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FineTuningManager;