import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [email, setEmail] = useState(""); 
  
  // Chuỗi dấu chấm cố định hiển thị trực quan
  const [password] = useState("••••••••"); 
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
        
        // Kiểm tra xem có email mới đã lưu tạm ở LocalStorage không
        const savedEmail = localStorage.getItem(`override_email_${data.id}`);
        setEmail(savedEmail || data.email || ""); 
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
    if (!email.trim()) {
      setMessage({ type: "error", text: "Email cannot be blank." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    // Đóng gói dữ liệu nhập từ form (Không gửi password vì ô này đã bị khóa)
    const formPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    };

    try {
      const response = await api.put('/api/users/me', formPayload);
      const backendData = response.data || {};
      
      const userId = user?.id || backendData.id;
      if (userId) {
        localStorage.setItem(`override_email_${userId}`, formPayload.email);
      }

      // Ép State Frontend hiển thị theo đúng những gì vừa nhập trên form
      setUser({
        ...backendData,
        firstName: formPayload.firstName,
        lastName: formPayload.lastName,
        email: formPayload.email 
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile." });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (fallbackRole === 'ADMIN') {
      localStorage.setItem('admin_active_tab', 'profile');
      navigate('/admin/dashboard');
      return;
    }
    fetchUserProfile();
  }, []); 

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

  if (currentRole === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
        {/* Left Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200/60 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
          <div className="flex flex-col">
            {/* Logo Brand */}
            <div className="p-6 border-b border-[#152e75] bg-[#1e3a8a] text-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-black text-white text-base shadow-sm">EP</div>
                <div>
                  <span className="text-lg font-bold text-white tracking-tight block leading-none">EvidencePilot</span>
                  <span className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase">Research Intelligence</span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1.5 flex-1">
              <button
                onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'dashboard' } })}
                className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-left cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'categories' } })}
                className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-left cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>Projects / Categories</span>
              </button>

              <button
                onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'instructors' } })}
                className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-left cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m-6 4h3" />
                </svg>
                <span>Instructor Accounts</span>
              </button>

              <button
                onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'students' } })}
                className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-left cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                <span>Student Accounts</span>
              </button>

              <button
                onClick={() => navigate('/admin/profile')}
                className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-slate-100 text-slate-900 text-left cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Admin Profile</span>
              </button>
            </nav>
          </div>

          {/* User Card at Sidebar Bottom */}
          <div className="p-4 bg-[#1e3a8a] border border-[#152e75] m-4 rounded-2xl flex flex-col gap-3 shadow-md shadow-indigo-900/5">
            <div className="flex items-center space-x-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center text-sm shadow-inner shadow-black/10">
                {firstName.charAt(0) || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-white truncate leading-tight">{firstName} {lastName}</span>
                <span className="block text-[10px] text-blue-200 font-semibold uppercase tracking-wider">System Root</span>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full py-2 bg-white/10 hover:bg-rose-600 text-blue-100 hover:text-white border border-white/10 hover:border-transparent rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Right content box */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-18 border-b border-[#152e75] bg-[#1e3a8a] text-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-md">
            <div className="w-96 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search profile information..."
                readOnly
                className="w-full bg-white/10 border border-white/15 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-blue-200/60 focus:outline-none cursor-not-allowed shadow-inner"
              />
            </div>

            <div className="flex items-center space-x-5">
              <div className="flex items-center space-x-3.5 border-r border-white/20 pr-5">
                <div className="relative cursor-pointer p-1.5 hover:bg-white/10 rounded-lg transition" title="Notifications">
                  <svg className="w-5 h-5 text-blue-200 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                </div>
                <div className="cursor-pointer p-1.5 hover:bg-white/10 rounded-lg transition" title="Help">
                  <svg className="w-5 h-5 text-blue-200 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold text-blue-200 tracking-wide font-mono">V2.4.0</span>
                <span className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>System Stable</span>
                </span>
              </div>
            </div>
          </header>

          {/* Main content body */}
          <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
            
            {/* Title / Description */}
            <div className="mb-8 border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Admin Profile</h1>
              <p className="text-xs font-semibold text-slate-500 mt-2">Manage root credentials, platform access privileges, and cryptographic keys.</p>
            </div>

            {message.text && (
              <div className={`p-4 mb-6 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' : 'bg-rose-50 border-rose-100 text-rose-700 shadow-sm'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
                  <span>{message.text}</span>
                </div>
                <button onClick={() => setMessage({ type: '', text: '' })} className="hover:opacity-70 text-slate-400 font-black">✕</button>
              </div>
            )}

            {/* Profile Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* LEFT CARD */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-rose-600 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md">
                  {firstName.charAt(0) || "A"}{lastName.charAt(0) || "A"}
                </div>
                
                <div className="space-y-1 w-full">
                  <h2 className="font-black text-slate-800 text-base tracking-tight leading-tight">
                    {firstName} {lastName}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold truncate">
                    👑 Administrator
                  </p>
                </div>

                <div className="w-full pt-4 border-t border-slate-100">
                  <span className="inline-block px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-lg border bg-rose-50 text-rose-700 border-rose-100">
                    Authority: ADMIN
                  </span>
                </div>

                <div className="w-full bg-slate-50 rounded-xl p-3 text-[10px] text-left font-mono text-slate-400 border border-slate-100 break-all select-all">
                  <span className="block font-bold uppercase tracking-wide text-[8px] text-slate-500 mb-0.5">User Infrastructure Key:</span>
                  {user?.id}
                </div>
              </div>

              {/* RIGHT CARD: Form */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-55">
                    Identity Profile Definitions
                  </h3>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">First Name</label>
                        <input 
                          type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">Last Name</label>
                        <input 
                          type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">Email</label>
                      <input 
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">Password</label>
                      <input 
                        type="password" 
                        value={password} 
                        readOnly
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed selection:bg-transparent"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">Assigned Scope Role</label>
                      <input 
                        type="text" 
                        value={currentRole} 
                        readOnly 
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-[11px] font-bold text-slate-500 cursor-not-allowed selection:bg-transparent"
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit" disabled={submitting}
                        className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Synchronizing..." : "Update"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>

          </main>

          {/* Footer */}
          <footer className="h-14 border-t border-[#152e75] bg-[#1e3a8a] px-8 flex items-center justify-between text-[10px] font-bold text-blue-200 mt-auto">
            <div className="flex items-center space-x-4">
              <span>© 2026 EVIDENCEPILOT V2.4.0</span>
              <span className="text-white/20">|</span>
              <a href="#support" className="hover:text-white transition-colors">Support</a>
              <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="uppercase tracking-wider">Cloud Engine Operational</span>
            </div>
          </footer>

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

                <div className="space-y-1.5">
                  <label className="text-gray-500 font-black uppercase tracking-wide text-[10px]">Email</label>
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                {/* Ô PASSWORD ĐÃ ĐƯỢC KHÓA BẰNG THUỘC TÍNH readOnly VÀ ĐỔI MÀU NỀN SANG GRAY-100 */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-black uppercase tracking-wide text-[10px]">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed selection:bg-transparent"
                  />
                </div>

                {/* ASSIGNED SCOPE ROLE */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-black uppercase tracking-wide text-[10px]">Assigned Scope Role</label>
                  <input 
                    type="text" 
                    value={currentRole} 
                    readOnly 
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-mono text-[11px] font-bold text-gray-500 cursor-not-allowed selection:bg-transparent"
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
          </div>

        </div>
      </div>
    </div>
  );
}