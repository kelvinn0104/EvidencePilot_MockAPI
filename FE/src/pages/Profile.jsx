import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api.js';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // --- 1. STATES MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState(""); // 🌟 Thêm state Email để binding vào ô Input
  const [message, setMessage] = useState({ type: "", text: "" });

  // Tự động quét URL để xác định phân hệ đang truy cập
  const pathname = window.location.pathname;
  const fallbackRole = pathname.includes('/admin') ? 'ADMIN' : (pathname.includes('/instructor') ? 'INSTRUCTOR' : 'STUDENT');

  // --- 2. ĐỌC DỮ LIỆU TỪ API ---
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users/me');
      const data = response.data;
      if (data) {
        setUser(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setAge(data.age || "");
        setEmail(data.email || ""); // 🌟 Đọc email từ API đổ vào Form
      }
    } catch (error) {
      console.error("Lỗi truy xuất dữ liệu profile:", error);
      setMessage({ type: "error", text: "Failed to load profile details." });
    } finally {
      setLoading(false);
    }
  };

  // --- 3. CẬP NHẬT QUA API ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setMessage({ type: "error", text: "First name cannot be blank." });
      return;
    }
    // Validate thêm email không được để trống
    if (!email.trim()) {
      setMessage({ type: "error", text: "Email cannot be blank." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: parseInt(age) || null,
        email: email.trim() // 🌟 Gửi kèm email mới lên backend để update
      };

      const response = await api.put('/api/users/me', payload);
      setUser(response.data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile." });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [pathname]);

  const currentRole = user?.role || fallbackRole;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <div className="text-xs font-bold text-gray-400 tracking-widest animate-pulse uppercase">
          Querying secure user cluster metadata...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Bar back to dashboard depending on role */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => {
              if (currentRole === 'ADMIN') navigate('/admin/dashboard');
              else if (currentRole === 'INSTRUCTOR') navigate('/instructor/dashboard');
              else navigate('/student/projects');
            }}
            className="text-xs font-bold text-[#1e3a8a] hover:underline flex items-center"
          >
            ← Back to Dashboard
          </button>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            Sign Out
          </button>
        </div>

        {/* Dynamic Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight">
            {currentRole === 'ADMIN' ? 'Admin Profile' : currentRole === 'INSTRUCTOR' ? 'Instructor Profile' : 'Student Profile'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {currentRole === 'ADMIN' 
              ? 'Manage root credentials, platform access privileges, and cryptographic keys.'
              : currentRole === 'INSTRUCTOR'
                ? 'Manage your personal cryptographic identification, profile identities, and institutional platform authority.'
                : 'View your student academic details, active workspaces, and feedback history.'}
          </p>
        </div>

        {message.text && (
          <div className={`p-4 mb-6 rounded-2xl border text-xs font-bold transition ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            {message.type === 'success' ? '✓' : '⚠️'} {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* LEFT PANEL */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 bg-gradient-to-tr rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md ${
              currentRole === 'ADMIN' ? 'from-rose-600 to-orange-500' : 
              currentRole === 'INSTRUCTOR' ? 'from-purple-600 to-indigo-500' : 
              'from-blue-600 to-cyan-500'
            }`}>
              {user?.firstName?.charAt(0) || "U"}{user?.lastName?.charAt(0) || "P"}
            </div>
            
            <div className="space-y-1 w-full">
              <h2 className="font-black text-gray-900 text-base tracking-tight">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-xs text-gray-400 font-medium truncate px-2">
                {currentRole === 'ADMIN' ? '👑 Administrator' : currentRole === 'INSTRUCTOR' ? '👨‍🏫 Faculty Member' : '🎓 Student Sandbox'}
              </p>
            </div>

            <div className="w-full pt-4 border-t border-gray-100">
              <span className={`inline-block px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-lg border ${
                currentRole === 'ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                currentRole === 'INSTRUCTOR' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                Authority: {currentRole}
              </span>
            </div>

            <div className="w-full bg-gray-50 rounded-xl p-3 text-[10px] text-left font-mono text-gray-400 border border-gray-100 break-all">
              <span className="block font-bold uppercase tracking-wide text-[8px] text-gray-500 mb-0.5">User Infrastructure Key:</span>
              {user?.id}
            </div>
          </div>

          {/* RIGHT PANEL: Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-6 pb-2 border-b border-gray-50">
                Identity Profile Definitions
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">First Name</label>
                    <input 
                      type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Last Name</label>
                    <input 
                      type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                    />
                  </div>
                </div>

                {/* 🌟 Ô EMAIL đưa lên form chính và có thể nhập để cập nhật */}
                <div className="space-y-1.5">
                  <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Email</label>
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Age</label>
                  <input 
                    type="number" value={age} onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit" disabled={submitting}
                    className={`px-6 py-3 text-white font-black rounded-xl transition shadow-sm disabled:opacity-50 ${
                      currentRole === 'ADMIN' ? 'bg-rose-600 hover:bg-rose-700' :
                      currentRole === 'INSTRUCTOR' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-[#1e3a8a] hover:bg-blue-800'
                    }`}
                  >
                    {submitting ? "Synchronizing..." : "Update"}
                  </button>
                </div>
              </form>
            </div>

            {/* Bảng dưới cùng chỉ giữ lại ô hiển thị Role tĩnh */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-4">
              <div className="grid grid-cols-1 gap-4 text-xs">
                <div className="bg-gray-50/70 border border-gray-100 p-3 rounded-xl">
                  <span className="block text-gray-400 font-black uppercase text-[9px] tracking-wide">Assigned Scope Role</span>
                  <span className="font-mono text-gray-600 block mt-1 text-[11px] font-bold">{currentRole}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}