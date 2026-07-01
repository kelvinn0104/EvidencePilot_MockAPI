import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🌟 GIỮ LOGIC CODE GIT MỚI NHƯNG THAY ĐỔI TRẠNG THÁI SỐ LIỆU ĐỂ THỐNG KÊ CHÍNH XÁC THEO GIT CŨ
  const [dbCounts, setDbCounts] = useState({ categories: 0, collections: 0, docs: 0 });

  useEffect(() => {
    async function fetchAdminData() {
      try {
        setLoading(true);
        
        // 1. Gọi các API hệ thống của Git mới
        const logsRes = await api.get('/api/user/audit-logs');
        setLogs(logsRes.data || []);

        // 2. Lấy dữ liệu thực tế từ các endpoint hoặc bộ nhớ tạm localStorage để đếm số liệu chính xác
        const projectsRes = await api.get('/api/projects');
        const projectList = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.content || [];
        
        // Lấy danh sách collections (Ưu tiên gọi từ endpoint theo project đầu tiên hoặc lấy toàn bộ)
        let totalCollections = [];
        if (projectList.length > 0) {
          try {
            const colRes = await api.get(`/api/projects/${projectList[0].id}/collections`);
            totalCollections = Array.isArray(colRes.data) ? colRes.data : [];
          } catch (e) {
            // Fallback sang bộ nhớ lưu trữ cục bộ nếu endpoint yêu cầu filter cụ thể
            const localCols = localStorage.getItem('mock_db_collections');
            if (localCols) totalCollections = JSON.parse(localCols);
          }
        }

        // Đọc danh sách File đính kèm từ mock_db_referenceDocuments của Git mới
        const localDocs = localStorage.getItem('mock_db_referenceDocuments');
        const documentList = localDocs ? JSON.parse(localDocs) : [];

        // Tính toán số lượng file PDFs hợp lệ gắn liền với các Collection đang tồn tại
        const validCollectionIds = totalCollections.map(c => String(c.id));
        const totalValidDocs = documentList.filter(
          doc => validCollectionIds.includes(String(doc.collectionId))
        ).length;

        // Cập nhật state đếm số liệu động
        setDbCounts({
          categories: projectList.length,
          collections: totalCollections.length,
          docs: totalValidDocs
        });

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
      
      {/* 🌟 HEADER ĐỒNG BỘ Y CHANG COLLECTIONLIST (Chế độ Administrator Mode & Có nút Home) */}
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
            {/* Tag Badge Mode */}
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-blue-50 tracking-wide uppercase">Administrator Mode</span>
            </div>
            
            {/* Nút điều hướng Home */}
            <button onClick={() => navigate('/')} className="text-sm font-medium text-blue-200 hover:text-white transition">
              Home
            </button>

            <Link to="/admin/profile" className="text-sm font-medium text-blue-200 hover:text-white transition">
              Admin Profile
            </Link>
            
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm font-medium text-blue-200 hover:text-white transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-8">
        
        {/* Title Section */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e3a8a] tracking-tight">Administrator Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor server resources, audit logs, and platform permissions maintenance.</p>
          </div>
          <div className="flex items-center space-x-4">
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400 font-bold animate-pulse">
            Synchronizing administrative dashboard matrices...
          </div>
        ) : (
          <>
            {/* 🌟 KHU VỰC THỐNG KÊ ĐÃ ĐỔI THÀNH GRID 3 CỘT ĐỀU NHAU CỦA GIT CŨ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Ô số liệu 1: Category Tabs */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Category Tabs</span>
                <div className="text-3xl font-black text-indigo-600 mt-2">
                  {dbCounts.categories} <span className="text-xs text-gray-400 font-normal">{dbCounts.categories === 1 ? 'tab' : 'tabs'}</span>
                </div>
              </div>

              {/* Ô số liệu 2: Standard Collections */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Collections</span>
                <div className="text-3xl font-black text-purple-600 mt-2">
                  {dbCounts.collections} <span className="text-xs text-gray-400 font-normal">{dbCounts.collections === 1 ? 'collection' : 'collections'}</span>
                </div>
              </div>

              {/* Ô số liệu 3: Reference File PDFs */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Reference File PDFs</span>
                <div className="text-3xl font-black text-amber-600 mt-2">
                  {dbCounts.docs} <span className="text-xs text-gray-400 font-normal">{dbCounts.docs === 1 ? 'file' : 'files'}</span>
                </div>
              </div>
            </div>

            {/* Bảng dữ liệu log nguyên gốc của Git mới */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-base">System Audit Logs (User Traceability)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase border-b border-gray-100">
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">User Account</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Executed Action</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400">No logs found in platform registry.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id || log.timestamp} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.timestamp}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{log.username}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.role === 'ADMIN' ? 'bg-rose-50 text-rose-700' : 
                              log.role === 'INSTRUCTOR' ? 'bg-purple-50 text-purple-700' : 
                              'bg-blue-50 text-blue-700'
                            }`}>{log.role}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{log.action}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>{log.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}