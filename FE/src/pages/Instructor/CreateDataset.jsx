import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api.js';

export default function CreateDataset() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const res = await api.post('/api/datasets', { title, description });
      const datasetId = res.data.id;
      let uploadErrors = [];

      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          await api.post(`/api/datasets/${datasetId}/sources`, formData);
        } catch (fileErr) {
          uploadErrors.push(file.name);
          console.error(`Failed to upload ${file.name}:`, fileErr);
        }
      }

      if (uploadErrors.length > 0) {
        alert(`Dataset created, but ${uploadErrors.length} file(s) failed to upload:\n${uploadErrors.join('\n')}`);
      } else {
        alert('Dataset created successfully!');
      }
      navigate('/instructor/datasets');
    } catch (err) {
      console.error('Failed to create dataset:', err);
      alert(err.response?.data?.message || 'Failed to create dataset.');
    }

    setIsUploading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create New Dataset</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition font-medium text-sm border border-indigo-100"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 border border-gray-200 rounded-lg bg-gray-50/50">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">General Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dataset Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter dataset title..."
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Enter detailed description for this dataset..."
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="p-5 border border-gray-200 rounded-lg relative">
          {isUploading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                Uploading files...
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Source Files</h3>
            <label className={`px-4 py-2 rounded-md transition text-sm font-medium cursor-pointer ${isUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
              + Add Files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleAddFiles}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {files.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">No files selected. Add source files for this dataset.</p>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-3 truncate mr-2">
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isUploading || !title.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isUploading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
          {isUploading ? 'Uploading...' : 'Create Dataset'}
        </button>
      </form>
    </div>
  );
}
