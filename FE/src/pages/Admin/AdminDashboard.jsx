import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Các state hệ thống
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' hoặc 'categories'
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State quản lý số liệu thống kê
  const [dbCounts, setDbCounts] = useState({ categories: 0, collections: 0, docs: 0 });

  // --- THÀNH PHẦN 1: STATE QUẢN LÝ TÀI KHOẢN ---
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'INSTRUCTOR' });
  const [showUserForm, setShowUserForm] = useState(false); // Điều khiển ẩn hiện Form User

  // --- THÀNH PHẦN 2: STATE QUẢN LÝ CATEGORY TABS (PROJECTS) ---
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ id: null, title: '', instructorIds: [] });
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false); // Điều khiển ẩn hiện Form Category

  // Hàm load đồng bộ dữ liệu Admin
  const refreshAdminData = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // 1. Đọc trực tiếp danh sách Users từ mock database để quản lý
      const localUsers = localStorage.getItem('mock_db_users');
      const userList = localUsers ? JSON.parse(localUsers) : [];
      setUsers(userList);

      // 2. Đọc danh sách Categories (Chính là các Projects trong mockApi)
      const localProjects = localStorage.getItem('mock_db_projects');
      const projectList = localProjects ? JSON.parse(localProjects) : [];
      setCategories(projectList);

      // 3. Tính toán các thông số thống kê dựa theo LocalStorage và API
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
      setMessage({ type: 'error', text: 'Failed to synchronize system tables.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  // Handler xử lý khi click chọn/bỏ chọn checkbox Giảng viên
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

  // ========================================================
  // XỬ LÝ QUẢN LÝ TÀI KHOẢN
  // ========================================================
  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.password) {
      setMessage({ type: 'error', text: 'Please fill out all required account fields.' });
      return;
    }

    const currentUsers = [...users];

    if (currentUsers.some(u => u.email.toLowerCase() === userForm.email.toLowerCase())) {
      setMessage({ type: 'error', text: 'This email is already linked to another account!' });
      return;
    }

    const newId = currentUsers.length > 0 ? Math.max(...currentUsers.map(u => u.id)) + 1 : 1;
    currentUsers.push({
      id: newId,
      firstName: userForm.firstName,
      lastName: userForm.lastName,
      email: userForm.email,
      password: userForm.password,
      role: 'INSTRUCTOR'
    });

    setMessage({ type: 'success', text: 'Successfully provisioned new Faculty Instructor account!' });
    localStorage.setItem('mock_db_users', JSON.stringify(currentUsers));
    setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'INSTRUCTOR' });
    setShowUserForm(false);
    refreshAdminData();
  };

  // ========================================================
  // XỬ LÝ QUẢN LÝ CATEGORIES / TABS CHO INSTRUCTOR
  // ========================================================
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryForm.title) {
      setMessage({ type: 'error', text: 'Category Title cannot be empty.' });
      return;
    }
    if (categoryForm.instructorIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one Instructor to grant access.' });
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
        setMessage({ type: 'success', text: 'Category tab configuration updated!' });
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
      setMessage({ type: 'success', text: 'New category tab generated successfully!' });
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
    if (window.confirm("Erasing this category might cause reference collections to lose their mapping. Continue?")) {
      const updated = categories.filter(c => c.id !== catId);
      localStorage.setItem('mock_db_projects', JSON.stringify(updated));
      setMessage({ type: 'success', text: 'Category tab eliminated.' });
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

    if (idsToFind.length === 0) return <span className="text-rose-500">No instructors assigned</span>;

    const assignedUsers = users.filter(u => idsToFind.includes(Number(u.id)));
    if (assignedUsers.length === 0) return <span className="text-gray-400">IDs: {idsToFind.join(', ')}</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {assignedUsers.map(u => (
          <span key={u.id} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-100">
            {u.firstName} {u.lastName}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
      
      {/* HEADER SECTION */}
      <header className="bg-[#1e3a8a] text-white border-b border-[#152e75] sticky top-0 z-10 shadow-sm">
        <div className="w-full px-8 h-16 flex items-center justify-between">
          <div onClick={() => navigate('/')} className="flex items-center space-x-3 cursor-pointer hover:text-blue-100 transition-colors">
            <span className="font-bold text-xl tracking-wider">Evidence Pilot</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-blue-50 tracking-wide uppercase">Administrator Mode</span>
            </div>
            <button onClick={() => navigate('/')} className="text-sm font-medium text-blue-200 hover:text-white transition">Home</button>
            <Link to="/admin/profile" className="text-sm font-medium text-blue-200 hover:text-white transition">Admin Profile</Link>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm font-medium text-blue-200 hover:text-white transition">Sign Out</button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto p-8">
        
        {/* TOP TITLE */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e3a8a] tracking-tight">Administrator Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Configure credentials, provision faculty workspaces, and manage structural category definitions.</p>
          </div>
        </div>

        {/* NOTIFICATION TOAST BAR */}
        {message.text && (
          <div className={`p-4 mb-6 rounded-xl border text-xs font-bold transition flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400 font-bold animate-pulse">
            Synchronizing administrative dashboard matrices...
          </div>
        ) : (
          <>
            {/* NUMERICAL COUNTERS METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Category Tabs</span>
                <div className="text-3xl font-black text-indigo-600 mt-2">
                  {dbCounts.categories} <span className="text-xs text-gray-400 font-normal">{dbCounts.categories === 1 ? 'tab' : 'tabs'}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Collections</span>
                <div className="text-3xl font-black text-purple-600 mt-2">
                  {dbCounts.collections} <span className="text-xs text-gray-400 font-normal">{dbCounts.collections === 1 ? 'collection' : 'collections'}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Reference PDFs</span>
                <div className="text-3xl font-black text-amber-600 mt-2">
                  {dbCounts.docs} <span className="text-xs text-gray-400 font-normal">{dbCounts.docs === 1 ? 'file' : 'files'}</span>
                </div>
              </div>
            </div>

            {/* SEGMENTED TAB CONTROLLERS */}
            <div className="flex space-x-2 border-b border-gray-200 mb-6">
              <button 
                onClick={() => setActiveTab('users')} 
                className={`px-5 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeTab === 'users' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                👥 Accounts Registry ({users.length})
              </button>
              <button 
                onClick={() => setActiveTab('categories')} 
                className={`px-5 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${activeTab === 'categories' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                🗂️ Category ({categories.length})
              </button>
            </div>

            {/* TAB CONTENT PANEL 1: USER ACCOUNT MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button 
                    onClick={() => { setShowUserForm(!showUserForm); setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'INSTRUCTOR' }); }}
                    className="px-4 py-2 bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    {showUserForm ? '✖ Close Form' : '➕ Create Instructor Account'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* ACCOUNT PROVISIONING FORM */}
                  {showUserForm && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
                      <h3 className="text-sm font-black text-[#1e3a8a] mb-4 uppercase tracking-wide">
                        Create Instructor Account
                      </h3>
                      <form onSubmit={handleUserSubmit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">First Name</label>
                            <input type="text" className="w-full p-2.5 bg-gray-50 border rounded-lg focus:outline-[#1e3a8a]" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} required/>
                          </div>
                          <div>
                            <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Last Name</label>
                            <input type="text" className="w-full p-2.5 bg-gray-50 border rounded-lg focus:outline-[#1e3a8a]" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} required/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Email</label>
                          <input type="email" className="w-full p-2.5 bg-gray-50 border rounded-lg focus:outline-[#1e3a8a]" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required/>
                        </div>
                        
                        {/* CHỖ NÀY ĐÃ ĐỔI TYPE THÀNH "password" ĐỂ HIỂN THỊ DẤU CHẤM */}
                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Password</label>
                          <input type="password" className="w-full p-2.5 bg-gray-50 border rounded-lg focus:outline-[#1e3a8a]" placeholder="••••••••" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required/>
                        </div>

                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Assigned Authority Scope</label>
                          <div className="w-full p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 font-bold">
                            INSTRUCTOR
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <button type="submit" className="flex-1 py-2.5 bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold rounded-lg transition">
                            Create
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* USER ACCOUNTS TABLE */}
                  <div className={`${showUserForm ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                            <th className="p-4">Clustered Subject Name & Access Scope</th>
                            <th className="p-4">Identity Email Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${u.role === 'ADMIN' ? 'bg-rose-500' : u.role === 'INSTRUCTOR' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                    {u.role?.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 flex items-center space-x-2">
                                      <span>{u.firstName} {u.lastName}</span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${u.role === 'ADMIN' ? 'bg-rose-50 text-rose-700' : u.role === 'INSTRUCTOR' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                        [{u.role}]
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-gray-600">{u.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT PANEL 2: CATEGORY WORKSPACE MANAGEMENT */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button 
                    onClick={() => { setShowCategoryForm(!showCategoryForm); setIsEditingCategory(false); setCategoryForm({ id: null, title: '', instructorIds: [] }); }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    {showCategoryForm ? '✖ Close Form' : '➕ Create Category Tab'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* CATEGORY OPERATION FORM */}
                  {showCategoryForm && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
                      <h3 className="text-sm font-black text-[#1e3a8a] mb-4 uppercase tracking-wide">
                        {isEditingCategory ? 'Category Tab' : 'Create Category Tab'}
                      </h3>
                      <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Title</label>
                          <input type="text" className="w-full p-2.5 bg-gray-50 border rounded-lg focus:outline-[#1e3a8a] font-bold" placeholder="e.g., Nghiên cứu Kinh tế học" value={categoryForm.title} onChange={e => setCategoryForm({...categoryForm, title: e.target.value})} required/>
                        </div>
                        
                        <div>
                          <label className="block text-gray-500 font-bold mb-2 uppercase tracking-wider text-[9px]">
                            Assign Instructors (Only selected will have this category)
                          </label>
                          <div className="bg-gray-50 border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                            {users.filter(u => u.role === 'INSTRUCTOR').map(ins => {
                              const isChecked = categoryForm.instructorIds.includes(Number(ins.id));
                              return (
                                <label key={ins.id} className="flex items-center space-x-2.5 cursor-pointer p-1 rounded hover:bg-gray-100 transition">
                                  <input 
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    checked={isChecked}
                                    onChange={() => handleInstructorCheckboxChange(Number(ins.id))}
                                  />
                                  <div className="flex flex-col text-xs">
                                    <span className="font-bold text-gray-800">{ins.firstName} {ins.lastName}</span>
                                    <span className="text-gray-400 text-[10px] font-mono">{ins.email}</span>
                                  </div>
                                </label>
                              );
                            })}
                            {users.filter(u => u.role === 'INSTRUCTOR').length === 0 && (
                              <div className="text-gray-400 text-center py-2">No instructors available inside database.</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">
                            {isEditingCategory ? 'Update' : 'Create'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* CATEGORIES STRUCTURAL DATA TABLE */}
                  <div className={`${showCategoryForm ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                            <th className="p-4">Title</th>
                            <th className="p-4">Assigned Instructors</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {categories.map(cat => (
                            <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                              <td className="p-4">
                                <div className="font-bold text-gray-900 text-sm">{cat.title || cat.name}</div>
                                <div className="text-[10px] text-indigo-500 font-mono mt-1">ID Ref: {cat.id}</div>
                              </td>
                              <td className="p-4">
                                {renderInstructorNames(cat)}
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button onClick={() => handleEditCategory(cat)} className="px-2.5 py-1.5 bg-gray-50 border text-indigo-600 hover:bg-indigo-50 font-bold rounded-lg transition">Edit</button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="px-2.5 py-1.5 bg-gray-50 border text-rose-600 hover:bg-rose-50 font-bold rounded-lg transition">Delete</button>
                              </td>
                            </tr>
                          ))}
                          {categories.length === 0 && (
                            <tr>
                              <td colSpan="3" className="p-8 text-center text-gray-400">No active structural category tabs compiled inside registry.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}