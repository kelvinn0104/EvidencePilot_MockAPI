import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function Projects() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/api/projects', {
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      navigate(`/student/projects/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      alert(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-600',
      ACTIVE: 'bg-blue-100 text-blue-700',
      IN_REVIEW: 'bg-amber-100 text-amber-700',
      COMPLETED: 'bg-green-100 text-green-700',
      ARCHIVED: 'bg-slate-100 text-slate-500',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-[#1e3a8a] text-white px-8 h-16 flex items-center justify-between shadow-sm">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Back to Home"
        >
          <div className="w-8 h-8 bg-indigo-500 text-white rounded-md text-xs flex items-center justify-center font-bold group-hover:bg-indigo-600 transition-colors">EP</div>
          <span className="font-bold text-lg tracking-wider group-hover:text-blue-100 transition-colors">Evidence Pilot</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-blue-200 hover:text-white transition"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="text-sm font-medium text-blue-200 hover:text-white transition"
          >
            Profile
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-sm font-medium text-blue-200 hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Your Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your research projects and track claims.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#1e3a8a] text-white rounded-lg font-semibold hover:bg-[#152e75] transition shadow-sm flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-500 font-medium">Loading projects...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchProjects} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition">Retry</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Projects Yet</h3>
            <p className="text-sm text-gray-500 mb-6">Create your first project to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-lg font-semibold hover:bg-[#152e75] transition"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/student/projects/${project.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">
                    {project.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ml-2 ${statusBadge(project.status)}`}>
                    {project.status || 'DRAFT'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span>Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                  <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                    Open &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">Create New Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter project title..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#1e3a8a] rounded-lg hover:bg-[#152e75] transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
