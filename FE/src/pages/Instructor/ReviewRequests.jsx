import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function ReviewRequests() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Trạng thái điều khiển Modal Hành động (Chỉ còn APPROVE hoặc REJECT)
  const [activeActionNode, setActiveActionNode] = useState(null); // Lưu { req, type: 'APPROVE' | 'REJECT' }
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchReviewRequests = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get('/api/feedback-requests');
      setRequests(response.data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      setErrorMessage("Could not load validation assignments assigned to your token profile account.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmActionPipeline = async (e) => {
    e.preventDefault();
    if (!activeActionNode) return;
    
    const { req, type } = activeActionNode;
    
    // Nếu từ chối (REJECT) thì bắt buộc phải nhập lý do bận/không tham gia được
    if (type === 'REJECT' && !actionReason.trim()) {
      alert("Please provide the mandatory justification for rejecting this project invitation.");
      return;
    }

    setSubmittingAction(true);
    setErrorMessage("");

    try {
      // 1. Nếu có ghi nội dung, gửi lên API feedback để lưu log lý do trước
      if (actionReason.trim()) {
        const prefix = type === 'REJECT' ? '[Reject Reason]: ' : '[Approval Note]: ';
        await api.post(`/api/feedback-requests/${req.id}/feedback`, {
          content: `${prefix}${actionReason.trim()}`
        });
      }

      // 2. Kích hoạt chuyển trạng thái trên Backend
      let actionEndpoint = type === 'APPROVE' ? "reviewed" : "rejected";
      let nextLocalStatus = type === 'APPROVE' ? "APPROVED" : "REJECTED";

      await api.post(`/api/feedback-requests/${req.id}/${actionEndpoint}`);

      // 3. Cập nhật Local State để UI cập nhật ngay lập tức
      setRequests(prev => prev.map(item => item.id === req.id ? { ...item, status: nextLocalStatus } : item));

      alert(`You have successfully ${type === 'APPROVE' ? 'accepted' : 'rejected'} the project invitation!`);
      setActionReason("");
      setActiveActionNode(null);
    } catch (error) {
      console.error("Pipeline error:", error);
      setErrorMessage("State transition rejected by backend pipeline engine rules.");
    } finally {
      setSubmittingAction(false);
    }
  };

  useEffect(() => {
    fetchReviewRequests();
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
        <div className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight">Requests</h1>
          <p className="text-xs text-gray-400 mt-1">Review student project proposals, accept requests to join as an instructor, or decline with reasoning.</p>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">⚠️ {errorMessage}</div>
        )}

        {/* BẢNG CHỈ CÒN 3 CỘT GỌN GÀNG */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase border-b border-gray-100">
                  <th className="px-6 py-4">Project Title Context</th>
                  <th className="px-6 py-4">Request Status</th>
                  <th className="px-6 py-4 text-right">Resolution Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400 font-medium">Interrogating pending requests...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400 font-medium">No pending project requests assigned to your instructor profile.</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/40 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block text-xs">{req.projectTitle || (req.project?.title || req.project?.name || "Project Evaluation Node")}</span>
                        {req.paperName && (
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mt-1 inline-flex items-center gap-1 w-max">
                            📄 Bản thảo: {req.paperName}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono block mt-1">Request ID: {req.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 inline-block text-[9px] font-black rounded-md uppercase border ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          req.status === 'APPROVED' || req.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>{req.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* CHỈ CÒN ĐÚNG 2 NÚT CHUẨN LUỒNG MỜI THAM GIA */}
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => setActiveActionNode({ req, type: 'APPROVE' })}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700 transition shadow-xs"
                          >
                            Accept & Join
                          </button>
                          <button 
                            onClick={() => setActiveActionNode({ req, type: 'REJECT' })}
                            className="px-3 py-1 bg-rose-600 text-white font-bold text-[10px] rounded hover:bg-rose-700 transition shadow-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL XỬ LÝ 2 HÀNH ĐỘNG APPROVE / REJECT */}
        {activeActionNode && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <form onSubmit={handleConfirmActionPipeline} className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 text-left">
              <div>
                <h3 className={`text-sm font-black uppercase tracking-wide ${
                  activeActionNode.type === 'APPROVE' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {activeActionNode.type === 'APPROVE' ? 'Accept Request' : 'Reject Request'}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {activeActionNode.type === 'APPROVE' ? 'Add an optional welcoming note for the student team.' : 'Please write down your reason for declining this request.'}
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-gray-500 font-bold block mb-1">
                  Message {activeActionNode.type === 'REJECT' ? '*' : '(Optional)'}
                </label>
                <textarea 
                  rows="3" 
                  required={activeActionNode.type === 'REJECT'}
                  value={actionReason} 
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    activeActionNode.type === 'APPROVE' 
                      ? "Ví dụ: Ok, Instructor đồng ý tham gia..." 
                      : "Ví dụ: Tuần này Instructor hơi bận, không sắp xếp được thời gian..."
                  }
                  className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 text-gray-800 ${
                    activeActionNode.type === 'APPROVE' ? 'focus:ring-emerald-500' : 'focus:ring-rose-500'
                  }`}
                />
              </div>

              <div className="flex gap-2 text-xs font-bold pt-1">
                <button type="button" onClick={() => { setActiveActionNode(null); setActionReason(""); }} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                <button 
                  type="submit" 
                  disabled={submittingAction}
                  className={`flex-1 py-2 text-white rounded-xl transition shadow-sm disabled:opacity-50 ${
                    activeActionNode.type === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingAction ? "Processing..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}