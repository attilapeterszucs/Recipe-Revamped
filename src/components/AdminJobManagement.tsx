import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Briefcase,
  MapPin,
  Clock,
  Building,
  Users,
  FileText,
  CheckCircle,
  BarChart3,
  Loader
} from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './ToastContainer';
import { useAuth } from '../hooks/useAuth';
import {
  getAllJobPostings,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting
} from '../lib/jobPostingService';
import type { JobPosting, JobType, WorkType } from '../types/jobPosting';

interface AdminJobManagementProps {
  adminUserId: string;
  adminEmail: string;
}

export const AdminJobManagement: React.FC<AdminJobManagementProps> = ({
  adminUserId,
  adminEmail
}) => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  // Form state for job editor
  const [jobForm, setJobForm] = useState({
    title: '',
    type: 'Full-time' as JobType,
    location: '',
    workType: 'Remote' as WorkType,
    description: '',
    responsibilities: [] as string[],
    requirements: [] as string[],
    niceToHave: [] as string[],
    isActive: true
  });

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) {
        setJobs([]);
        return;
      }

      const jobsData = await getAllJobPostings();
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
      showError('Failed to load job postings');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleCreateJob = () => {
    setEditingJob(null);
    setJobForm({
      title: '',
      type: 'Full-time',
      location: '',
      workType: 'Remote',
      description: '',
      responsibilities: [],
      requirements: [],
      niceToHave: [],
      isActive: true
    });
    setShowEditor(true);
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      type: job.type,
      location: job.location,
      workType: job.workType,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      niceToHave: job.niceToHave,
      isActive: job.isActive
    });
    setShowEditor(true);
  };

  const handleSaveJob = async () => {
    try {
      setSaving(true);

      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      const jobData = {
        title: jobForm.title,
        type: jobForm.type,
        location: jobForm.location,
        workType: jobForm.workType,
        description: jobForm.description,
        responsibilities: jobForm.responsibilities,
        requirements: jobForm.requirements,
        niceToHave: jobForm.niceToHave,
        postedDate: editingJob?.postedDate || new Date().toISOString(),
        isActive: jobForm.isActive
      };

      if (editingJob && editingJob.id) {
        await updateJobPosting(editingJob.id, jobData);
        showSuccess('Job posting updated successfully!');
      } else {
        await createJobPosting(jobData);
        showSuccess('Job posting created successfully!');
      }

      setShowEditor(false);
      loadJobs();
    } catch (error) {
      console.error('Error saving job:', error);
      showError('Failed to save job posting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = (job: JobPosting) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete || !jobToDelete.id) return;

    setIsDeleting(true);
    try {
      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      await deleteJobPosting(jobToDelete.id);
      showSuccess('Job posting deleted successfully!');
      loadJobs();
      setShowDeleteConfirm(false);
      setJobToDelete(null);
    } catch (error) {
      console.error('Error deleting job:', error);
      showError('Failed to delete job posting');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setJobToDelete(null);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'active' && job.isActive) ||
                         (selectedStatus === 'inactive' && !job.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleArrayInput = (e: React.KeyboardEvent<HTMLInputElement>, field: 'responsibilities' | 'requirements' | 'niceToHave') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputValue = e.currentTarget.value.trim();

      if (inputValue && !jobForm[field].includes(inputValue)) {
        setJobForm(prev => ({ ...prev, [field]: [...prev[field], inputValue] }));
        e.currentTarget.value = '';
      }
    }
  };

  const removeArrayItem = (field: 'responsibilities' | 'requirements' | 'niceToHave', itemToRemove: string) => {
    setJobForm(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== itemToRemove)
    }));
  };

  // Skeleton loader component
  const JobSkeleton = () => (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 sm:p-6 shadow-md animate-pulse">
      <div className="relative">
        <div className="absolute top-0 right-0 flex gap-2">
          <div className="w-9 h-9 bg-gray-300 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-300 rounded-lg"></div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4 pr-20">
          <div className="h-7 w-24 bg-gray-300 rounded-xl"></div>
          <div className="h-7 w-20 bg-gray-300 rounded-xl"></div>
        </div>

        <div className="space-y-3">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl shadow-2xl">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1">Job Management</h1>
                <p className="text-white/90 text-sm font-medium">Create, edit, and manage job postings for the careers page</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Total Jobs</p>
                  <p className="text-3xl font-black text-white">
                    {loading ? '...' : jobs.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Active</p>
                  <p className="text-3xl font-black text-white">
                    {loading ? '...' : jobs.filter(j => j.isActive).length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Inactive</p>
                  <p className="text-3xl font-black text-white">
                    {loading ? '...' : jobs.filter(j => !j.isActive).length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl overflow-visible">
        <div className="p-6 space-y-5">
          {/* Search - Full Width */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Search className="w-5 h-5 text-green-600" />
              Search Jobs
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Filter by Status
              </label>
              <CustomDropdown
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                options={[
                  { value: 'all', label: 'All Status', icon: '📋' },
                  { value: 'active', label: 'Active', icon: '✅' },
                  { value: 'inactive', label: 'Inactive', icon: '❌' }
                ]}
              />
            </div>

            {/* Placeholder for alignment */}
            <div></div>

            {/* Create Button */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Actions
              </label>
              <button
                onClick={handleCreateJob}
                className="w-full inline-flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Job
              </button>
            </div>
          </div>

          {/* Results Badge */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-bold text-gray-900">Search Results:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {filteredJobs.length}
              </span>
              <span className="text-sm text-gray-600 font-medium">
                {filteredJobs.length === 1 ? 'job' : 'jobs'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <JobSkeleton />
            <JobSkeleton />
            <JobSkeleton />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4 shadow-md">
              <Briefcase className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No job postings found</h3>
            <p className="text-sm text-gray-600 font-medium mb-6 max-w-md mx-auto">
              {searchTerm || selectedStatus !== 'all'
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first job posting.'
              }
            </p>
            <button
              onClick={handleCreateJob}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:border-green-300"
              >
                <div className="relative">
                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-0 right-0 flex gap-2">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="w-9 h-9 inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md shadow-blue-500/30 hover:shadow-lg hover:scale-105"
                      title="Edit job"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job)}
                      className="w-9 h-9 inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md shadow-red-500/30 hover:shadow-lg hover:scale-105"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meta Info - Top */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 pr-20">
                    {/* Type */}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm">
                      {job.type}
                    </span>

                    {/* Work Type */}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm">
                      {job.workType}
                    </span>

                    {/* Status */}
                    {job.isActive ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 border-2 border-gray-300">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Job Content */}
                  <div className="space-y-3">
                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-gray-900" title={job.title}>
                      {job.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <MapPin className="w-4 h-4 text-green-500" />
                      {job.location}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 font-medium" title={job.description}>
                      {job.description}
                    </p>

                    {/* Posted Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <Clock className="w-4 h-4" />
                      Posted: {new Date(job.postedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="text-white bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm"
                    placeholder="e.g., Senior Full-Stack Engineer"
                  />
                </div>

                {/* Type and Work Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Job Type *
                    </label>
                    <CustomDropdown
                      value={jobForm.type}
                      onChange={(value) => setJobForm(prev => ({ ...prev, type: value as JobType }))}
                      options={[
                        { value: 'Full-time', label: 'Full-time', icon: '💼' },
                        { value: 'Part-time', label: 'Part-time', icon: '⏱️' },
                        { value: 'Contract', label: 'Contract', icon: '📝' },
                        { value: 'Internship', label: 'Internship', icon: '🎓' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Work Type *
                    </label>
                    <CustomDropdown
                      value={jobForm.workType}
                      onChange={(value) => setJobForm(prev => ({ ...prev, workType: value as WorkType }))}
                      options={[
                        { value: 'Remote', label: 'Remote', icon: '🏠' },
                        { value: 'Hybrid', label: 'Hybrid', icon: '🔄' },
                        { value: 'On-site', label: 'On-site', icon: '🏢' }
                      ]}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Location *
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm"
                    placeholder="e.g., Remote, San Francisco, CA"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Job Description *
                  </label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm resize-none"
                    placeholder="Brief description of the role and what the candidate will be doing..."
                  />
                </div>

                {/* Responsibilities */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Responsibilities
                  </label>
                  <div className="space-y-3">
                    {jobForm.responsibilities.length > 0 && (
                      <div className="space-y-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-xl">
                        {jobForm.responsibilities.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-green-100">
                            <span className="text-sm text-gray-700 flex-1">{item}</span>
                            <button
                              onClick={() => removeArrayItem('responsibilities', item)}
                              className="text-red-600 hover:text-red-800 hover:scale-110 transition-transform flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      onKeyDown={(e) => handleArrayInput(e, 'responsibilities')}
                      placeholder="Type a responsibility and press Enter..."
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Requirements *
                  </label>
                  <div className="space-y-3">
                    {jobForm.requirements.length > 0 && (
                      <div className="space-y-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-xl">
                        {jobForm.requirements.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-green-100">
                            <span className="text-sm text-gray-700 flex-1">{item}</span>
                            <button
                              onClick={() => removeArrayItem('requirements', item)}
                              className="text-red-600 hover:text-red-800 hover:scale-110 transition-transform flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      onKeyDown={(e) => handleArrayInput(e, 'requirements')}
                      placeholder="Type a requirement and press Enter..."
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm"
                    />
                  </div>
                </div>

                {/* Nice to Have */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Nice to Have
                  </label>
                  <div className="space-y-3">
                    {jobForm.niceToHave.length > 0 && (
                      <div className="space-y-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl">
                        {jobForm.niceToHave.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-blue-100">
                            <span className="text-sm text-gray-700 flex-1">{item}</span>
                            <button
                              onClick={() => removeArrayItem('niceToHave', item)}
                              className="text-red-600 hover:text-red-800 hover:scale-110 transition-transform flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      onKeyDown={(e) => handleArrayInput(e, 'niceToHave')}
                      placeholder="Type a nice-to-have skill and press Enter..."
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium bg-white shadow-sm"
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50/50 border-2 border-yellow-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={jobForm.isActive}
                      onChange={(e) => setJobForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-5 w-5 text-green-600 focus:ring-2 focus:ring-green-500 border-2 border-gray-300 rounded cursor-pointer transition-all duration-200"
                    />
                    <label htmlFor="isActive" className="ml-3 block text-sm text-gray-900 font-bold cursor-pointer">
                      ✅ Active (visible on careers page)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-green-50/30">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-bold shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveJob}
                  disabled={saving || !jobForm.title || !jobForm.location || !jobForm.description || jobForm.requirements.length === 0}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && jobToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 rounded-t-3xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="flex items-center justify-center relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="text-white bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Delete Job Posting
                  </h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4 font-medium text-base">
                  Are you sure you want to delete this job posting? This action cannot be undone.
                </p>
                <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border-2 border-red-200 rounded-2xl p-4 mb-6 shadow-lg">
                  <p className="text-sm font-black text-gray-900 truncate mb-2">
                    "{jobToDelete.title}"
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm">
                      {jobToDelete.type}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm">
                      {jobToDelete.workType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                >
                  {isDeleting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Job
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
