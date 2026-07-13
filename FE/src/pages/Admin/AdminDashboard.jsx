import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  
  // Trạng thái chung
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return localStorage.getItem('admin_active_tab') || 'dashboard';
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trạng thái dữ liệu hệ thống
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dbCounts, setDbCounts] = useState({ categories: 0, collections: 0, docs: 0 });

  // Bộ chọn thời gian trong Giám sát tài nguyên
  const [timeRange, setTimeRange] = useState('24h'); // '24h' hoặc '7d'

  // Trạng thái cấu hình hệ thống (Tương tác thật qua State & LocalStorage)
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('cfg_maintenance') === 'true');
  const [automatedBackups, setAutomatedBackups] = useState(() => localStorage.getItem('cfg_backups') !== 'false');
  const [securityAuditLog, setSecurityAuditLog] = useState(() => localStorage.getItem('cfg_audit_log') !== 'false');



  // Trạng thái Form quản lý
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'INSTRUCTOR', status: 'Active' });
  const [showUserForm, setShowUserForm] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ id: null, title: '', instructorIds: [] });
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Profile tab form states
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileFirstName(user.firstName || '');
      setProfileLastName(user.lastName || '');
      const savedEmail = localStorage.getItem(`override_email_${user.id}`);
      setProfileEmail(savedEmail || user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileFirstName.trim()) {
      setMessage({ type: 'error', text: 'First name cannot be blank.' });
      return;
    }
    if (!profileEmail.trim()) {
      setMessage({ type: 'error', text: 'Email cannot be blank.' });
      return;
    }

    setProfileSubmitting(true);
    setMessage({ type: '', text: '' });

    const formPayload = {
      firstName: profileFirstName.trim(),
      lastName: profileLastName.trim(),
      email: profileEmail.trim()
    };

    try {
      const response = await api.put('/api/users/me', formPayload);
      const backendData = response.data || {};
      
      const userId = user?.id || backendData.id;
      if (userId) {
        localStorage.setItem(`override_email_${userId}`, formPayload.email);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      refreshAdminData();
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Tải đồng bộ dữ liệu từ localStorage
  const refreshAdminData = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // 1. Tải danh sách Users
      const localUsers = localStorage.getItem('mock_db_users');
      const userList = localUsers ? JSON.parse(localUsers) : [];
      setUsers(userList);

      // 2. Tải danh sách Categories (Projects)
      const localProjects = localStorage.getItem('mock_db_projects');
      const projectList = localProjects ? JSON.parse(localProjects) : [];
      setCategories(projectList);

      // 3. Tính toán số liệu thống kê
      const localCols = localStorage.getItem('mock_db_collections');
      const totalCollections = localCols ? JSON.parse(localCols) : [];

      const localDocs = localStorage.getItem('mock_db_referenceDocuments');
      const documentList = localDocs ? JSON.parse(localDocs) : [];
      const validCollectionIds = totalCollections.map(c => String(c.id));
      const totalValidDocs = documentList.filter(
        doc => validCollectionIds.includes(String(doc.collectionId))
      ).length;

      setDbCounts({
        categories: projectList.length,
        collections: totalCollections.length,
        docs: totalValidDocs
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
      setMessage({ type: 'error', text: 'Syncing administration data failed.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Thay đổi cấu hình bảo trì
  const handleToggleMaintenance = () => {
    setMaintenanceMode(prev => {
      const next = !prev;
      localStorage.setItem('cfg_maintenance', String(next));
      return next;
    });
  };

  // Thay đổi cấu hình sao lưu
  const handleToggleBackups = () => {
    setAutomatedBackups(prev => {
      const next = !prev;
      localStorage.setItem('cfg_backups', String(next));
      return next;
    });
  };

  // Thay đổi cấu hình nhật ký bảo mật
  const handleToggleAuditLog = () => {
    setSecurityAuditLog(prev => {
      const next = !prev;
      localStorage.setItem('cfg_audit_log', String(next));
      return next;
    });
  };



  // Trạng thái Form quản lý mở rộng
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Bộ lọc giảng viên
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [appliedStatus, setAppliedStatus] = useState('All Statuses');

  // Khởi chạy chế độ chỉnh sửa User
  const handleEditUserClick = (u) => {
    setUserForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || 'INSTRUCTOR',
      status: u.status || 'Active'
    });
    setIsEditingUser(true);
    setEditingUserId(u.id);
    setShowUserForm(true);
  };

  // Toggle user account active status
  const handleToggleUserStatus = (u) => {
    const nextStatus = (u.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    const updatedUsers = users.map(user => {
      if (user.id === u.id) {
        return { ...user, status: nextStatus };
      }
      return user;
    });
    localStorage.setItem('mock_db_users', JSON.stringify(updatedUsers));
    setMessage({ type: 'success', text: `${u.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'} status toggled to ${nextStatus === 'Active' ? 'Active' : 'Inactive'} successfully!` });
    refreshAdminData();
  };

  // Delete user account
  const handleDeleteUser = (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (window.confirm(`Are you sure you want to delete ${userToDelete.role === 'INSTRUCTOR' ? 'instructor' : 'student'} account "${userToDelete.firstName} ${userToDelete.lastName}"? This action cannot be undone.`)) {
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('mock_db_users', JSON.stringify(updatedUsers));
      setMessage({ type: 'success', text: `${userToDelete.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'} account deleted successfully.` });
      refreshAdminData();
    }
  };

  // Process user creation / update (Instructor or Student)
  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userForm.firstName || !userForm.lastName || !userForm.email) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }
    if (!isEditingUser && !userForm.password) {
      setMessage({ type: 'error', text: 'Password cannot be empty.' });
      return;
    }

    const currentUsers = [...users];

    // Check email uniqueness
    if (currentUsers.some(u => u.id !== editingUserId && u.email.toLowerCase() === userForm.email.toLowerCase())) {
      setMessage({ type: 'error', text: 'This email is already associated with another account!' });
      return;
    }

    const targetRole = userForm.role || 'INSTRUCTOR';
    const roleText = targetRole === 'INSTRUCTOR' ? 'instructor' : 'student';

    if (isEditingUser) {
      const updatedUsers = currentUsers.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            password: userForm.password || u.password,
            status: userForm.status || 'Active'
          };
        }
        return u;
      });
      localStorage.setItem('mock_db_users', JSON.stringify(updatedUsers));
      setMessage({ type: 'success', text: `${roleText.charAt(0).toUpperCase() + roleText.slice(1)} account updated successfully!` });
      setIsEditingUser(false);
      setEditingUserId(null);
    } else {
      const newId = currentUsers.length > 0 ? Math.max(...currentUsers.map(u => u.id)) + 1 : 1;
      currentUsers.push({
        id: newId,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        password: userForm.password,
        role: targetRole,
        status: userForm.status || 'Active'
      });
      localStorage.setItem('mock_db_users', JSON.stringify(currentUsers));
      setMessage({ type: 'success', text: `${roleText.charAt(0).toUpperCase() + roleText.slice(1)} account created successfully!` });
    }

    setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'INSTRUCTOR', status: 'Active' });
    setShowUserForm(false);
    refreshAdminData();
  };

  // Xử lý Checkbox Giảng viên của Category Form
  const handleInstructorCheckboxChange = (instructorId) => {
    const currentIds = [...categoryForm.instructorIds];
    if (currentIds.includes(instructorId)) {
      setCategoryForm({
        ...categoryForm,
        instructorIds: currentIds.filter(id => id !== instructorId)
      });
    } else {
      setCategoryForm({
        ...categoryForm,
        instructorIds: [...currentIds, instructorId]
      });
    }
  };

  // Process category creation / edit
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryForm.title) {
      setMessage({ type: 'error', text: 'Category title cannot be empty.' });
      return;
    }
    if (categoryForm.instructorIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one assigned instructor.' });
      return;
    }

    const currentProjects = [...categories];
    const finalInstructorIds = categoryForm.instructorIds.map(id => Number(id));

    if (isEditingCategory) {
      const idx = currentProjects.findIndex(p => p.id === categoryForm.id);
      if (idx !== -1) {
        currentProjects[idx] = {
          ...currentProjects[idx],
          title: categoryForm.title,
          name: categoryForm.title,
          instructorIds: finalInstructorIds,
          instructorId: finalInstructorIds[0]
        };
        setMessage({ type: 'success', text: 'Category configuration updated successfully!' });
      }
    } else {
      const newProjId = 'proj-' + Math.random().toString(36).substr(2, 9);
      currentProjects.push({
        id: newProjId,
        title: categoryForm.title,
        name: categoryForm.title,
        description: '',
        ownerId: 1,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        instructorIds: finalInstructorIds,
        instructorId: finalInstructorIds[0],
        members: [{ email: 'student@evidencepilot.edu', role: 'PL' }]
      });
      setMessage({ type: 'success', text: 'New category created successfully!' });
    }

    localStorage.setItem('mock_db_projects', JSON.stringify(currentProjects));
    setCategoryForm({ id: null, title: '', instructorIds: [] });
    setIsEditingCategory(false);
    setShowCategoryForm(false);
    refreshAdminData();
  };

  const handleEditCategory = (cat) => {
    let initialIds = [];
    if (cat.instructorIds && Array.isArray(cat.instructorIds)) {
      initialIds = cat.instructorIds.map(id => Number(id));
    } else if (cat.instructorId) {
      initialIds = [Number(cat.instructorId)];
    }

    setCategoryForm({
      id: cat.id,
      title: cat.title || cat.name || '',
      instructorIds: initialIds
    });
    setIsEditingCategory(true);
    setShowCategoryForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleDeleteCategory = (catId) => {
    if (window.confirm("Deleting this category may affect students' assigned projects. Continue?")) {
      const updated = categories.filter(c => c.id !== catId);
      localStorage.setItem('mock_db_projects', JSON.stringify(updated));
      setMessage({ type: 'success', text: 'Category deleted successfully.' });
      refreshAdminData();
    }
  };

  const renderInstructorNames = (cat) => {
    let idsToFind = [];
    if (cat.instructorIds && Array.isArray(cat.instructorIds)) {
      idsToFind = cat.instructorIds.map(id => Number(id));
    } else if (cat.instructorId) {
      idsToFind = [Number(cat.instructorId)];
    }

    if (idsToFind.length === 0) return <span className="text-rose-500 font-medium">Unassigned</span>;

    const assignedUsers = users.filter(u => idsToFind.includes(Number(u.id)));
    if (assignedUsers.length === 0) return <span className="text-slate-400">Instructor IDs: {idsToFind.join(', ')}</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {assignedUsers.map(u => (
          <span key={u.id} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
            {u.firstName} {u.lastName}
          </span>
        ))}
      </div>
    );
  };

  // Tính toán số lượng hiển thị dựa theo quy mô lớn (giống ảnh mẫu)
  const studentCount = users.filter(u => u.role === 'STUDENT').length;
  const instructorCount = users.filter(u => u.role === 'INSTRUCTOR').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  const displayStudents = 8430 + studentCount;
  const displayInstructors = 450 + instructorCount;
  const displayAdmins = adminCount;

  // Lọc dữ liệu tìm kiếm (Tách riêng Instructors và Students, bỏ Admin, áp dụng bộ lọc Khoa & Trạng thái)
  const filteredInstructors = users.filter(u => {
    if (u.role !== 'INSTRUCTOR') return false;

    // No department check

    // Bộ lọc Trạng thái tài khoản
    if (appliedStatus !== 'All Statuses') {
      const status = u.status || 'Active';
      if (status !== appliedStatus) return false;
    }

    const query = searchQuery.toLowerCase();
    return (
      (u.firstName || '').toLowerCase().includes(query) ||
      (u.lastName || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    );
  });

  const filteredStudents = users.filter(u => {
    if (u.role !== 'STUDENT') return false;
    const query = searchQuery.toLowerCase();
    return (
      (u.firstName || '').toLowerCase().includes(query) ||
      (u.lastName || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    );
  });

  const filteredCategories = categories.filter(c => {
    const query = searchQuery.toLowerCase();
    const title = c.title || c.name || '';
    return title.toLowerCase().includes(query) || c.id.toLowerCase().includes(query);
  });

  const adminName = user ? `${user.firstName} ${user.lastName}` : "Hệ thống Admin";
  const adminEmail = user ? user.email : "admin@evidencepilot.edu";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
      
      {/* 1. SIDEBAR BIÊN TRÁI (LEFT SIDEBAR) */}
      <aside className="w-72 bg-white border-r border-slate-200/60 text-slate-800 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
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
              onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Projects / Categories</span>
            </button>

            <button
              onClick={() => { setActiveTab('instructors'); setSearchQuery(''); setShowUserForm(false); }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'instructors'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m-6 4h3" />
              </svg>
              <span>Instructor Accounts</span>
            </button>

            <button
              onClick={() => { setActiveTab('students'); setSearchQuery(''); setShowUserForm(false); }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
              <span>Student Accounts</span>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setSearchQuery(''); setShowUserForm(false); }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center text-sm shadow-inner shadow-black/10">
              {adminName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-white truncate leading-tight">{adminName}</span>
              <span className="block text-[10px] text-blue-200 font-semibold uppercase tracking-wider">System Root</span>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full py-2 bg-white/10 hover:bg-rose-600 text-blue-100 hover:text-white border border-white/10 hover:border-transparent rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. CHỨA TOÀN BỘ NỘI DUNG CHÍNH PHÍA PHẢI */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-18 border-b border-[#152e75] bg-[#1e3a8a] text-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-md">
          {/* Left placeholder to preserve flex layout */}
          <div />

          {/* Right Header Controls */}
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-3.5 border-r border-white/20 pr-5">
              <div className="relative cursor-pointer p-1.5 hover:bg-white/10 rounded-lg transition" title="Thông báo">
                <svg className="w-5 h-5 text-blue-200 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <div className="cursor-pointer p-1.5 hover:bg-white/10 rounded-lg transition" title="Trợ giúp">
                <svg className="w-5 h-5 text-blue-200 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Version status */}
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold text-blue-200 tracking-wide font-mono">V2.4.0</span>
              <span className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>System Stable</span>
              </span>
            </div>
          </div>
        </header>

        {/* 3. NỘI DUNG CHÍNH (MAIN WRAPPER) */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Thông báo Toast nếu có */}
          {message.text && (
            <div className={`p-4 mb-6 rounded-2xl border text-xs font-bold transition flex items-center justify-between animate-in slide-in-from-top duration-300 ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm shadow-emerald-50/50' : 'bg-rose-50 border-rose-100 text-rose-700 shadow-sm shadow-rose-50/50'
            }`}>
              <div className="flex items-center space-x-2.5">
                <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{message.text}</span>
              </div>
              <button onClick={() => setMessage({ type: '', text: '' })} className="hover:opacity-70 text-slate-400 font-black">✕</button>
            </div>
          )}



          {loading ? (
            <div className="text-center py-20 text-slate-400 font-semibold animate-pulse flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin"></div>
              <span className="text-xs">Đang đồng bộ hóa dữ liệu quản trị...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD (TỔNG QUAN HỆ THỐNG) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {/* Platform Operations Title & Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Platform Operations</h1>
                      <p className="text-xs font-semibold text-slate-500 mt-2">Technical overview of infrastructure and synthesis pipelines.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setMessage({ type: 'success', text: 'Báo cáo hạ tầng kỹ thuật đã xuất thành công (Mock JSON Download).' })}
                        className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Export Report</span>
                      </button>

                    </div>
                  </div>

                  {/* Row of 3 Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Storage */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-36">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Storage (S3)</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                      </div>
                      <div className="my-2">
                        <span className="text-3xl font-black text-slate-900 leading-none">12.4 <span className="text-lg font-bold text-slate-500">TB</span></span>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-slate-800 h-full rounded-full" style={{ width: '72%' }}></div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">72% of total capacity utilized</span>
                      </div>
                    </div>

                    {/* Card 2: API Response */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-36">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">API Response (LLM)</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="my-2">
                        <span className="text-3xl font-black text-slate-900 leading-none">842 <span className="text-lg font-bold text-slate-500">ms</span></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 leading-none">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>+12% vs last 24h</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mt-1">P95 latency benchmark</span>
                      </div>
                    </div>

                    {/* Card 3: Active Sessions */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-36">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Sessions</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="my-2">
                        <span className="text-3xl font-black text-slate-900 leading-none">1,102</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {/* Profile bubbles overlapping */}
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <div className="w-5.5 h-5.5 rounded-full bg-slate-800 text-white font-bold text-[8px] flex items-center justify-center border border-white">JD</div>
                          <div className="w-5.5 h-5.5 rounded-full bg-indigo-600 text-white font-bold text-[8px] flex items-center justify-center border border-white">AS</div>
                          <div className="w-5.5 h-5.5 rounded-full bg-emerald-600 text-white font-bold text-[8px] flex items-center justify-center border border-white">BK</div>
                          <div className="w-5.5 h-5.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[8px] flex items-center justify-center border border-white">+9</div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Concurrent instances</span>
                      </div>
                    </div>

                  </div>

                  {/* Grid Layout: User Management (Left) & Monitoring / Configuration (Right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* User Management block (Left Span 1) */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight mb-5 uppercase tracking-wider text-xs text-slate-400">User Management</h2>
                        <div className="space-y-4">
                          
                          {/* Item 1: Students */}
                          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate-800">Students</span>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Verified Academic</span>
                              </div>
                            </div>
                            <span className="text-lg font-black text-slate-900">{displayStudents.toLocaleString()}</span>
                          </div>

                          {/* Item 2: Instructors */}
                          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate-800">Instructors</span>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Grant Level</span>
                              </div>
                            </div>
                            <span className="text-lg font-black text-slate-900">{displayInstructors.toLocaleString()}</span>
                          </div>

                          {/* Item 3: Administrators */}
                          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-slate-800">Administrators</span>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Org Wide</span>
                              </div>
                            </div>
                            <span className="text-lg font-black text-slate-900">{displayAdmins.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Workspace Permissions */}
                      <div className="mt-8 border-t border-slate-100 pt-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3.5 block">Workspace Permissions</span>
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600">Global Public Access</span>
                            <span className="bg-rose-50 text-rose-600 border border-rose-100 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">Restricted</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600">Federated Auth (SSO)</span>
                            <span className="bg-[#0f172a]/5 text-slate-800 border border-slate-200 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monitoring & Configuration (Right Span 2) */}
                    <div className="lg:col-span-2 space-y-8">
                      
                      {/* Resource Monitoring Card */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resource Monitoring</h2>
                          {/* 24h / 7d pills selector */}
                          <div className="bg-slate-100 rounded-xl p-0.5 flex">
                            <button
                              onClick={() => setTimeRange('24h')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                                timeRange === '24h' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              24H
                            </button>
                            <button
                              onClick={() => setTimeRange('7d')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                                timeRange === '7d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              7D
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                          {/* LLM Token Usage Graph */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">LLM Token Usage (Daily)</span>
                            {/* Bar Chart bars */}
                            <div className="flex items-end justify-between h-28 px-1 pb-1 border-b border-slate-100">
                              <div className="flex flex-col items-center w-6 gap-2">
                                <div className="w-full bg-slate-100 hover:bg-slate-200 transition rounded-md h-12"></div>
                                <span className="text-[8px] font-bold text-slate-400">T2</span>
                              </div>
                              <div className="flex flex-col items-center w-6 gap-2">
                                <div className="w-full bg-slate-100 hover:bg-slate-200 transition rounded-md h-16"></div>
                                <span className="text-[8px] font-bold text-slate-400">T3</span>
                              </div>
                              <div className="flex flex-col items-center w-6 gap-2">
                                <div className="w-full bg-slate-100 hover:bg-slate-200 transition rounded-md h-20"></div>
                                <span className="text-[8px] font-bold text-slate-400">T4</span>
                              </div>
                              <div className="flex flex-col items-center w-6 gap-2">
                                <div className="w-full bg-indigo-600 rounded-md h-24 shadow-sm shadow-indigo-100"></div>
                                <span className="text-[8px] font-bold text-slate-700">T5</span>
                              </div>
                              <div className="flex flex-col items-center w-6 gap-2">
                                <div className="w-full bg-slate-100 hover:bg-slate-200 transition rounded-md h-10"></div>
                                <span className="text-[8px] font-bold text-slate-400">T6</span>
                              </div>
                              <div className="flex flex-col items-center w-6 gap-2">
                                <div className="w-full bg-slate-100 hover:bg-slate-200 transition rounded-md h-8"></div>
                                <span className="text-[8px] font-bold text-slate-400">T7</span>
                              </div>
                              <div className="flex flex-col items-center w-6 gap-2">
                                <div className="w-full bg-slate-100 hover:bg-slate-200 transition rounded-md h-14"></div>
                                <span className="text-[8px] font-bold text-slate-400">CN</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-3 text-xs">
                              <span className="font-extrabold text-slate-800">Total Today: 1.2M tokens</span>
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">+5% avg</span>
                            </div>
                          </div>

                          {/* Upload Volume */}
                          <div className="space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Upload Volume (Files)</span>
                            
                            {/* PDF Synthesis */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-700">
                                <span>PDF Synthesis</span>
                                <span>4.5 GB</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-[#0f172a] h-full rounded-full" style={{ width: '85%' }}></div>
                              </div>
                            </div>

                            {/* Dataset Imports */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-700">
                                <span>Dataset Imports</span>
                                <span>1.2 GB</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-[#0f172a] h-full rounded-full" style={{ width: '32%' }}></div>
                              </div>
                            </div>

                            {/* Image Extractions */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-700">
                                <span>Image Extractions</span>
                                <span>0.8 GB</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-[#0f172a] h-full rounded-full" style={{ width: '15%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Configuration Card */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">System Configuration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Toggle 1: Maintenance Mode */}
                          <div className="border border-slate-100 hover:border-slate-200 transition p-4 rounded-xl flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <span className="block text-xs font-bold text-slate-800 leading-tight">Maintenance Mode</span>
                              <span className="block text-[10px] text-slate-400 font-semibold mt-1">Offline for users</span>
                            </div>
                            <button
                              onClick={handleToggleMaintenance}
                              className={`w-9 h-5 rounded-full shrink-0 relative transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none ${
                                maintenanceMode ? 'bg-indigo-600' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out absolute top-0.5 left-0.5 ${
                                  maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Toggle 2: Automated Backups */}
                          <div className="border border-slate-100 hover:border-slate-200 transition p-4 rounded-xl flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <span className="block text-xs font-bold text-slate-800 leading-tight">Automated Backups</span>
                              <span className="block text-[10px] text-slate-400 font-semibold mt-1">Every 6 hours</span>
                            </div>
                            <button
                              onClick={handleToggleBackups}
                              className={`w-9 h-5 rounded-full shrink-0 relative transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none ${
                                automatedBackups ? 'bg-indigo-600' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out absolute top-0.5 left-0.5 ${
                                  automatedBackups ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Toggle 3: Security Audit Log */}
                          <div className="border border-slate-100 hover:border-slate-200 transition p-4 rounded-xl flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <span className="block text-xs font-bold text-slate-800 leading-tight">Security Audit Log</span>
                              <span className="block text-[10px] text-slate-400 font-semibold mt-1">Verbose level</span>
                            </div>
                            <button
                              onClick={handleToggleAuditLog}
                              className={`w-9 h-5 rounded-full shrink-0 relative transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none ${
                                securityAuditLog ? 'bg-indigo-600' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out absolute top-0.5 left-0.5 ${
                                  securityAuditLog ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INSTRUCTORS MANAGEMENT (QUẢN LÝ GIẢNG VIÊN - THEO MOCKUP) */}
              {activeTab === 'instructors' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Header Title & Subtitle */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Instructor Management</h1>
                      <p className="text-xs text-slate-500 mt-2">
                        Monitor and manage access for faculty members and research leads within the EvidencePilot ecosystem.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingUser(false);
                        setEditingUserId(null);
                        setShowUserForm(!showUserForm || userForm.role !== 'INSTRUCTOR');
                        setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'INSTRUCTOR', status: 'Active' });
                      }}
                      className="px-4.5 py-2.5 bg-[#1e3a8a] hover:bg-[#152e75] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-2 cursor-pointer"
                    >
                      <span>➕</span>
                      <span>Add New Instructor</span>
                    </button>
                  </div>

                  {/* Filters & Stats row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    
                    {/* Left: Filter card */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">Search Name or Email</label>
                          <input 
                            type="text" 
                            placeholder="Search instructor by name or email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">Account Status</label>
                          <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                          >
                            <option value="All Statuses">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => {
                            setAppliedStatus(filterStatus);
                            setMessage({ type: 'success', text: 'Filters applied successfully!' });
                          }}
                          className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>

                    {/* Right: Stat card */}
                    <div className="bg-[#1e3a8a] text-white p-5 rounded-2xl flex flex-col justify-between shadow-sm min-h-[120px]">
                      <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">Total Instructors</span>
                      <div className="my-1">
                        <span className="text-4xl font-black">{users.filter(u => u.role === 'INSTRUCTOR').length}</span>
                      </div>
                      <span className="text-[10px] text-blue-200 font-semibold">+3 this month</span>
                    </div>
                  </div>

                  {/* USER FORM MODAL (CREATE / EDIT INSTRUCTOR) */}
                  {showUserForm && userForm.role === 'INSTRUCTOR' && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl space-y-5 max-w-lg w-full p-6 relative animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <h3 className="text-sm font-black text-indigo-700 uppercase tracking-widest">
                            {isEditingUser ? 'Update Instructor Info' : 'Create New Instructor Account'}
                          </h3>
                          <button 
                            type="button" 
                            onClick={() => setShowUserForm(false)}
                            className="text-slate-400 hover:text-slate-600 text-lg font-black transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleUserSubmit} className="space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">First Name</label>
                              <input
                                type="text"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                                value={userForm.firstName}
                                onChange={e => setUserForm({ ...userForm, firstName: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">Last Name</label>
                              <input
                                type="text"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                                value={userForm.lastName}
                                onChange={e => setUserForm({ ...userForm, lastName: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">Email Address</label>
                              <input
                                type="email"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                                value={userForm.email}
                                onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">Password</label>
                              <input
                                type="password"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                                placeholder={isEditingUser ? "Leave blank to keep unchanged" : "••••••••"}
                                value={userForm.password}
                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                required={!isEditingUser}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">Status</label>
                              <select 
                                value={userForm.status || 'Active'}
                                onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 mt-4">
                            <button
                              type="button"
                              onClick={() => setShowUserForm(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-[#1e3a8a] hover:bg-[#152e75] text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
                            >
                              {isEditingUser ? 'Save Changes' : 'Create Account'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* INSTRUCTORS TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-4 pl-6">Instructor Name</th>
                            <th className="p-4">Active Projects</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredInstructors.map(u => {
                            const activeCount = categories.filter(p => p.instructorId === u.id || (p.instructorIds && p.instructorIds.includes(u.id))).length;
                            const isUserActive = (u.status || 'Active') === 'Active';

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4 pl-6">
                                  <div className="flex items-center space-x-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-black flex items-center justify-center border border-slate-200/40">
                                      {u.firstName?.charAt(0) || 'U'}{u.lastName?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-800">
                                        {u.firstName} {u.lastName}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium">
                                        {u.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-600 font-medium">
                                  <span className="font-black text-slate-800">{activeCount}</span> active
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isUserActive 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                    <span>{isUserActive ? 'Active' : 'Inactive'}</span>
                                  </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button 
                                      onClick={() => handleEditUserClick(u)}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition" 
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => handleToggleUserStatus(u)}
                                      className={`p-1.5 rounded-lg transition ${
                                        isUserActive 
                                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                                          : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                      }`}
                                      title={isUserActive ? "Suspend Account" : "Activate Account"}
                                    >
                                      {isUserActive ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                      )}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" 
                                      title="Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredInstructors.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-slate-400 font-bold">No instructors found matching the filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: STUDENT ACCOUNTS (QUẢN LÝ SINH VIÊN - ĐƠN GIẢN) */}
              {activeTab === 'students' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Accounts</h1>
                      <p className="text-xs text-slate-400 mt-1">List and credentials of student accounts registered on the system.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingUser(false);
                        setEditingUserId(null);
                        setShowUserForm(!showUserForm || userForm.role !== 'STUDENT');
                        setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT', status: 'Active' });
                      }}
                      className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#152e75] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      {showUserForm && userForm.role === 'STUDENT' ? (
                        <>
                          <span>✖</span>
                          <span>Close Form</span>
                        </>
                      ) : (
                        <>
                          <span>➕</span>
                          <span>Create Student Account</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Search Card for Students */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm max-w-md">
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">Search Name or Email</label>
                      <input 
                        type="text" 
                        placeholder="Search student by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* USER FORM (CREATE / EDIT FOR STUDENT) */}
                  {showUserForm && userForm.role === 'STUDENT' && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 max-w-2xl">
                      <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                        {isEditingUser ? 'Update Student Info' : 'Create New Student Account'}
                      </h3>
                      <form onSubmit={handleUserSubmit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">First Name</label>
                            <input
                              type="text"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                              value={userForm.firstName}
                              onChange={e => setUserForm({ ...userForm, firstName: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">Last Name</label>
                            <input
                              type="text"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                              value={userForm.lastName}
                              onChange={e => setUserForm({ ...userForm, lastName: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">Email Address</label>
                            <input
                              type="email"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                              value={userForm.email}
                              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1 text-[9px] uppercase tracking-wider">Password</label>
                            <input
                              type="password"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                              placeholder="••••••••"
                              value={userForm.password}
                              onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                              required={!isEditingUser}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowUserForm(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#1e3a8a] hover:bg-[#152e75] text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
                          >
                            {isEditingUser ? 'Save Changes' : 'Create Account'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* STUDENTS TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-4 pl-6">Student Name</th>
                            <th className="p-4">Email Address</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudents.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-4 pl-6">
                                <div className="flex items-center space-x-3.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white font-bold flex items-center justify-center shadow-sm">
                                    {u.firstName?.charAt(0) || 'S'}
                                  </div>
                                  <div className="font-bold text-slate-800">
                                    {u.firstName} {u.lastName}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-slate-500 font-medium">{u.email}</td>
                              <td className="p-4 pr-6 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button 
                                    onClick={() => {
                                      setUserForm({
                                        firstName: u.firstName || '',
                                        lastName: u.lastName || '',
                                        email: u.email || '',
                                        password: u.password || '',
                                        role: 'STUDENT',
                                        status: u.status || 'Active'
                                      });
                                      setIsEditingUser(true);
                                      setEditingUserId(u.id);
                                      setShowUserForm(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition" 
                                    title="Edit"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`p-1.5 rounded-lg transition ${
                                      (u.status || 'Active') === 'Active' 
                                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                                        : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                    }`}
                                    title={(u.status || 'Active') === 'Active' ? "Suspend Account" : "Activate Account"}
                                  >
                                    {(u.status || 'Active') === 'Active' ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                      </svg>
                                    )}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" 
                                    title="Delete"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      <line x1="10" y1="11" x2="10" y2="17" />
                                      <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan="3" className="p-8 text-center text-slate-400 font-bold">No students found matching the filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: PROJECTS / CATEGORIES (QUẢN LÝ DANH MỤC DỰ ÁN) */}
              {activeTab === 'categories' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight">Category tabs & Assigned Authority</h1>
                      <p className="text-xs text-slate-400 mt-1">View research directories and their assigned managing instructors.</p>
                    </div>
                  </div>

                  {/* Search Card for Categories */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm max-w-md">
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">Search Category Name or ID</label>
                      <input 
                        type="text" 
                        placeholder="Search category by name or ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* DANH SÁCH DANH MỤC */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="p-4">Category Name</th>
                              <th className="p-4">Assigned Instructors</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredCategories.map(cat => (
                              <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4">
                                  <div className="font-bold text-slate-800 text-sm leading-tight">{cat.title || cat.name}</div>
                                  <div className="text-[9px] text-indigo-500 font-mono mt-1 select-all">ID: {cat.id}</div>
                                </td>
                                <td className="p-4">
                                  {renderInstructorNames(cat)}
                                </td>
                              </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                              <tr>
                                <td colSpan="2" className="p-8 text-center text-slate-400 font-bold">No categories found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              )}
              {/* TAB: ADMIN PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="mb-8 border-b border-slate-200 pb-5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Admin Profile</h1>
                    <p className="text-xs font-semibold text-slate-500 mt-2">Manage root credentials, platform access privileges, and cryptographic keys.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* LEFT CARD */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-tr from-rose-600 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md animate-in zoom-in-95 duration-200">
                        {profileFirstName.charAt(0) || "A"}{profileLastName.charAt(0) || "A"}
                      </div>
                      
                      <div className="space-y-1 w-full">
                        <h2 className="font-black text-slate-800 text-base tracking-tight leading-tight">
                          {profileFirstName} {profileLastName}
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
                                type="text" value={profileFirstName} onChange={(e) => setProfileFirstName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">Last Name</label>
                              <input 
                                type="text" value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">Email Address</label>
                              <input 
                                type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">Password Hash</label>
                              <input 
                                type="text" value="••••••••" readOnly
                                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-400 cursor-not-allowed select-none focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-4">
                            <button 
                              type="submit" disabled={profileSubmitting}
                              className="px-6 py-3 bg-[#1e3a8a] hover:bg-[#152e75] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                            >
                              {profileSubmitting ? "Updating..." : "Save Identity Changes"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </main>

        {/* 4. FOOTER HỆ THỐNG PHÍA DƯỚI CHÂN */}
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