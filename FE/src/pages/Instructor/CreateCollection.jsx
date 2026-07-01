import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api.js';

export default function CreateCollection() {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(""); 
  // Quản lý mảng lưu danh sách nhiều file được chọn
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [projects, setProjects] = useState([]);
  const [papers, setPapers] = useState([]);
  const [paperId, setPaperId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPapers = async () => {
      if (!projectId) return;
      try {
        const res = await api.get(`/api/papers/by-project/${projectId}`);
        const paperList = res.data || [];
        setPapers(paperList);
        if (paperList.length > 0) {
          setPaperId(paperList[0].id);
        } else {
          setPaperId("");
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách bản thảo:", err);
      }
    };
    fetchPapers();
  }, [projectId]);

  useEffect(() => {
    const fetchActiveProjects = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/projects');
        const projectList = Array.isArray(response.data) ? response.data : response.data.content || [];
        setProjects(projectList);
        if (projectList.length > 0) {
          setProjectId(projectList[0].id);
        }
      } catch (error) {
        console.error("Error loading project mapping:", error);
        setErrorMessage("Failed to load project reference keys.");
      } finally {
        setLoading(false);
      }
    };
    fetchActiveProjects();
  }, []);

  // Xử lý cộng dồn file khi bấm chọn nhiều lần, tránh bị file sau ghi đè file trước
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      setAttachedFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        newFiles.forEach(file => {
          // Kiểm tra trùng lặp tên và dung lượng file để tránh add 1 file nhiều lần
          if (!updatedFiles.some(f => f.name === file.name && f.size === file.size)) {
            updatedFiles.push(file);
          }
        });
        return updatedFiles;
      });

      // Reset value của input về rỗng để bấm chọn lại chính file vừa xóa vẫn ăn event
      e.target.value = "";
    }
  };

  // Hàm xóa bớt file khỏi danh sách đã chọn
  const removeFile = (indexToRemove) => {
    setAttachedFiles(prevFiles => prevFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const targetProjectId = projectId || (projects.length > 0 ? projects[0].id : "proj_101");
      const payload = {
        title: title.trim(),
        description: description.trim() || "No description provided.",
        projectId: targetProjectId,
        paperId: paperId || ""
      };

      // 1. Gửi request tạo Bộ sưu tập (Collection) mới qua API
      const res = await api.post('/api/collections', payload);
      const newCollection = res.data;

      // 2. Chạy vòng lặp đẩy toàn bộ danh sách files đã chọn lên hệ thống
      if (attachedFiles.length > 0 && newCollection && newCollection.id) {
        const localDocs = localStorage.getItem('mock_db_referenceDocuments');
        const parsedDocs = localDocs ? JSON.parse(localDocs) : [];

        for (let i = 0; i < attachedFiles.length; i++) {
          const file = attachedFiles[i];
          const generatedBlobUrl = URL.createObjectURL(file);
          
          // Gửi tuần tự từng tài liệu đơn lẻ lên API
          await api.post(`/api/collections/${newCollection.id}/documents`, {
            fileName: file.name,
            fileUrl: generatedBlobUrl
          });

          // Lưu đồng bộ vào Mock LocalStorage DB tham chiếu
          parsedDocs.push({
            id: `doc_${Date.now()}_${i}`,
            collectionId: newCollection.id,
            name: file.name,
            fileName: file.name,
            fileUrl: generatedBlobUrl
          });
        }

        localStorage.setItem('mock_db_referenceDocuments', JSON.stringify(parsedDocs));
      }

      setSubmitting(false);
      alert("Tạo bộ tiêu chuẩn và đính kèm danh sách tài liệu PDF thành công!");
      navigate('/instructor/collections'); 
    } catch (error) {
      console.error("Lỗi tạo mới collection:", error);
      setErrorMessage("Validation error. Please verify input parameters syntax.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <button 
          type="button"
          onClick={() => navigate('/instructor/collections')}
          className="text-xs font-bold text-gray-400 hover:text-[#1e3a8a] transition flex items-center gap-1 mb-4"
        >
          ← Back 
        </button>

        <div className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight">Create Evidence Collection</h1>
          <p className="text-xs text-gray-400 mt-1">Initialize a new blueprint master library and attach initial reference documentation.</p>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">⚠️ {errorMessage}</div>
        )}

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          {loading ? (
            <div className="text-center py-8 text-xs text-gray-400 font-medium animate-pulse">Synchronizing infrastructure mapping configurations...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Collection Schema Title <span className="text-rose-500">*</span></label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Autumn 2026 Software Architecture Core Metrics Template" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Boundary Specification & Scope Description</label>
                <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the checking rules layout context..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Target Project Association Bound</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Target Paper Draft</label>
                <select value={paperId} onChange={(e) => setPaperId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition">
                  <option value="">-- Apply to All Papers in Project --</option>
                  {papers.map(p => <option key={p.id} value={p.id}>{p.name || p.filename}</option>)}
                </select>
              </div>

              {/* KHU VỰC CHỌN TÀI LIỆU PDF HỖ TRỢ CỘNG DỒN FILE */}
              <div className="space-y-1.5 border-t border-gray-100 pt-4">
                <label className="text-gray-500 font-black uppercase tracking-wide text-[10px] block">Initial Reference Document (Optional PDFs)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-gray-600">
                      {attachedFiles.length > 0 
                        ? `Đã chọn ${attachedFiles.length} file tài liệu` 
                        : "Chưa chọn file hướng dẫn nào"}
                    </span>
                  </div>
                  <label className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold shadow-sm cursor-pointer hover:bg-gray-50">
                    Browse PDFs
                    {/* Giữ nguyên multiple và dùng hàm handleFileChange mới để cộng dồn mảng */}
                    <input type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                {/* Giao diện danh sách file hiển thị tuần tự kèm nút xóa (Remove) */}
                {attachedFiles.length > 0 && (
                  <div className="mt-3 pl-9 space-y-2 max-h-40 overflow-y-auto">
                    {attachedFiles.map((f, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100/60 px-3 py-1.5 rounded-lg border border-gray-200/40 text-gray-600 font-medium text-[11px]">
                        <span className="truncate max-w-[80%]">📄 {f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-rose-500 hover:text-rose-700 font-black uppercase tracking-wider text-[10px] ml-2 shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 font-bold">
                <button type="button" onClick={() => navigate('/instructor/collections')} className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl text-center border border-gray-200/60">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition shadow-md disabled:opacity-50 text-center">
                  {submitting ? "Deploying..." : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}