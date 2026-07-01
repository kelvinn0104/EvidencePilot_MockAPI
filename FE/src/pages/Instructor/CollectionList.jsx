import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function CollectionList() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collections, setCollections] = useState([]);
  const [projects, setProjects] = useState([]); 
  const [documents, setDocuments] = useState([]); 
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // --- STATES QUẢN LÝ MODAL CHỈNH SỬA (ĐA FILE & XOÁ FILE CŨ) ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPaperId, setEditPaperId] = useState(""); 
  const [editFiles, setEditFiles] = useState([]); 
  const [currentAttachedPdfs, setCurrentAttachedPdfs] = useState([]); 

  // --- TẢI DANH SÁCH BAN ĐẦU (HIỂN THỊ TẤT CẢ CATEGORY ĐƯỢC ADMIN GÁN) ---
  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. Lấy ID Giảng viên hiện tại
      const userRes = await api.get('/api/users/me');
      const currentInstructorId = Number(userRes.data?.id);

      if (!currentInstructorId) {
        console.error("Không tìm thấy ID của Instructor.");
        setErrorMessage("Instructor identification failed.");
        return;
      }

      // 2. Lấy danh sách toàn bộ Project từ hệ thống
      const projectRes = await api.get('/api/projects');
      const rawProjects = Array.isArray(projectRes.data) ? projectRes.data : projectRes.data.content || [];

      // 3. LỌC: Kiểm tra chính xác quyền Assign từ Admin
      const assignedProjects = rawProjects.filter(project => {
        if (project.instructorIds && Array.isArray(project.instructorIds)) {
          return project.instructorIds.map(id => Number(id)).includes(currentInstructorId);
        }
        if (project.instructorId) {
          return Number(project.instructorId) === currentInstructorId;
        }
        if (project.instructor?.id) {
          return Number(project.instructor.id) === currentInstructorId;
        }
        return false; 
      });

      setProjects(assignedProjects);

      // Tải tài liệu tham chiếu từ Mock DB/API
      const localDocs = localStorage.getItem('mock_db_referenceDocuments');
      if (localDocs) {
        setDocuments(JSON.parse(localDocs));
      } else {
        try {
          const docsRes = await api.get('/api/collections/documents');
          setDocuments(docsRes.data || []);
        } catch(de) { 
          console.error("Không tải được docs từ API, giữ mảng rỗng", de); 
        }
      }

      // 4. AN TOÀN: Gom dữ liệu từ từng Project endpoint và LocalStorage để hiển thị ngay lập tức khi vừa tạo
      if (assignedProjects.length > 0) {
        const firstProject = assignedProjects[0];
        // Giữ lại tab đang chọn nếu có, không thì lấy project đầu tiên
        const activeTabId = selectedProjectId || firstProject.id;
        setSelectedProjectId(activeTabId);
        
        let accumulatedCollections = [];
        
        // Gọi song song các API của từng project được phân quyền
        const requests = assignedProjects.map(async (p) => {
          try {
            const res = await api.get(`/api/projects/${p.id}/collections`);
            if (Array.isArray(res.data)) {
              accumulatedCollections.push(...res.data);
            }
          } catch (err) {
            console.warn(`Project ${p.id} chưa có hoặc lỗi endpoint collections`, err);
          }
        });
        
        await Promise.all(requests);

        // ĐỒNG BỘ: Đọc trực tiếp dữ liệu từ LocalStorage do màn Create vừa đẩy vào
        const localCollections = localStorage.getItem('mock_db_collections');
        if (localCollections) {
          const parsedLocals = JSON.parse(localCollections);
          parsedLocals.forEach(localCol => {
            const existingIdx = accumulatedCollections.findIndex(c => c.id === localCol.id);
            if (existingIdx !== -1) {
              // Ưu tiên ghi đè dữ liệu Local mới nhất lên object từ API rỗng
              accumulatedCollections[existingIdx] = { ...accumulatedCollections[existingIdx], ...localCol };
            } else {
              accumulatedCollections.push(localCol);
            }
          });
        }

        setCollections(accumulatedCollections);

        // Tải danh sách bản thảo (papers) của tab hiện tại phục vụ cho Modal Edit
        try {
          const papersRes = await api.get(`/api/papers/by-project/${activeTabId}`);
          setPapers(papersRes.data || []);
        } catch (e) { console.error(e); }
      } else {
        setSelectedProjectId("");
        setCollections([]);
      }

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu collections:", error);
      setErrorMessage("Failed to synchronize collections repository with current active projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectFilterChange = async (pId) => {
    setSelectedProjectId(pId);
    if (!pId) return;
    try {
      // Khi bấm chuyển Tab, tải danh sách papers tương ứng của Tab đó
      const papersRes = await api.get(`/api/papers/by-project/${pId}`);
      setPapers(papersRes.data || []);
    } catch (error) {
      console.error("Lỗi lọc danh sách papers:", error);
    }
  };

  // Logic lọc dữ liệu hiển thị trên Client: Chấp nhận cả mảng `categoryIds` mới và biến đơn `projectId` cũ
  const displayedCollections = collections.filter(col => {
    if (col.categoryIds && Array.isArray(col.categoryIds)) {
      return col.categoryIds.map(id => String(id)).includes(String(selectedProjectId));
    }
    return String(col.projectId) === String(selectedProjectId);
  });

  const handleDeleteCollection = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this evidence library specification?")) return;
    try {
      await api.delete(`/api/collections/${id}`);
      setCollections(prev => prev.filter(item => item.id !== id));
      
      // Cập nhật lại cả LocalStorage phòng trường hợp bản ghi nằm ở Mock DB
      const localCollections = localStorage.getItem('mock_db_collections');
      if (localCollections) {
        const parsedCols = JSON.parse(localCollections).filter(item => item.id !== id);
        localStorage.setItem('mock_db_collections', JSON.stringify(parsedCols));
      }

      setDocuments(prev => {
        const updated = prev.filter(doc => String(doc.collectionId) !== String(id));
        localStorage.setItem('mock_db_referenceDocuments', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Lỗi xoá collection:", error);
      setErrorMessage("Could not delete target collection asset.");
    }
  };

  const openEditModal = (col, allMatchedPdfs) => {
    setEditingCollection(col);
    setEditTitle(col.title);
    setEditDescription(col.description || "");
    setEditPaperId(col.paperId || ""); 
    setEditFiles([]); 
    setCurrentAttachedPdfs(allMatchedPdfs || []); 
    setIsEditModalOpen(true);
  };

  const removeCurrentOldFile = (idToRemove) => {
    setCurrentAttachedPdfs(prev => prev.filter(pdf => pdf.id !== idToRemove));
  };

  const handleEditFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setEditFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        newFiles.forEach(file => {
          if (!updatedFiles.some(f => f.name === file.name && f.size === file.size)) {
            updatedFiles.push(file);
          }
        });
        return updatedFiles;
      });
      e.target.value = ""; 
    }
  };

  const removeNewEditFile = (indexToRemove) => {
    setEditFiles(prevFiles => prevFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      await api.put(`/api/collections/${editingCollection.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        paperId: editPaperId || null 
      });

      const localCollections = localStorage.getItem('mock_db_collections');
      if (localCollections) {
        const parsedCols = JSON.parse(localCollections);
        const matchIdx = parsedCols.findIndex(c => c.id === editingCollection.id);
        if (matchIdx !== -1) {
          parsedCols[matchIdx].title = editTitle.trim();
          parsedCols[matchIdx].description = editDescription.trim();
          parsedCols[matchIdx].paperId = editPaperId || null; 
          localStorage.setItem('mock_db_collections', JSON.stringify(parsedCols));
        }
      }

      const localDocs = localStorage.getItem('mock_db_referenceDocuments');
      let parsedDocs = localDocs ? JSON.parse(localDocs) : [];
      parsedDocs = parsedDocs.filter(d => String(d.collectionId) !== String(editingCollection.id));
      
      currentAttachedPdfs.forEach(oldPdf => parsedDocs.push(oldPdf));

      for (let i = 0; i < editFiles.length; i++) {
        const file = editFiles[i];
        const generatedBlobUrl = URL.createObjectURL(file);
        
        await api.post(`/api/collections/${editingCollection.id}/documents`, {
          fileName: file.name,
          fileUrl: generatedBlobUrl
        });

        parsedDocs.push({
          id: `doc_${Date.now()}_edit_${i}`,
          collectionId: editingCollection.id,
          name: file.name,
          fileName: file.name,
          fileUrl: generatedBlobUrl
        });
      }
      
      localStorage.setItem('mock_db_referenceDocuments', JSON.stringify(parsedDocs));
      setDocuments(parsedDocs);

      // Gọi lại hàm fetchInitialData để đồng bộ mượt mà danh sách hiển thị
      await fetchInitialData();

      setIsEditModalOpen(false);
      alert("Collection changes and file repository synchronized successfully!");
    } catch (error) {
      console.error("Lỗi cập nhật collection:", error);
      setErrorMessage("Failed to update collection asset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
      <header className="bg-[#1e3a8a] text-white border-b border-[#152e75] sticky top-0 z-10 shadow-sm">
        <div className="w-full px-8 h-16 flex items-center justify-between">
          <div onClick={() => navigate('/')} className="flex items-center space-x-3 cursor-pointer hover:text-blue-100 transition-colors">
            <span className="font-bold text-xl tracking-wider">Evidence Pilot</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-blue-50 tracking-wide uppercase">Instructor Mode</span>
            </div>
            <button onClick={() => navigate('/instructor/dashboard')} className="text-sm font-medium text-blue-200 hover:text-white transition">Dashboard</button>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm font-medium text-blue-200 hover:text-white transition">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight">Collections</h1>
            <p className="text-xs text-gray-400 mt-1">Configure baseline compliance parameters, document templates, and scope evaluation rules.</p>
          </div>
          <button
            onClick={() => navigate('/instructor/collections/create')}
            className="px-5 py-2.5 bg-[#1e3a8a] text-white font-black text-xs rounded-xl hover:bg-blue-800 transition shadow-sm"
          >
            + Create Collection
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">⚠️ {errorMessage}</div>
        )}

        {/* THANH CATEGORY TAB */}
        {projects.length > 0 ? (
          <div className="flex items-center space-x-3 mb-6 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider pl-2 shrink-0">Category Tab:</span>
            <div className="flex items-center space-x-1.5">
              {projects.map((p) => {
                const isSelected = String(p.id) === String(selectedProjectId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProjectFilterChange(p.id)}
                    className={`px-4 py-2 text-xs font-black rounded-xl tracking-tight transition whitespace-nowrap ${
                      isSelected ? 'bg-[#1e3a8a] text-white shadow-sm' : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
                    }`}
                  >
                    {p.title || p.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : !loading && (
          <div className="p-6 mb-6 text-center text-xs text-gray-400 bg-gray-100/70 border border-dashed border-gray-200 rounded-2xl">
            No categories assigned to your instructor profile by administration.
          </div>
        )}

        {/* Bảng hiển thị danh sách Collection */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase border-b border-gray-100">
                  <th className="px-6 py-4">Collection UUID</th>
                  <th className="px-6 py-4">Title Specs</th>
                  <th className="px-6 py-4">Target Paper</th>
                  <th className="px-6 py-4">Core Description Label</th>
                  <th className="px-6 py-4">Reference Files</th>                  
                  <th className="px-6 py-4 text-right">Actions</th>                  
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400 font-medium animate-pulse">Synchronizing metadata data stream...</td></tr>
                ) : displayedCollections.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium italic">No active collection matrix mapped to this project module layout. Click "+ Create Collection" to get started.</td></tr>
                ) : (
                  displayedCollections.map((col) => {
                    const matchedPdfs = documents.filter(doc => String(doc.collectionId) === String(col.id));
                    return (
                      <tr key={col.id} className="hover:bg-gray-50/40 transition">
                        <td className="px-6 py-4 font-mono text-gray-400 text-[11px]">{col.id}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{col.title}</td>
                        <td className="px-6 py-4">
                          {(() => {
                            if (!col.paperId) return <span className="text-gray-400 font-medium">All Papers</span>;
                            const matched = papers.find(p => String(p.id) === String(col.paperId));
                            return matched ? (
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-xl font-bold text-[10px] border border-blue-100">
                                📄 {matched.name || matched.filename}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">{col.paperId}</span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs whitespace-pre-wrap break-words leading-relaxed">{col.description || "No description provided."}</td>
                        <td className="px-6 py-4">
                          {matchedPdfs.length > 0 ? (
                            <div className="flex flex-col gap-1.5 items-start">
                              {matchedPdfs.map((pdf, idx) => (
                                <div key={pdf.id || idx} className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-red-700 font-bold shadow-sm">
                                  <span className="text-sm shrink-0">📕</span>
                                  <span className="text-gray-900 font-bold truncate max-w-[130px] text-xs">{pdf.name || pdf.fileName}</span>
                                  <a href={pdf.fileUrl || "#"} target="_blank" rel="noopener noreferrer" className="ml-2 text-[10px] bg-red-600 text-white font-black px-2 py-1 rounded-lg hover:bg-red-700 transition shrink-0 shadow-sm">View</a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No document bound</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button onClick={() => openEditModal(col, matchedPdfs)} className="text-xs font-bold text-amber-600 hover:text-amber-800 hover:underline transition">Edit</button>
                          <button onClick={() => handleDeleteCollection(col.id)} className="text-xs font-bold text-rose-600 hover:text-rose-900 hover:underline transition">Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL EDIT */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-xs text-left">
              <div>
                <h3 className="text-lg font-black text-[#1e3a8a]">Update Collection Specifications</h3>
                <p className="text-[11px] text-gray-400">Modify metadata parameters, delete existing documents or append new reference assets.</p>
              </div>
              <form onSubmit={handleUpdateCollection} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Collection Schema Title</label>
                  <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Target Paper Map</label>
                  <select value={editPaperId} onChange={(e) => setEditPaperId(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition">
                    <option value="">All Papers (Global Bound)</option>
                    {papers.map((p) => (
                      <option key={p.id} value={p.id}>📄 {p.name || p.filename}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Boundary Specification Description</label>
                  <textarea rows="3" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block">Reference Document Assets</label>
                  {currentAttachedPdfs.length > 0 ? (
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-[#1e3a8a] font-black block uppercase tracking-wider mb-1">🔒 Current Attached Documents:</span>
                      {currentAttachedPdfs.map((pdf, idx) => (
                        <div key={pdf.id || idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200/60 text-[11px] font-medium text-gray-700">
                          <span className="truncate max-w-[75%]">📄 {pdf.name || pdf.fileName}</span>
                          <button type="button" onClick={() => removeCurrentOldFile(pdf.id)} className="text-rose-600 hover:text-rose-800 font-bold uppercase text-[9px] tracking-wider shrink-0">Remove</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 italic bg-gray-50 p-2 rounded-xl text-center border border-dashed border-gray-200">No documents remaining in this repository cloud.</div>
                  )}
                  <div className="border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                    <span className="font-medium text-gray-600 truncate max-w-[220px]">
                      {editFiles.length > 0 ? `✨ Selected ${editFiles.length} new file(s)` : "Attach more new PDFs (Optional)"}
                    </span>
                    <label className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold shadow-xs cursor-pointer hover:bg-gray-100 text-[11px] shrink-0">
                      Browse PDFs
                      <input type="file" accept=".pdf" multiple onChange={handleEditFileChange} className="hidden" />
                    </label>
                  </div>
                  {editFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto pl-1">
                      <span className="text-[10px] text-emerald-600 font-black block uppercase tracking-wider">✨ New Staged Files To Upload:</span>
                      {editFiles.map((f, index) => (
                        <div key={index} className="flex items-center justify-between bg-emerald-50/40 px-2 py-1.5 rounded-lg border border-emerald-100 text-[11px] text-gray-700">
                          <span className="truncate max-w-[80%]">📄 {f.name}</span>
                          <button type="button" onClick={() => removeNewEditFile(index)} className="text-rose-500 hover:text-rose-700 font-black text-[10px] uppercase ml-2 shrink-0">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-3 border-t border-gray-100 font-bold">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-center transition">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-xl text-center transition shadow-md">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}