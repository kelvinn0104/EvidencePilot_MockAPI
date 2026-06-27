import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function ReviewRequests() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States cho modal kiểm chứng chi tiết (Audit / Review)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [auditDetails, setAuditDetails] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Tải danh sách các feedback requests và lấy tên dự án thực tế
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/feedback-requests');
      // Lọc các yêu cầu đang chờ duyệt (status: PENDING)
      const pendingRequests = (res.data || []).filter(req => req.status === 'PENDING');

      // Với mỗi yêu cầu, gọi API export để lấy tên dự án thực tế
      const requestsWithDetails = await Promise.all(
        pendingRequests.map(async (req) => {
          try {
            const exportRes = await api.get(`/api/projects/${req.projectId}/traceability-export`);
            return {
              ...req,
              projectTitle: exportRes.data.projectTitle || `Dự án ID: ${req.projectId}`,
              projectStatus: exportRes.data.projectStatus
            };
          } catch (err) {
            console.error(`Failed to fetch project title for ${req.projectId}`, err);
            return {
              ...req,
              projectTitle: `Dự án ID: ${req.projectId}`
            };
          }
        })
      );

      setRequests(requestsWithDetails);
    } catch (err) {
      console.error('Failed to fetch feedback requests:', err);
      setError('Không thể kết nối đến máy chủ Backend để lấy danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 2. Mở Modal đánh giá dự án
  const handleOpenAudit = async (req) => {
    setSelectedRequest(req);
    setFeedbackComment('');
    setAuditDetails(null);
    setLoadingAudit(true);
    try {
      const exportRes = await api.get(`/api/projects/${req.projectId}/traceability-export`);
      setAuditDetails(exportRes.data);
    } catch (err) {
      console.error('Failed to fetch traceability details for audit:', err);
      showToast('Không thể tải thông tin kiểm chứng của dự án này.');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleReview = async (requestId, actionType) => {
    try {
      setLoading(true);
      let endpoint = '';
      let actionLabel = '';
      if (actionType === 'APPROVED') {
        endpoint = `/api/feedback-requests/${requestId}/reviewed`;
        actionLabel = 'phê duyệt thành công';
      } else if (actionType === 'REJECTED') {
        endpoint = `/api/feedback-requests/${requestId}/rejected`;
        actionLabel = 'từ chối';
      }
      await api.post(endpoint);
      showToast(`Yêu cầu của dự án đã được ${actionLabel}!`);
      await fetchRequests();
    } catch (err) {
      console.error(`Failed to execute review action ${actionType}:`, err);
      alert('Thao tác phê duyệt thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Thực hiện lưu feedback và chuyển đổi trạng thái duyệt dự án
  const handleReviewAction = async (actionType) => {
    if (!selectedRequest) return;

    // Nếu chuyển trả về hoặc từ chối, yêu cầu giảng viên phải ghi nhận xét
    if ((actionType === 'RETURNED' || actionType === 'REJECTED') && !feedbackComment.trim()) {
      alert('Vui lòng nhập nhận xét/lý do trả lại hoặc từ chối dự án này.');
      return;
    }

    try {
      setSubmittingFeedback(true);

      // Bước A: Gửi feedback comment nếu có nội dung nhận xét
      if (feedbackComment.trim()) {
        await api.post(`/api/feedback-requests/${selectedRequest.id}/feedback`, {
          content: feedbackComment.trim()
        });
      }

      // Bước B: Gọi API chuyển đổi trạng thái của yêu cầu
      let endpoint = '';
      let actionLabel = '';
      if (actionType === 'APPROVED') {
        endpoint = `/api/feedback-requests/${selectedRequest.id}/reviewed`;
        actionLabel = 'phê duyệt thành công';
      } else if (actionType === 'REJECTED') {
        endpoint = `/api/feedback-requests/${selectedRequest.id}/rejected`;
        actionLabel = 'từ chối';
      } else if (actionType === 'RETURNED') {
        endpoint = `/api/feedback-requests/${selectedRequest.id}/return-to-active`;
        actionLabel = 'trả lại để chỉnh sửa';
      }

      await api.post(endpoint);
      showToast(`Yêu cầu của dự án đã được ${actionLabel}!`);

      // Đóng modal và tải lại danh sách
      setSelectedRequest(null);
      setAuditDetails(null);
      await fetchRequests();
    } catch (err) {
      console.error(`Failed to execute review action ${actionType}:`, err);
      alert('Thao tác phê duyệt thất bại. Vui lòng kiểm tra lại quyền truy cập.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Header */}
      <header className="bg-indigo-900 text-white border-b border-indigo-950 sticky top-0 z-30 shadow-md">
        <div className="w-full px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')} title="Go to Home">
            <div className="w-7 h-7 bg-white text-indigo-900 rounded-md text-xs flex items-center justify-center font-black shadow-sm">EP</div>
            <span className="font-bold text-xl tracking-wider">Evidence Pilot</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-indigo-100 tracking-wide uppercase">Giảng Viên</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                {requests.length} pending
              </span>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-indigo-800 text-indigo-100 hover:bg-indigo-700 hover:text-white rounded-md transition font-medium text-sm border border-indigo-700"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/instructor/dashboard')}
                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition font-medium text-sm"
              >
                Dashboard
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition font-medium text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Project</th>
              <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Student</th>
              <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Submitted Date</th>
              <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No pending requests to review.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-blue-50/50 transition duration-150">
                  <td className="p-4">
                    {/* Map đúng cấu trúc object lồng nhau từ Entity Java của BE */}
                    <p className="font-bold text-gray-800">{req.project?.name || 'N/A'}</p>
                    {req.paperName && (
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">Bản thảo: {req.paperName}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-700">
                      {req.student ? `${req.student.firstName} ${req.student.lastName}`.trim() : 'Unknown Student'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-US') : 'N/A'}
                    <span className="block text-xs text-gray-400">
                      {req.requestedAt ? new Date(req.requestedAt).toLocaleTimeString('en-US') : ''}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleReview(req.id, 'APPROVED')}
                        className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition shadow-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReview(req.id, 'REJECTED')}
                        className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition shadow-sm"
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
    </div >
  );
}