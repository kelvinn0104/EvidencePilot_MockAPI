import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api.js';

export default function Projects() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { language } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allInstructors, setAllInstructors] = useState([]);

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
    api.get('/api/users/instructors').then(res => {
      setAllInstructors(res.data);
    }).catch(err => console.error(err));
  }, []);



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
            <p className="text-sm text-gray-500 mb-6">You have not been added to any projects yet.</p>
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
                {project.instructorId && (() => {
                  const inst = allInstructors.find(i => Number(i.id) === Number(project.instructorId));
                  const instName = inst ? `${inst.firstName} ${inst.lastName}` : 'Not assigned';
                  const labelPrefix = 'Instructor';
                  return (
                    <div className="flex items-center justify-between mb-4 text-xs bg-slate-50/50 hover:bg-slate-50 transition border border-slate-100 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#1e3a8a]/10 text-[#1e3a8a] text-[10px] font-bold flex items-center justify-center">
                          {instName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">{labelPrefix}</span>
                          <span className="text-slate-700 font-bold leading-tight">
                            {instName}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                        project.instructorStatus === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        project.instructorStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-250'
                      }`}>
                        {project.instructorStatus === 'ACCEPTED' ? 'Accepted' :
                         project.instructorStatus === 'REJECTED' ? 'Refused' : 'Pending'}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span>Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                    {project.ownerId === user?.id && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(language === 'vi' ? `Bạn có chắc chắn muốn xóa dự án "${project.title}"?` : `Are you sure you want to delete project "${project.title}"?`)) {
                            try {
                              await api.delete(`/api/projects/${project.id}`);
                              fetchProjects();
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title={language === 'vi' ? 'Xóa dự án' : 'Delete Project'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                  <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                    {language === 'vi' ? 'Mở' : 'Open'} &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
