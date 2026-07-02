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
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Wizard step state
  const [wizardStep, setWizardStep] = useState(1);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  
  const [allInstructors, setAllInstructors] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [studentEmailInput, setStudentEmailInput] = useState('');
  
  const [uploadedSources, setUploadedSources] = useState([]);
  const [paperOption, setPaperOption] = useState('TEMPLATE'); // TEMPLATE or UPLOAD
  const [selectedTemplate, setSelectedTemplate] = useState('IEEE'); // IEEE, ACM, SPRINGER
  const [uploadedPaperFile, setUploadedPaperFile] = useState(null);
  
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
    api.get('/api/users/instructors').then(res => {
      setAllInstructors(res.data);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      setWizardStep(1);
      setNewTitle('');
      setNewDescription('');
      setUploadedSources([]);
      setPaperOption('TEMPLATE');
      setSelectedTemplate('IEEE');
      setUploadedPaperFile(null);
      setInvitedEmails([]);
      setStudentEmailInput('');
      
      // Fetch instructors
      api.get('/api/users/instructors').then(res => {
        setAllInstructors(res.data);
        if (res.data.length > 0) setSelectedInstructorId(res.data[0].id);
      }).catch(err => console.error(err));
      
      // Fetch students
      api.get('/api/users/students').then(res => {
        setAllStudents(res.data);
      }).catch(err => console.error(err));
    }
  }, [showCreateModal]);

  const handleAddEmail = (email) => {
    const cleanEmail = email.trim();
    if (cleanEmail && !invitedEmails.includes(cleanEmail)) {
      setInvitedEmails([...invitedEmails, cleanEmail]);
    }
    setStudentEmailInput('');
  };

  const handleRemoveEmail = (email) => {
    setInvitedEmails(invitedEmails.filter(e => e !== email));
  };

  const handleCreateProject = async (e) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      // 1. Create project & generate initial LaTeX template papers
      const res = await api.post('/api/projects', {
        title: newTitle.trim(),
        description: newDescription.trim(),
        instructorId: selectedInstructorId,
        memberEmails: invitedEmails,
        template: paperOption === 'TEMPLATE' ? selectedTemplate : 'CUSTOM'
      });
      
      const newProjId = res.data.id;

      // 2. Upload source files
      for (const file of uploadedSources) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', newProjId);
        await api.post('/api/sources/upload', formData);
      }

      // 3. Upload paper if custom upload
      if (paperOption === 'UPLOAD' && uploadedPaperFile) {
        const formData = new FormData();
        formData.append('file', uploadedPaperFile);
        formData.append('projectId', newProjId);
        await api.post('/api/papers/upload', formData);
      }

      setShowCreateModal(false);
      fetchProjects();
      navigate(`/student/projects/${newProjId}`);
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-extrabold text-gray-800">Create New Research Project</h2>
                <p className="text-xs text-gray-500 mt-0.5">Follow the steps to initialize your research workspace.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Indicators */}
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center justify-between relative">
                {/* Background line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 -z-10"></div>
                {/* Active progress line */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 transition-all duration-300 -z-10"
                  style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
                ></div>

                {[
                  { step: 1, label: 'Details' },
                  { step: 2, label: 'Sources' },
                  { step: 3, label: 'Drafts' },
                  { step: 4, label: 'Members' }
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center gap-1.5 bg-white px-2">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        wizardStep >= s.step 
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' 
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {s.step}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide transition-all ${
                      wizardStep >= s.step ? 'text-indigo-600 font-extrabold' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="px-6 py-6 flex-1 overflow-y-auto min-h-[250px]">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Research Project Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Empirical evaluation of LLM-based code test generation..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Short Description</label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Describe objectives, research questions (RQs), and scope of the project..."
                      rows={4}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Upload Reference Source Files (Sources)</label>
                    <div 
                      className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition bg-gray-50/50 group relative"
                      onClick={() => document.getElementById('source-upload-wizard').click()}
                    >
                      <input
                        id="source-upload-wizard"
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => {
                          if (e.target.files) {
                            setUploadedSources([...uploadedSources, ...Array.from(e.target.files)]);
                          }
                        }}
                      />
                      <svg className="w-10 h-10 text-gray-400 group-hover:text-indigo-600 mx-auto mb-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-semibold text-gray-700">Drag & drop files here or click to select</p>
                      <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, TXT. Multi-file upload allowed.</p>
                    </div>
                  </div>

                  {uploadedSources.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Selected Documents ({uploadedSources.length})</span>
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {uploadedSources.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                              <span className="truncate font-medium text-slate-700">{file.name}</span>
                              <span className="text-[10px] text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setUploadedSources(uploadedSources.filter((_, i) => i !== idx))}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Paper Draft Initialization Option</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaperOption('TEMPLATE')}
                        className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                          paperOption === 'TEMPLATE' 
                            ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-bold shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <svg className="w-6 h-6 text-indigo-505" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-xs font-semibold">Create from Template</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaperOption('UPLOAD')}
                        className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                          paperOption === 'UPLOAD' 
                            ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-bold shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <svg className="w-6 h-6 text-indigo-505" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-xs font-semibold">Upload Document (.tex, .pdf, .docx)</span>
                      </button>
                    </div>
                  </div>

                  {paperOption === 'TEMPLATE' ? (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Select a Template (Recommended)</span>
                      <div className="space-y-3">
                        {[
                          { key: 'IEEE', name: 'IEEE Conference Template (IEEEtran)', desc: 'Double-column, 10pt international standard format, suitable for most scientific conferences.' },
                          { key: 'ACM', name: 'ACM Conference Template (acmart sigconf)', desc: 'ACM standard format (sigconf layout) for professional computing articles.' },
                          { key: 'SPRINGER', name: 'Springer LNCS Template (llncs)', desc: 'Standard single-column format for LNCS series (Springer).' }
                        ].map(t => (
                          <div 
                            key={t.key}
                            onClick={() => setSelectedTemplate(t.key)}
                            className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                              selectedTemplate === t.key 
                                ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-100 shadow-sm' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="pt-0.5">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                selectedTemplate === t.key ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                              }`}>
                                {selectedTemplate === t.key && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-800">{t.name}</h4>
                              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{t.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Upload Main Document File (.tex, .pdf, .docx)</span>
                      <div className="border border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition bg-gray-50/50" onClick={() => document.getElementById('paper-upload-wizard').click()}>
                        <input
                          id="paper-upload-wizard"
                          type="file"
                          className="hidden"
                          accept=".tex,.pdf,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setUploadedPaperFile(e.target.files[0]);
                            }
                          }}
                        />
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        <p className="text-xs font-semibold text-gray-700">Choose your document file (.tex, .pdf, .docx)</p>
                      </div>

                      {uploadedPaperFile && (
                        <div className="mt-3 flex items-center justify-between p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-indigo-600 font-bold">📄</span>
                            <span className="truncate font-semibold text-slate-700">{uploadedPaperFile.name}</span>
                            <span className="text-[10px] text-gray-400">({(uploadedPaperFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setUploadedPaperFile(null)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  {/* Instructor Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Instructor <span className="text-red-500">*</span></label>
                    <select
                      value={selectedInstructorId}
                      onChange={(e) => setSelectedInstructorId(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      {allInstructors.map(inst => (
                        <option key={inst.id} value={inst.id}>
                          {inst.firstName} {inst.lastName} ({inst.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Invitations */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invite Team Members (Students)</label>
                    <div className="flex gap-2 mb-3">
                      <select
                        value={studentEmailInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            handleAddEmail(val);
                          }
                        }}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="">-- Select student to invite --</option>
                        {allStudents
                          .filter(s => !invitedEmails.includes(s.email))
                          .map(s => (
                            <option key={s.id} value={s.email}>
                              {s.firstName} {s.lastName} ({s.email})
                            </option>
                          ))}
                      </select>
                    </div>

                    {invitedEmails.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Invited Members ({invitedEmails.length})</span>
                        <div className="flex flex-wrap gap-2">
                          {invitedEmails.map(email => (
                            <div key={email} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">
                              <span>{email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveEmail(email)}
                                className="text-indigo-400 hover:text-indigo-600 transition"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No team members invited yet. You can invite them inside the workspace later.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl">
              <div>
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition shadow-sm"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
                >
                  Cancel
                </button>
                {wizardStep < 4 ? (
                  <button
                    type="button"
                    disabled={wizardStep === 1 && !newTitle.trim()}
                    onClick={() => setWizardStep(wizardStep + 1)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    disabled={creating || !newTitle.trim()}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
                  >
                    {creating ? 'Initializing...' : 'Complete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
