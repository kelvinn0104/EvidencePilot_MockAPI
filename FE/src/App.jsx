import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

import Profile from './pages/Profile.jsx';
import ReviewRequests from './pages/Instructor/ReviewRequests.jsx';
import CreateDataset from './pages/Instructor/CreateDataset.jsx';
import DatasetList from './pages/Instructor/DatasetList.jsx';
import InstructorDashboard from './pages/Instructor/Dashboard.jsx';
import StudentProjects from './pages/Student/Projects.jsx';
import Workspace from './pages/Student/Workspace.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          <Route path="/instructor/dashboard" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDashboard /></ProtectedRoute>
          } />
          <Route path="/instructor/requests" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><ReviewRequests /></ProtectedRoute>
          } />
          <Route path="/instructor/dataset" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><CreateDataset /></ProtectedRoute>
          } />
          <Route path="/instructor/datasets" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><DatasetList /></ProtectedRoute>
          } />
          <Route path="/student/projects" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><StudentProjects /></ProtectedRoute>
          } />
          <Route path="/student/projects/:projectId" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><Workspace /></ProtectedRoute>
          } />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
