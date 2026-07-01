import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // --- 1. STATES MANAGEMENT ---
  const [projects, setProjects] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPapers, setProjectPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  
  const [activePaperSections, setActivePaperSections] = useState([]);
  const [aiReviewResult, setAiReviewResult] = useState(null);
  const [inspectingPaperId, setInspectingPaperId] = useState(null);

  // --- 2. API CALLS ---
  const fetchInstructorProjects = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      // BƯỚC 1: Lấy thông tin giảng viên hiện tại đang đăng nhập để có ID
      const userRes = await api.get('/api/users/me');
      const currentInstructorId = Number(userRes.data?.id);

      // BƯỚC 2: Gọi API lấy dữ liệu thô (hoặc lấy từ local mock db tương ứng cấu trúc file Admin)
      let url = `/api/projects?page=${page}&size=8&sort=createdAt,desc`;
      if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const response = await api.get(url);
      const data = response.data;
      
      let rawProjects = [];
      if (Array.isArray(data)) {
        rawProjects = data;
      } else {
        rawProjects = data.content || [];
      }

      // BƯỚC 3: Thực hiện bộ lọc (Chỉ lấy dự án mà instructorIds có chứa ID giảng viên hoặc trùng với instructorId)
      const filteredProjects = rawProjects.filter(project => {
        if (project.instructorIds && Array.isArray(project.instructorIds)) {
          return project.instructorIds.map(id => Number(id)).includes(currentInstructorId);
        }
        if (project.instructorId) {
          return Number(project.instructorId) === currentInstructorId;
        }
        return false; // Không được gán cho ai thì ẩn đi
      });

      setProjects(filteredProjects);
      setTotalElements(filteredProjects.length);

    } catch (error) {
      console.error("Error loading workspace monitor:", error);
      setErrorMessage("Could not synchronize dynamic student projects cluster state.");
    } finally {
      setLoading(false);
    }
  };

  const handleInspectProject = async (project) => {
    setSelectedProject(project);
    setProjectPapers([]);
    setActivePaperSections([]);
    setAiReviewResult(null);
    setInspectingPaperId(null);
    setLoadingPapers(true);

    try {
      const response = await api.get(`/api/papers/by-project/${project.id}`);
      setProjectPapers(response.data || []);
    } catch (error) {
      console.error("Error loading paper details:", error);
      setErrorMessage("Failed to trace structural documents linked to this node.");
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleInspectPaperDetails = async (paperId) => {
    setInspectingPaperId(paperId);
    setActivePaperSections([]);
    setAiReviewResult(null);
    
    try {
      const sectionsRes = await api.get(`/api/papers/${paperId}/sections`);
      setActivePaperSections(sectionsRes.data || []);

      const reviewRes = await api.get(`/api/papers/${paperId}/reviews`);
      setAiReviewResult(reviewRes.data);
    } catch (error) {
      console.error("Failed to compile paper diagnostics:", error);
    }
  };

  useEffect(() => {
    fetchInstructorProjects();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchInstructorProjects();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
      
      {/* HEADER ĐỒNG BỘ Y CHANG ADMIN */}
      <header className="bg-[#1e3a8a] text-white border-b border-[#152e75] sticky top-0 z-10 shadow-sm">
        <div className="w-full px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 cursor-pointer hover:text-blue-100 transition-colors"
            title="Go to Home"
          >
            <span className="font-bold text-xl tracking-wider">Evidence Pilot</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-blue-50 tracking-wide uppercase">Instructor Mode</span>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-blue-200 hover:text-white transition"
            >
              Home
            </button>

            <Link to="/instructor/profile" className="text-sm font-medium text-blue-200 hover:text-white transition">
              Instructor Profile
            </Link>
            
            <button 
              onClick={() => { logout(); navigate('/'); }}
              className="text-sm font-medium text-blue-200 hover:text-white transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto p-8">
        {/* Workspace Title */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight">Instructor Control Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time control node over active student research tracks, paper integrity telemetry, and AI compliance pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs">
          {/* Ô 1: REVIEW REQUESTS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-[#1e3a8a] flex items-center gap-1.5">📋 Review Requests</h3>
              <p className="text-gray-400 font-medium leading-relaxed">Evaluate data verification claims submitted by students, audit uploaded files, and provide feedback.</p>
            </div>
            <div className="pt-2">
              <Link to="/instructor/requests" className="text-blue-600 font-bold hover:underline">Review Submissions →</Link>
            </div>
          </div>

          {/* Ô 2: MANAGE COLLECTIONS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-[#1e3a8a] flex items-center gap-1.5">📚 Manage Collections</h3>
              <p className="text-gray-400 font-medium leading-relaxed">Upload raw reference documents, create semantic knowledge baselines, and organize materials.</p>
            </div>
            <div className="pt-2">
              <Link to="/instructor/collections" className="text-blue-600 font-bold hover:underline">Manage Collections →</Link>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Search and Filters Architecture Control */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-1/2 flex gap-2">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by project title or student details..." 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
            <button type="submit" className="px-4 py-2 bg-[#1e3a8a] text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition">
              Search
            </button>
          </form>

          <div className="flex gap-2 w-full md:w-auto justify-end text-xs items-center">
            <span className="text-gray-400 font-bold uppercase tracking-wide text-[10px]">Pipeline State:</span>
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-700 focus:outline-none"
            >
              <option value="">ALL PROJECTS</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        {/* Layout Grid: Left List / Right Live Inspector Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: Paged Student Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Assigned Repositories ({totalElements})</span>
              </div>
              
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="p-8 text-center text-gray-400 text-xs font-semibold animate-pulse">Fetching telemetry stream...</div>
                ) : projects.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs font-semibold">No assigned category structures found for your account.</div>
                ) : (
                  projects.map((project) => (
                    <div 
                      key={project.id} 
                      onClick={() => handleInspectProject(project)}
                      className={`p-4 transition cursor-pointer flex justify-between items-center ${
                        selectedProject?.id === project.id ? 'bg-blue-50/50 border-l-4 border-[#1e3a8a]' : 'hover:bg-gray-50/40'
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <h3 className="font-bold text-gray-900 text-sm tracking-tight">{project.title || project.name}</h3>
                        <p className="text-[11px] text-gray-400 font-mono truncate max-w-md">UUID: {project.id}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${
                          project.status === 'IN_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-[#1e3a8a] border-blue-200'
                        }`}>
                          {project.status}
                        </span>
                        <span className="text-xs text-gray-400">➔</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center text-xs px-2">
              <button 
                disabled={page === 0} 
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg disabled:opacity-40 font-bold"
              >
                Previous
              </button>
              <span className="text-gray-400 font-mono">Page Context Matrix Index: {page + 1}</span>
              <button
                disabled={(page + 1) * 8 >= totalElements} 
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg disabled:opacity-40 font-bold"
              >
                Next
              </button>
            </div>
          </div>

          {/* RIGHT: Document Deep Structural Inspector Panel */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6 min-h-[450px]">
            {!selectedProject ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 my-auto">
                <span className="text-3xl block mb-2">🔬</span>
                <p className="text-xs font-semibold">Select an assigned workspace repository timeline on the left map layout to trigger deep paper inspection.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3">
                  <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase">Live Inspect Node</span>
                  <h2 className="text-sm font-black text-gray-900 mt-2 tracking-tight line-clamp-2">{selectedProject.title || selectedProject.name}</h2>
                </div>

                {/* Section List of Associated Documents */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Submitted Manuscripts</h4>
                  {loadingPapers ? (
                    <p className="text-xs text-gray-400 italic">Interrogating paper records...</p>
                  ) : projectPapers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No paper documents uploaded to this workspace yet.</p>
                  ) : (
                    projectPapers.map(paper => (
                      <div 
                        key={paper.id}
                        onClick={() => handleInspectPaperDetails(paper.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                          inspectingPaperId === paper.id ? 'border-[#1e3a8a] bg-blue-50/20' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-gray-800 truncate pr-2">📄 {paper.originalFilename || paper.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">Size: {((paper.size || 0) / 1024).toFixed(1)} KB</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Sub Display Render: Sections & AI Verification Result */}
                {inspectingPaperId && (
                  <div className="border-t border-gray-100 pt-4 space-y-4 animate-fadeIn">
                    
                    {/* Render Paper Structural Tree */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Detected Sections Tree</h5>
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 max-h-36 overflow-y-auto space-y-1 text-[11px] font-medium text-gray-700">
                        {activePaperSections.length === 0 ? (
                          <p className="text-gray-400 italic">No segment blocks registered.</p>
                        ) : (
                          activePaperSections.map((sec, idx) => (
                            <div key={sec.id} className="truncate border-b border-gray-100 pb-1 last:border-0">
                              <span className="text-[#1e3a8a] font-mono font-bold mr-1">#{idx + 1}</span> {sec.sectionTitle}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* AI Machine Recommendations Block */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">AI Guardrails Core Diagnostics</h5>
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] space-y-2 max-h-48 overflow-y-auto shadow-inner">
                        {aiReviewResult ? (
                          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed">
                            {JSON.stringify(aiReviewResult, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-slate-400 italic">Compiling real-time audit suggestions model from mock engine...</p>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}