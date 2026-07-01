import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FileViewerModal from '../../components/FileViewerModal';
import api from '../../api.js';
import { useLanguage } from '../../context/LanguageContext';
import { UI_TEXT } from '../../constants/uiText';

const DEFAULT_SAMPLE_LATEX = `\\documentclass{article}
\\usepackage[utf-8]{inputenc}
\\usepackage{xcolor}
\\usepackage{soul}

\\title{Evidence-Based Automated Traceability in Agile Software Engineering}
\\author{John Doe}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}
Agile software development depends on fast communication between stakeholders, product owners, and delivery teams. However, project risk increases when feedback loops are informal or delayed. 

\\hl{Agile methods combined with DevOps improve software delivery frequency.} By tracking the relationships between developer claims and underlying source document facts, we can build a formal network of evidence that satisfies regulatory audits and sprint feedback loops.

\\section{Team Collaboration and Ceremonies}
The Scrum guide establishes specific roles and ceremonies to build trust. Collaboration is key in modern development. Furthermore, \\hl{Daily standup meetings help identify technical blockers early.} Daily synchronization reduces blocker delays from weeks to under 24 hours.

At the end of each sprint, \\hl{Sprint Retrospective meetings drive continuous process improvement.} The team inspects its own performance and implements action items for the next cycle.

\\section{CI/CD and Automation Pipelines}
Modern software delivery requires reliable automation. Integration and deployment processes must be automated to reduce manual errors. \\hl{CI/CD automation reduces software release defects.} 

Additionally, continuous testing is critical. \\hl{Automated testing prevents regression defects during refactoring.} Running automated test suites on every pull request prevents regression defects. To keep codebase maintainable, developers must refactor. \\hl{Refactoring legacy code minimizes long-term technical debt.} Continuous refactoring prevents architectural decay.

\\section{Quality Assurance and Peer Review}
Quality assurance cannot rely only on tests. Human reviews are necessary. \\hl{Code review improves system design quality.} Peer reviews distribute system knowledge across the team and catch design issues.

However, formal documentation is needed. \\hl{Informal feedback loops increase requirement drift risks.} Relying on informal chats instead of written requirements causes deviations. Similarly, \\hl{Oral agreements without tracking lead to deliverable mismatch.} Oral agreements tend to be forgotten or misinterpreted.

\\section{Auditability and Traceability Graph}
Compliance in regulated industries requires detailed audits. Manually mapping developer claims to technical evidence is exhausting. \\hl{A claims traceability graph simplifies the auditing process.} Our traceability graph reduces compliance audit time by 70\\% by automatically mapping claims to documents.
\\end{document}`;

const RichTextEditor = React.memo(({ initialHtml, onHtmlChange, readOnly }) => {
  return (
    <div
      key={readOnly ? 'readonly' : 'editable'}
      className="flex-1 bg-white text-slate-800 p-8 overflow-y-auto leading-relaxed custom-scrollbar selection:bg-indigo-100 outline-none"
      contentEditable={!readOnly}
      suppressContentEditableWarning={true}
      onInput={(e) => onHtmlChange(e.target)}
      dangerouslySetInnerHTML={{ __html: initialHtml }}
    />
  );
}, (prev, next) => prev.readOnly === next.readOnly && prev.initialHtml === next.initialHtml);

export default function Workspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('Source');
  const [editorMode, setEditorMode] = useState('Code');

  const [toastMessage, setToastMessage] = useState('');
  const [showSubmitReviewModal, setShowSubmitReviewModal] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [instructorsList, setInstructorsList] = useState([]);

  // Trạng thái cấu trúc Overleaf
  const [isCompiling, setIsCompiling] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isSharedSourcesExpanded, setIsSharedSourcesExpanded] = useState(false);
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);

  // Backend state
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sources, setSources] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [claims, setClaims] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const activePaperFeedbacks = feedbacks.filter(fb => String(fb.paperId) === String(selectedPaper?.id));
  const latestPaperFb = activePaperFeedbacks.length > 0 ? activePaperFeedbacks[activePaperFeedbacks.length - 1] : null;
  const paperStatus = latestPaperFb ? latestPaperFb.status : 'ACTIVE';
  const [graphData, setGraphData] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  const [showAiReviewModal, setShowAiReviewModal] = useState(false);
  const [loadingAiReview, setLoadingAiReview] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState(null);

  const [codeContent, setCodeContent] = useState('');
  const [codeHistory, setCodeHistory] = useState(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showSymbolMenu, setShowSymbolMenu] = useState(false);
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [fileTreeWidth, setFileTreeWidth] = useState(256); // pixels
  const [rightDrawerWidth, setRightDrawerWidth] = useState(380); // pixels
  const [sharedCollections, setSharedCollections] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  const updateCode = (newVal) => {
    setCodeContent(newVal);
    const nextHistory = codeHistory.slice(0, historyIndex + 1);
    nextHistory.push(newVal);
    setCodeHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const loadCode = (newVal) => {
    const text = newVal || '';
    setCodeContent(text);
    setCodeHistory([text]);
    setHistoryIndex(0);
  };

  // Trạng thái cho Đối chiếu AI & Luận điểm
  // Trạng thái cho Sơ đồ liên kết 10 Papers
  const [selectedPaperDetail, setSelectedPaperDetail] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  // Hàm phân loại bài viết theo tiêu đề và nội dung để sinh cụm dữ liệu tự động
  const getPaperCategory = (paper) => {
    const text = ((paper.title || paper.name || '') + ' ' + (paper.content || '')).toLowerCase();
    if (text.includes('react')) return 'ReactJS';
    if (text.includes('devops') || text.includes('agile') || text.includes('scrum') || text.includes('cicd') || text.includes('test')) return 'DevOps';
    if (text.includes('microservice') || text.includes('gateway') || text.includes('consensus') || text.includes('raft') || text.includes('kafka')) return 'Microservices';
    return 'General';
  };

  const getCategoryColor = (cat) => {
    if (cat === 'ReactJS') return '#38bdf8';
    if (cat === 'DevOps') return '#10b981';
    if (cat === 'Microservices') return '#ec4899';
    return '#818cf8';
  };

  // Tính toán Sơ đồ mạng lưới bài viết động 100% dựa trên danh sách papers thực tế từ DB
  const sortedPapers = [...papers].sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
  const clusterCounts = { ReactJS: 0, DevOps: 0, Microservices: 0, General: 0 };
  
  const tempNodes = sortedPapers.map((paper, index) => {
    const category = getPaperCategory(paper);
    const numInCluster = clusterCounts[category]++;
    
    // Tự tạo tóm tắt ngắn gọn nếu không có extractedText
    let summaryText = 'Bản thảo tài liệu nghiên cứu.';
    if (paper.extractedText) {
      summaryText = paper.extractedText.replace(/\hl\{([^}]+)\}/g, '$1').slice(0, 160) + '...';
    }

    return {
      id: paper.id,
      num: index + 1,
      name: paper.filename || paper.name || 'document.tex',
      title: paper.title || (paper.filename || paper.name || 'document.tex').replace('.tex', ''),
      category,
      color: getCategoryColor(category),
      created: paper.uploadedAt ? new Date(paper.uploadedAt).toLocaleString('vi-VN') : 'Không rõ',
      summary: summaryText,
      clusterIndex: numInCluster
    };
  });

  const clusterCenters = {
    ReactJS: { x: 95, y: 95 },
    DevOps: { x: 245, y: 95 },
    Microservices: { x: 170, y: 225 },
    General: { x: 170, y: 160 }
  };

  const dynamicNodes = tempNodes.map(node => {
    const totalInCluster = clusterCounts[node.category];
    const center = clusterCenters[node.category];
    
    if (totalInCluster <= 1) {
      return { ...node, x: center.x, y: center.y };
    } else {
      const angle = (node.clusterIndex / totalInCluster) * 2 * Math.PI;
      const radius = 35;
      return {
        ...node,
        x: Math.round(center.x + radius * Math.cos(angle)),
        y: Math.round(center.y + radius * Math.sin(angle))
      };
    }
  });

  const dynamicLinks = [];
  ['ReactJS', 'DevOps', 'Microservices', 'General'].forEach(cat => {
    const catNodes = dynamicNodes.filter(n => n.category === cat);
    for (let i = 0; i < catNodes.length; i++) {
      for (let j = i + 1; j < catNodes.length; j++) {
        dynamicLinks.push({
          source: catNodes[i].id,
          target: catNodes[j].id,
          category: cat
        });
      }
    }
  });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimMatches, setClaimMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [newClaimContent, setNewClaimContent] = useState('');
  const [editingClaim, setEditingClaim] = useState(null);
  const [editClaimContent, setEditClaimContent] = useState('');

  const getCompiledLatex = () => {
    const mainFile = papers.find(p => p.filename === 'main.tex');
    if (!mainFile) return selectedPaper ? codeContent : DEFAULT_SAMPLE_LATEX;

    let compiled = selectedPaper?.filename === 'main.tex' ? codeContent : (mainFile.content || '');

    const inputRegex = /\\input\{([^}]+)\}/g;
    for (let i = 0; i < 5; i++) {
      let hasReplaced = false;
      compiled = compiled.replace(inputRegex, (match, path) => {
        const cleanPath = path.endsWith('.tex') ? path : path + '.tex';
        if (selectedPaper?.filename === cleanPath) {
          hasReplaced = true;
          return codeContent;
        }
        const file = papers.find(f => f.filename === cleanPath || f.name === cleanPath);
        if (file) {
          hasReplaced = true;
          return file.content || '';
        }
        return match;
      });
      if (!hasReplaced) break;
    }
    return compiled;
  };

  const isEditingAllowed = (paperFile) => {
    if (!paperFile) return false;
    if (!currentUser) return false;
    if (currentUser.role === 'INSTRUCTOR') return false;

    const userRoleObj = project?.members?.find(m => m.email === currentUser.email);
    const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser.id ? 'PL' : '');

    if (paperFile.filename === 'main.tex' || paperFile.filename === 'references.bib') {
      return userRole === 'PL';
    }
    if (paperFile.filename.startsWith('sections/')) {
      return paperFile.assignedTo === currentUser.email;
    }
    return true;
  };

  const handleSubmitSectionReview = async () => {
    if (!selectedPaper || !project) return;
    try {
      await api.put(`/api/papers/${selectedPaper.id}`, { content: codeContent });
      await api.post(`/api/projects/${project.id}/submit-review`, {
        instructorId: project.instructorId || 2,
        paperId: selectedPaper.id
      });
      showToast('Đã nộp phê duyệt phần này thành công!');
      await loadProjectData(project.id);
    } catch (err) {
      console.error('Failed to submit section review', err);
      showToast('Lỗi khi nộp phê duyệt!');
    }
  };

  const displayContent = getCompiledLatex();

  // Đồng bộ hóa luận điểm trực tiếp từ mã nguồn LaTeX
  const syncClaimsFromCode = async (code, projId) => {
    if (!projId) return;
    const matches = [...code.matchAll(/\hl\{([^}]+)\}/g)];
    const claimContents = matches.map(m => m[1].trim()).filter(Boolean);
    try {
      const res = await api.post(`/api/projects/${projId}/sync-claims`, { claimContents });
      setClaims(res.data);
      // Cập nhật lại dữ liệu đồ thị đối chiếu tương ứng
      const graphRes = await api.get(`/api/projects/${projId}/traceability-export`);
      setGraphData(graphRes.data);
    } catch (err) {
      console.error('Failed to sync claims', err);
    }
  };
  // Tự động quét, đồng bộ và phân tích toàn bộ luận điểm khi ấn Đối chiếu AI ở lề trái
  // Trích xuất và định dạng LaTeX của Paper trong graph thành dạng xem trước PDF
  const renderModalPaperPdf = (paperName) => {
    const dbPaper = papers.find(p => p.filename === paperName || p.name === paperName);
    const content = dbPaper ? dbPaper.content : '';
    if (!content) {
      return <div className="text-center py-8 text-xs text-slate-400 italic">No document content available.</div>;
    }

    const pages = content.split(/\\newpage|\\clearpage/);
    return pages.map((pageContent, pageIndex) => {
      const titleMatch = pageContent.match(/\\title\{([^}]+)\}/);
      const authorMatch = pageContent.match(/\\author\{([^}]+)\}/);

      let body = pageContent.replace(/\\documentclass.*?\n/g, '')
        .replace(/\\usepackage.*?\n/g, '')
        .replace(/\\title\{.*?\}/g, '')
        .replace(/\\author\{.*?\}/g, '')
        .replace(/\\date\{.*?\}/g, '')
        .replace(/\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        .replace(/\\maketitle/g, '');

      const sections = body.split(/\\section\{([^}]+)\}/);
      const parsedElements = [];

      const parseText = (text) => {
        const parts = text.split(/\hl\{([^}]+)\}/g);
        return parts.map((part, index) => {
          if (index % 2 === 1) {
            return <span key={index} className="bg-yellow-100 px-1 rounded-sm border-b border-yellow-300 font-bold">{part}</span>;
          }
          return part;
        });
      };

      if (titleMatch || authorMatch) {
        parsedElements.push(
          <div key="header" className="text-center mb-6">
            {titleMatch && <h1 className="text-lg font-bold text-slate-900 font-serif leading-snug mb-1">{titleMatch[1]}</h1>}
            {authorMatch && <p className="text-xs text-slate-500 font-medium">{authorMatch[1]}</p>}
          </div>
        );
      }

      if (sections[0] && sections[0].trim()) {
        parsedElements.push(<p key="intro" className="text-[12px] mb-4 leading-relaxed text-slate-650 font-serif text-justify">{parseText(sections[0].trim())}</p>);
      }

      for (let i = 1; i < sections.length; i += 2) {
        const sectionTitle = sections[i];
        const sectionContent = sections[i + 1] || '';

        parsedElements.push(
          <h2 key={`h2-${i}`} className="font-bold text-xs mb-2 text-indigo-700 font-serif uppercase tracking-wider mt-3 border-b border-slate-100 pb-1">
            {sectionTitle}
          </h2>
        );

        const paragraphs = sectionContent.split('\n\n').filter(p => p.trim());
        paragraphs.forEach((p, pIndex) => {
          parsedElements.push(
            <p key={`p-${i}-${pIndex}`} className="text-[11px] mb-3 leading-relaxed text-slate-600 font-serif text-justify">
              {parseText(p.trim())}
            </p>
          );
        });
      }

      return (
        <div key={pageIndex} className="bg-white border border-slate-200/80 shadow-sm rounded-xl p-5 mb-4 max-h-[350px] overflow-y-auto custom-scrollbar font-serif select-text">
          {parsedElements}
        </div>
      );
    });
  };
  const handleAiAssistantClick = async () => {
    // 1. Luôn mở ngăn kéo bên phải và kích hoạt Tab Luận điểm (Không bật tắt tắt mở ngăn kéo)
    setActiveTab('Claims');
    setIsDrawerOpen(true);
    
    // 2. Chạy đồng bộ hóa luận điểm và phân tích AI cho toàn bộ luận điểm trong bài viết hiện tại
    if (projectId) {
      showToast("Đang đồng bộ hóa và đối sánh luận điểm...");
      const matches = [...codeContent.matchAll(/\hl\{([^}]+)\}/g)];
      const claimContents = matches.map(m => m[1].trim()).filter(Boolean);
      try {
        const res = await api.post(`/api/projects/${projectId}/sync-claims`, { claimContents });
        setClaims(res.data);
        
        // Tự động phân tích toàn bộ các luận điểm của paper
        for (const claim of res.data) {
          await api.post(`/api/claims/${claim.id}/analyze`);
        }
        
        // Tải lại danh sách sau khi phân tích
        const claimRes = await api.get(`/api/claims/by-project/${projectId}`);
        setClaims(claimRes.data || []);
        const graphRes = await api.get(`/api/projects/${projectId}/traceability-export`);
        setGraphData(graphRes.data);
        
        showToast("Đối chiếu AI hoàn tất!");
      } catch (err) {
        console.error('Failed to run dynamic claims sync & analyze', err);
      }
    }
  };



  // 1. Tải thông tin người dùng hiện tại và danh sách giảng viên
  useEffect(() => {
    api.get('/api/users/me')
      .then(res => setCurrentUser(res.data))
      .catch(err => console.error('Failed to fetch user profile', err));

    api.get('/api/users/instructors')
      .then(res => {
        setInstructorsList(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedInstructorId(res.data[0].id.toString());
        }
      })
      .catch(err => console.error('Failed to fetch instructors', err));

    api.get('/api/users/students')
      .then(res => setAllStudents(res.data || []))
      .catch(err => console.error('Failed to fetch students', err));
  }, []);

  // 2. Hàm tải lại dữ liệu chi tiết của dự án
  const loadProjectData = async (projId) => {
    if (!projId) return;
    try {
      // Tải chi tiết dự án
      const projRes = await api.get(`/api/projects/${projId}`);
      setProject(projRes.data);

      // Tải nguồn tài liệu (Sources)
      try {
        const srcRes = await api.get(`/api/projects/${projId}/sources`);
        setSources(srcRes.data || []);
      } catch (e) { console.error('Failed to fetch sources', e); }

      // Tải các bản nháp (Papers)
      try {
        const paperRes = await api.get(`/api/papers/by-project/${projId}`);
        const paperList = paperRes.data || [];
        setPapers(paperList);

        // Nếu có paper, chọn paper đầu tiên làm mặc định hiển thị
        if (paperList.length > 0) {
          const savedPaperId = localStorage.getItem('current_selected_paper_id');
          const matchedPaper = paperList.find(p => String(p.id) === String(savedPaperId));
          const defaultPaper = matchedPaper || paperList.find(p => p.filename === 'main.tex') || paperList[0];
          setSelectedPaper(defaultPaper);
          loadCode(defaultPaper.content || '');
          localStorage.setItem('current_selected_paper_id', defaultPaper.id);
        } else {
        }
      } catch (e) { console.error('Failed to fetch papers', e); }

      // Tải và đồng bộ hóa luận điểm (Claims) từ nội dung của paper hiện có
      try {
        const paperRes = await api.get(`/api/papers/by-project/${projId}`);
        const paperList = paperRes.data || [];
        if (paperList.length > 0) {
          const mainFile = paperList.find(p => p.filename === 'main.tex');
          const compileLocally = (mFile, files) => {
            let compiled = mFile ? (mFile.content || '') : '';
            const inputRegex = /\\input\{([^}]+)\}/g;
            for (let i = 0; i < 5; i++) {
              let hasReplaced = false;
              compiled = compiled.replace(inputRegex, (match, path) => {
                const cleanPath = path.endsWith('.tex') ? path : path + '.tex';
                const file = files.find(f => f.filename === cleanPath || f.name === cleanPath);
                if (file) {
                  hasReplaced = true;
                  return file.content || '';
                }
                return match;
              });
              if (!hasReplaced) break;
            }
            return compiled;
          };
          const code = compileLocally(mainFile, paperList);
          const matches = [...code.matchAll(/\hl\{([^}]+)\}/g)];
          const claimContents = matches.map(m => m[1].trim()).filter(Boolean);
          const syncRes = await api.post(`/api/projects/${projId}/sync-claims`, { claimContents });
          setClaims(syncRes.data);
        } else {
          const claimRes = await api.get(`/api/claims/by-project/${projId}`);
          setClaims(claimRes.data || []);
        }
      } catch (e) {
        console.error('Failed to sync claims on load', e);
        const claimRes = await api.get(`/api/claims/by-project/${projId}`);
        setClaims(claimRes.data || []);
      }

      // Tải phản hồi (Feedbacks) - gọi đúng URL /api/feedback-requests
      try {
        const fbRes = await api.get('/api/feedback-requests');
        const allFbs = fbRes.data || [];
        const projectFbs = allFbs.filter(fb => String(fb.projectId) === String(projId));
        setFeedbacks(projectFbs);
      } catch (e) { console.error('Failed to fetch feedback', e); }

      // Tải dữ liệu đồ thị (Graph) - gọi đúng URL /api/projects/{id}/traceability-export
      try {
        const graphRes = await api.get(`/api/projects/${projId}/traceability-export`);
        setGraphData(graphRes.data);
      } catch (e) { console.error('Failed to fetch graph data', e); }

      // Tải bộ sưu tập tiêu chuẩn chứng cứ của giảng viên (sharedCollections)
      try {
        const colRes = await api.get(`/api/projects/${projId}/collections`);
        setSharedCollections(colRes.data || []);
      } catch (e) { console.error('Failed to fetch shared collections', e); }

      // Tải tài liệu tham khảo đính kèm (sharedDocuments)
      try {
        const docsRes = await api.get('/api/collections/documents');
        setSharedDocuments(docsRes.data || []);
      } catch (e) { console.error('Failed to fetch shared documents', e); }

    } catch (err) {
      console.error('Error loading project details:', err);
    }
  };

  // 3. Tải danh sách các dự án và dữ liệu dự án hiện tại
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingProject(true);
        let currentProjectId = projectId;

        // Lấy danh sách dự án
        const listRes = await api.get('/api/projects');
        const activeProjects = listRes.data || [];
        setProjects(activeProjects);

        // Nếu không có projectId trên URL, chọn cái đầu tiên
        if (!currentProjectId && activeProjects.length > 0) {
          currentProjectId = activeProjects[0].id;
          navigate(`/student/projects/${currentProjectId}`, { replace: true });
          return;
        }

        if (currentProjectId) {
          await loadProjectData(currentProjectId);
        }
      } catch (err) {
        console.error('Error loading projects list:', err);
      } finally {
        setLoadingProject(false);
      }
    }

    loadInitialData();
  }, [projectId]);

  // 4. Các hàm xử lý CRUD API

  // Tạo dự án mới
  const handleCreateProject = async () => {
    const title = prompt("Nhập tiêu đề dự án:");
    if (!title) return;
    const description = prompt("Nhập mô tả dự án (tùy chọn):") || "";
    try {
      const res = await api.post('/api/projects', { title, description });
      showToast("Tạo dự án thành công!");

      // Tải lại danh sách và chuyển hướng
      const listRes = await api.get('/api/projects');
      const activeProjects = listRes.data || [];
      setProjects(activeProjects);
      navigate(`/student/projects/${res.data.id}`);
    } catch (err) {
      console.error(err);
      showToast("Tạo dự án thất bại");
    }
  };

  // {UI_TEXT[language].deleteBtn} dự án hiện tại
  const handleDeleteProject = async () => {
    if (!project) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.title}" không?`)) return;
    try {
      await api.delete(`/api/projects/${project.id}`);
      showToast("Xóa dự án thành công!");

      const listRes = await api.get('/api/projects');
      const activeProjects = listRes.data || [];
      setProjects(activeProjects);

      if (activeProjects.length > 0) {
        navigate(`/student/projects/${activeProjects[0].id}`);
      } else {
        setProject(null);
        setSources([]);
        setPapers([]);
        setClaims([]);
        setFeedbacks([]);
        setGraphData(null);
        loadCode('');
        setSelectedPaper(null);
        navigate('/student/projects');
      }
    } catch (err) {
      console.error(err);
      showToast("Xóa dự án thất bại");
    }
  };

  // Tải lên Tài liệu tham khảo (Source)
  const handleUploadSource = async (file) => {
    if (!file || !project) return;
    if (!currentUser) {
      showToast("Không tìm thấy thông tin tài khoản người dùng.");
      return;
    }
    showToast(`Đang tải lên ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', project.id);
    formData.append('uploadedBy', currentUser.id); // Bắt buộc theo API của BE
    if (selectedPaper) {
      formData.append('paperId', selectedPaper.id);
    }

    try {
      await api.post('/api/sources/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(`${file.name} đã được tải lên thành công.`);
      // Tải lại nguồn và graph
      const srcRes = await api.get(`/api/projects/${project.id}/sources`);
      setSources(srcRes.data || []);
      const graphRes = await api.get(`/api/projects/${project.id}/traceability-export`);
      setGraphData(graphRes.data);
    } catch (err) {
      console.error('Upload source failed', err);
      showToast(`Tải lên ${file.name} thất bại.`);
    }
  };

  // Xóa tài liệu tham khảo (Source)
  const handleDeleteSource = async (sourceId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
    try {
      await api.delete(`/api/sources/${sourceId}`);
      showToast("Xóa tài liệu thành công!");
      // Tải lại nguồn và graph
      const srcRes = await api.get(`/api/projects/${project.id}/sources`);
      setSources(srcRes.data || []);
      const graphRes = await api.get(`/api/projects/${project.id}/traceability-export`);
      setGraphData(graphRes.data);
    } catch (err) {
      console.error(err);
      showToast("Xóa tài liệu thất bại.");
    }
  };

  // Tải lên bản nháp bài báo (Paper)
  const handleUploadPaper = async (file) => {
    if (!file || !project) return;
    showToast(`Đang tải lên bản nháp ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', project.id);

    try {
      const res = await api.post('/api/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Tải lên bản nháp bài báo thành công.");

      // Tải lại danh sách Paper
      const paperRes = await api.get(`/api/papers/by-project/${project.id}`);
      const paperList = paperRes.data || [];
      setPapers(paperList);

      // Chọn paper mới tải lên làm hiện tại
      const uploadedPaper = res.data;
      setSelectedPaper(uploadedPaper);
      loadCode(uploadedPaper.extractedText || '');
    } catch (err) {
      console.error('Upload paper failed', err);
      showToast("Tải lên bản nháp thất bại.");
    }
  };

  // Xóa bản nháp bài báo (Paper)
  const handleDeletePaper = async (paperId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản nháp bài viết này?")) return;
    try {
      await api.delete(`/api/papers/${paperId}`);
      showToast("Xóa bản nháp thành công!");

      // Tải lại danh sách Paper
      const paperRes = await api.get(`/api/papers/by-project/${project.id}`);
      const paperList = paperRes.data || [];
      setPapers(paperList);

      if (selectedPaper && selectedPaper.id === paperId) {
        if (paperList.length > 0) {
          setSelectedPaper(paperList[0]);
          loadCode(paperList[0].extractedText || '');
        } else {
          setSelectedPaper(null);
          loadCode('');
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Xóa bản nháp thất bại.");
    }
  };

  // Tạo luận điểm mới (Claim)
  const handleCreateClaim = async () => {
    if (!newClaimContent.trim() || !project) return;
    try {
      await api.post('/api/claims', {
        content: newClaimContent,
        project: { id: project.id }
      });
      showToast("Đã thêm luận điểm mới.");
      setNewClaimContent('');

      // Tải lại danh sách claims và graph
      const claimRes = await api.get(`/api/claims/by-project/${project.id}`);
      setClaims(claimRes.data || []);
      const graphRes = await api.get(`/api/projects/${project.id}/traceability-export`);
      setGraphData(graphRes.data);
    } catch (err) {
      console.error(err);
      showToast("Thêm luận điểm thất bại.");
    }
  };

  // Cập nhật luận điểm (Claim)
  const handleUpdateClaim = async () => {
    if (!editingClaim || !editClaimContent.trim()) return;
    try {
      await api.put(`/api/claims/${editingClaim.id}`, {
        id: editingClaim.id,
        content: editClaimContent,
        active: true,
        aiConfidenceScore: editingClaim.aiConfidenceScore
      });
      showToast("Cập nhật luận điểm thành công.");
      setEditingClaim(null);
      setEditClaimContent('');

      // Tải lại danh sách claims và graph
      const claimRes = await api.get(`/api/claims/by-project/${project.id}`);
      setClaims(claimRes.data || []);
      const graphRes = await api.get(`/api/projects/${project.id}/traceability-export`);
      setGraphData(graphRes.data);
    } catch (err) {
      console.error(err);
      showToast("Cập nhật luận điểm thất bại.");
    }
  };

  // Xóa luận điểm (Claim)
  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm(UI_TEXT[language].deleteClaimConfirm)) return;
    try {
      await api.delete(`/api/claims/${claimId}`);
      showToast("Xóa luận điểm thành công!");

      // Tải lại danh sách claims và graph
      const claimRes = await api.get(`/api/claims/by-project/${project.id}`);
      setClaims(claimRes.data || []);
      const graphRes = await api.get(`/api/projects/${project.id}/traceability-export`);
      setGraphData(graphRes.data);

      if (selectedClaim && selectedClaim.id === claimId) {
        setSelectedClaim(null);
        setClaimMatches([]);
      }
    } catch (err) {
      console.error(err);
      showToast("Xóa luận điểm thất bại.");
    }
  };

  // {UI_TEXT[language].aiAnalyzeBtn} luận điểm tự động (Analyze Claim)
  const handleAnalyzeClaim = async (claimId) => {
    showToast("AI đang tìm chứng cứ và phân tích...");
    try {
      const res = await api.post(`/api/claims/${claimId}/analyze`);
      showToast("AI đã hoàn thành phân tích!");

      // Tải lại danh sách claims và graph
      const claimRes = await api.get(`/api/claims/by-project/${project.id}`);
      setClaims(claimRes.data || []);
      const graphRes = await api.get(`/api/projects/${project.id}/traceability-export`);
      setGraphData(graphRes.data);

      // Tự động chọn claim vừa phân tích để hiển thị kết quả đối chiếu
      setSelectedClaim(res.data);
      handleFetchMatches(claimId);
    } catch (err) {
      console.error(err);
      showToast("Phân tích AI thất bại. Vui lòng kiểm tra dịch vụ AI.");
    }
  };

  // Lấy các nguồn chứng cứ khớp từ AI (Get matches)
  const handleFetchMatches = async (claimId) => {
    setLoadingMatches(true);
    try {
      const res = await api.get(`/api/claims/${claimId}/matches`, {
        params: { topK: 5 }
      });
      setClaimMatches(res.data?.matches || []);
    } catch (err) {
      console.error(err);
      showToast("Lấy chứng cứ khớp thất bại.");
    } finally {
      setLoadingMatches(false);
    }
  };

  // AI đánh giá cấu trúc bài viết (Run AI Review) và đồng thời đối sánh luận điểm
  const handleRunAiReview = async () => {
    if (!selectedPaper) {
      showToast("Vui lòng chọn hoặc tải lên một bản nháp bài viết trước.");
      return;
    }
    setLoadingAiReview(true);
    setShowAiReviewModal(true);
    try {
      // 1. Phân tích cấu trúc
      const res = await api.post(`/api/papers/${selectedPaper.id}/review`);
      setAiReviewResult(res.data);

      // 2. Tự động chạy đối chiếu toàn bộ luận điểm trong bài viết hiện tại
      const matches = [...codeContent.matchAll(/\hl\{([^}]+)\}/g)];
      const claimContents = matches.map(m => m[1].trim()).filter(Boolean);
      const syncRes = await api.post(`/api/projects/${project.id}/sync-claims`, { claimContents });
      setClaims(syncRes.data);
      
      for (const claim of syncRes.data) {
        await api.post(`/api/claims/${claim.id}/analyze`);
      }
      
      const claimRes = await api.get(`/api/claims/by-project/${project.id}`);
      setClaims(claimRes.data || []);
      const graphRes = await api.get(`/api/projects/${project.id}/traceability-export`);
      setGraphData(graphRes.data);

      showToast("AI Review và phân tích đối chiếu hoàn thành!");
    } catch (err) {
      console.error(err);
      showToast("AI Review hoàn thành với một số cảnh báo.");
    } finally {
      setLoadingAiReview(false);
    }
  };

  // Gửi bài cho giảng viên duyệt (Submit Review)
  const handleSubmitReview = async () => {
    if (!project) return;
    if (!selectedPaper) {
      showToast("Vui lòng mở một Bản thảo để gửi duyệt.");
      return;
    }
    if (!selectedInstructorId) {
      showToast("Vui lòng chọn một Giảng viên để gửi duyệt.");
      return;
    }
    try {
      await api.post(`/api/projects/${project.id}/submit-review`, {
        instructorId: parseInt(selectedInstructorId),
        paperId: selectedPaper.id
      });
      showToast("Gửi yêu cầu phê duyệt thành công!");
      setShowSubmitReviewModal(false);

      // Tải lại thông tin dự án (để cập nhật trạng thái IN_REVIEW)
      await loadProjectData(project.id);
    } catch (err) {
      console.error(err);
      showToast("Gửi yêu cầu phê duyệt thất bại.");
    }
  };

  const preRef = useRef(null);

  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
    const gutter = document.getElementById('editor-gutter');
    if (gutter) {
      gutter.scrollTop = e.target.scrollTop;
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Xử lý đóng mở Drawer khi click Tab bên phải
  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      setActiveTab(tab);
      setIsDrawerOpen(true);
    }
  };

  // Lấy các mục tiêu đề từ mã nguồn LaTeX để hiển thị Outline
  const getOutlineSections = () => {
    const content = displayContent;
    const matches = [...content.matchAll(/\\section\{([^}]+)\}/g)];
    return matches.map(match => ({
      title: match[1],
      index: match.index
    }));
  };

  // Quét cú pháp để bắt lỗi LaTeX cơ bản
  const getSyntaxErrors = () => {
    const lines = displayContent.split('\n');
    const errors = {};
    let openBegins = [];

    lines.forEach((line, index) => {
      const beginMatch = line.match(/\\begin\{([^}]+)\}/);
      const endMatch = line.match(/\\end\{([^}]+)\}/);

      if (beginMatch) {
        openBegins.push({ type: beginMatch[1], line: index });
      }
      if (endMatch) {
        if (openBegins.length > 0) {
          const lastBegin = openBegins[openBegins.length - 1];
          if (lastBegin.type === endMatch[1]) {
            openBegins.pop();
          } else {
            errors[index] = `Lỗi đóng khối: mong đợi \\end{${lastBegin.type}} nhưng gặp \\end{${endMatch[1]}}`;
          }
        } else {
          errors[index] = `Lỗi cú pháp: \\end{${endMatch[1]}} dư thừa`;
        }
      }

      // Check unclosed braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        errors[index] = 'Dòng này có dấu ngoặc nhọn { chưa được đóng';
      }
    });

    openBegins.forEach(b => {
      errors[b.line] = `Khối \\begin{${b.type}} chưa được đóng bằng lệnh \\end`;
    });

    return errors;
  };

  // Cuộn biên tập đến section LaTeX
  const handleSectionClick = (sectionTitle) => {
    const text = displayContent;
    const targetText = `\\section{${sectionTitle}}`;
    const index = text.indexOf(targetText);
    if (index !== -1) {
      showToast(`Đã định vị: ${sectionTitle}`);
      const textarea = document.getElementById('latex-textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(index, index + targetText.length);
        const linesBefore = text.substring(0, index).split('\n').length;
        const lineHeight = 24;
        textarea.scrollTop = (linesBefore - 3) * lineHeight;
      }
    }
  };

  // Chèn cú pháp LaTeX nhanh
  const insertLatexTag = (tagType) => {
    const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
    const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
    const isPL = userRole === 'PL';
    const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
    const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
    if (!allowed || selectedPaper?.status === 'APPROVED') {
      showToast('Bạn không có quyền chỉnh sửa phần này!');
      return;
    }

    const textarea = document.getElementById('latex-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = codeContent;
    const selectedText = text.substring(start, end);

    let insertion = '';
    let cursorOffset = 0;

    if (tagType === 'bold') {
      insertion = `\\textbf{${selectedText || 'chữ_in_đậm'}}`;
      cursorOffset = 8;
    } else if (tagType === 'italic') {
      insertion = `\\textit{${selectedText || 'chữ_in_nghiêng'}}`;
      cursorOffset = 8;
    } else if (tagType === 'section') {
      insertion = `\\section{${selectedText || 'Tiêu đề'}}`;
      cursorOffset = 9;
    } else if (tagType === 'subsection') {
      insertion = `\\subsection{${selectedText || 'Tiêu đề phụ'}}`;
      cursorOffset = 12;
    } else if (tagType === 'subsubsection') {
      insertion = `\\subsubsection{${selectedText || 'Tiêu đề phụ 2'}}`;
      cursorOffset = 15;
    } else if (tagType === 'large') {
      insertion = `{\\large ${selectedText || 'Văn bản lớn'}}`;
      cursorOffset = 8;
    } else if (tagType === 'small') {
      insertion = `{\\small ${selectedText || 'Văn bản nhỏ'}}`;
      cursorOffset = 8;
    } else if (tagType === 'inline-math') {
      insertion = `$${selectedText || 'E=mc^2'}$`;
      cursorOffset = 1;
    } else if (tagType === 'list') {
      insertion = `\n\\begin{itemize}\n  \\item ${selectedText || 'mục_1'}\n\\end{itemize}\n`;
      cursorOffset = 21;
    } else if (tagType === 'equation') {
      insertion = `\\begin{equation}\n  ${selectedText || 'E = mc^2'}\n\\end{equation}`;
      cursorOffset = 18;
    } else if (tagType === 'comment') {
      insertion = `% ${selectedText || 'Bình luận của bạn'}`;
      cursorOffset = 2;
    } else if (tagType === 'label') {
      const name = prompt('Nhập tên nhãn (Label name):', 'sec:introduction') || 'sec:label';
      insertion = `\\label{${name}}`;
      cursorOffset = insertion.length;
    } else if (tagType === 'cite') {
      const citeKey = prompt('Nhập mã trích dẫn (Citation key):', 'author2026') || 'key';
      insertion = `\\cite{${citeKey}}`;
      cursorOffset = insertion.length;
    } else if (tagType === 'link') {
      const url = prompt('Nhập liên kết (URL):', 'https://example.com') || 'https://';
      const label = selectedText || prompt('Nhập nhãn liên kết (Link label):', 'Xem chi tiết') || 'Link';
      insertion = `\\href{${url}}{${label}}`;
      cursorOffset = insertion.length;
    } else if (tagType === 'figure') {
      insertion = `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.8\\textwidth]{image.png}\n  \\caption{${selectedText || 'Tên hình ảnh'}}\n  \\label{fig:label}\n\\end{figure}\n`;
      cursorOffset = 83;
    } else if (tagType === 'table') {
      insertion = `\n\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{|c|c|}\n    \\hline\n    Cột 1 & Cột 2 \\\\\n    \\hline\n    ${selectedText || 'Dòng 1'} & Dòng 1 \\\\\n    Dòng 2 & Dòng 2 \\\\\n    \\hline\n  \\end{tabular}\n  \\caption{Tên bảng}\n  \\label{tab:table}\n\\end{table}\n`;
      cursorOffset = 120;
    } else if (tagType === 'hl') {
      insertion = `\\hl{${selectedText || 'văn_bản_nổi_bật'}}`;
      cursorOffset = 4;
    }

    const newContent = text.substring(0, start) + insertion + text.substring(end);
    updateCode(newContent);
    showToast(`Đã chèn mẫu định dạng LaTeX.`);

    setTimeout(() => {
      textarea.focus();
      if (selectedText && tagType !== 'link' && tagType !== 'label' && tagType !== 'cite') {
        textarea.setSelectionRange(start, start + insertion.length);
      } else {
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
    }, 50);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCodeContent(codeHistory[prevIndex]);
      showToast('Đã hoàn tác (Undo).');
    }
  };

  const handleRedo = () => {
    if (historyIndex < codeHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCodeContent(codeHistory[nextIndex]);
      showToast('Đã làm lại (Redo).');
    }
  };

  const insertSymbol = (sym) => {
    const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
    const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
    const isPL = userRole === 'PL';
    const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
    const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
    if (!allowed || selectedPaper?.status === 'APPROVED') {
      showToast('Bạn không có quyền chỉnh sửa phần này!');
      return;
    }

    const textarea = document.getElementById('latex-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = codeContent;
    const insertion = sym;

    const newContent = text.substring(0, start) + insertion + text.substring(end);
    updateCode(newContent);
    showToast(`Đã chèn ký tự Hy Lạp: ${sym}`);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 50);
  };

  const handleFindReplace = (replaceAll = false) => {
    const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
    const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
    const isPL = userRole === 'PL';
    const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
    const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
    if (!allowed || selectedPaper?.status === 'APPROVED') {
      showToast('Bạn không có quyền chỉnh sửa phần này!');
      return;
    }

    if (!searchQuery) return;
    const text = codeContent;
    if (replaceAll) {
      const newContent = text.replaceAll(searchQuery, replaceQuery);
      updateCode(newContent);
      showToast(`Đã thay thế tất cả các chuỗi '${searchQuery}'.`);
    } else {
      const textarea = document.getElementById('latex-textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = text.substring(start, end);
        if (selectedText === searchQuery) {
          const newContent = text.substring(0, start) + replaceQuery + text.substring(end);
          updateCode(newContent);
          showToast(`Đã thay thế chuỗi được chọn.`);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start, start + replaceQuery.length);
          }, 50);
          return;
        }
      }
      const index = text.indexOf(searchQuery);
      if (index !== -1) {
        const newContent = text.substring(0, index) + replaceQuery + text.substring(index + searchQuery.length);
        updateCode(newContent);
        showToast(`Đã thay thế chuỗi đầu tiên tìm thấy.`);
      } else {
        showToast(`Không tìm thấy chuỗi '${searchQuery}'.`);
      }
    }
  };

  const handleDownloadTex = () => {
    const blob = new Blob([displayContent], { type: 'text/plain;charset=utf-8' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = selectedPaper ? `${selectedPaper.name.replace('.pdf', '')}.tex` : 'document.tex';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Đã tải xuống file LaTeX (.tex)');
  };

  const handleSyncContent = async () => {
    if (!selectedPaper) return;
    try {
      await api.put(`/api/papers/${selectedPaper.id}`, { content: codeContent });
      await syncClaimsFromCode(codeContent, project.id);
      showToast('Đã đồng bộ hóa nội dung với máy chủ.');
    } catch (err) {
      console.error('Failed to sync', err);
      showToast('Không thể đồng bộ nội dung.');
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      const container = document.getElementById('editor-preview-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidthPx = moveEvent.clientX - containerRect.left;
      let newWidthPct = (newWidthPx / containerRect.width) * 100;

      if (newWidthPct < 15) newWidthPct = 15;
      if (newWidthPct > 85) newWidthPct = 85;

      setEditorWidth(newWidthPct);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleLeftDividerMouseDown = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      let newWidth = moveEvent.clientX;
      const parent = document.getElementById('workspace-container');
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        newWidth = moveEvent.clientX - parentRect.left - 56;
      }

      if (newWidth < 160) newWidth = 160;
      if (newWidth > 450) newWidth = 450;

      setFileTreeWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleRightDividerMouseDown = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      let newWidth = 380;
      const parent = document.getElementById('workspace-container');
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        newWidth = parentRect.right - moveEvent.clientX;
      }

      if (newWidth < 250) newWidth = 250;
      if (newWidth > 600) newWidth = 600;

      setRightDrawerWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Kích hoạt biên dịch lại PDF, tự động lưu tài liệu và ghi lịch sử phiên bản
  const handleRecompile = async () => {
    if (!selectedPaper) return;
    setIsCompiling(true);
    showToast('Đang biên dịch và tự động lưu...');
    try {
      // 1. Lưu mã nguồn LaTeX hiện tại vào DB
      await api.put(`/api/papers/${selectedPaper.id}`, { content: codeContent });
      
      // Cập nhật lại trong danh sách papers local
      setPapers(prev => prev.map(p => p.id === selectedPaper.id ? { ...p, content: codeContent, extractedText: codeContent } : p));
      
      // 2. Tự động đồng bộ các luận điểm và đối chiếu AI
      const compiled = getCompiledLatex();
      await syncClaimsFromCode(compiled, project.id);

      showToast('Đã biên dịch và lưu tài liệu thành công!');
    } catch (err) {
      console.error('Failed to compile and auto-save version', err);
      showToast('Lỗi khi biên dịch và lưu phiên bản!');
    } finally {
      setIsCompiling(false);
    }
  };

  const renderPreview = () => {
    // Tách tài liệu thành các trang dựa trên lệnh \newpage hoặc \clearpage
    const pages = displayContent.split(/\\newpage|\\clearpage/);

    return pages.map((pageContent, pageIndex) => {
      const titleMatch = pageContent.match(/\\title\{([^}]+)\}/);
      const authorMatch = pageContent.match(/\\author\{([^}]+)\}/);

      let body = pageContent.replace(/\\documentclass.*?\n/g, '')
        .replace(/\\usepackage.*?\n/g, '')
        .replace(/\\title\{.*?\}/g, '')
        .replace(/\\author\{.*?\}/g, '')
        .replace(/\\date\{.*?\}/g, '')
        .replace(/\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        .replace(/\\maketitle/g, '');

      const sections = body.split(/\\section\{([^}]+)\}/);
      const parsedElements = [];

      const parseText = (text) => {
        // Step 1: Remove LaTeX comments (lines starting with % but not \%)
        let cleanText = text.split('\n')
          .map(line => {
            let percentIdx = -1;
            for (let i = 0; i < line.length; i++) {
              if (line[i] === '%' && (i === 0 || line[i - 1] !== '\\')) {
                percentIdx = i;
                break;
              }
            }
            if (percentIdx !== -1) {
              return line.substring(0, percentIdx);
            }
            return line;
          })
          .join('\n');

        // Step 2: Replace standard symbol macros with their Unicode equivalent
        const symbolMap = {
          '\\\\alpha': 'α',
          '\\\\beta': 'β',
          '\\\\gamma': 'γ',
          '\\\\delta': 'δ',
          '\\\\epsilon': 'ε',
          '\\\\theta': 'θ',
          '\\\\lambda': 'λ',
          '\\\\pi': 'π',
          '\\\\omega': 'ω',
          '\\\\sigma': 'σ',
          '\\\\infty': '∞',
          '\\\\pm': '±',
          '\\\\approx': '≈',
          '\\\\neq': '≠',
          '\\\\le': '≤',
          '\\\\ge': '≥'
        };

        for (const [macro, unicode] of Object.entries(symbolMap)) {
          const regex = new RegExp(macro + '(?![a-zA-Z])', 'g');
          cleanText = cleanText.replace(regex, unicode);
        }

        cleanText = cleanText.replace(/\\%/g, '%');

        let tokens = [{ type: 'text', content: cleanText }];

        const tokenizeMacro = (regex, type, extractData) => {
          let newTokens = [];
          for (const token of tokens) {
            if (token.type !== 'text') {
              newTokens.push(token);
              continue;
            }

            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;

            while ((match = regex.exec(token.content)) !== null) {
              if (match.index > lastIndex) {
                newTokens.push({ type: 'text', content: token.content.substring(lastIndex, match.index) });
              }

              newTokens.push({
                type,
                ...extractData(match)
              });

              lastIndex = regex.lastIndex;
            }

            if (lastIndex < token.content.length) {
              newTokens.push({ type: 'text', content: token.content.substring(lastIndex) });
            }
          }
          tokens = newTokens;
        };

        // Tokenize in order of complexity
        tokenizeMacro(/\\href\{([^}]+)\}\{([^}]+)\}/g, 'href', (match) => ({
          url: match[1],
          label: match[2]
        }));

        tokenizeMacro(/\\textbf\{([^}]+)\}/g, 'bold', (match) => ({
          content: match[1]
        }));

        tokenizeMacro(/\\italic\{([^}]+)\}/g, 'italic', (match) => ({
          content: match[1]
        }));
        
        tokenizeMacro(/\\textit\{([^}]+)\}/g, 'italic', (match) => ({
          content: match[1]
        }));

        tokenizeMacro(/\\hl\{([^}]+)\}/g, 'hl', (match) => ({
          content: match[1]
        }));

        tokenizeMacro(/(?:\\large\{([^}]+)\}|\{\\large\s+([^}]+)\})/g, 'large', (match) => ({
          content: match[1] || match[2]
        }));

        tokenizeMacro(/(?:\\small\{([^}]+)\}|\{\\small\s+([^}]+)\})/g, 'small', (match) => ({
          content: match[1] || match[2]
        }));

        tokenizeMacro(/\\subsection\{([^}]+)\}/g, 'subsection', (match) => ({
          content: match[1]
        }));

        tokenizeMacro(/\\subsubsection\{([^}]+)\}/g, 'subsubsection', (match) => ({
          content: match[1]
        }));

        tokenizeMacro(/\\cite\{([^}]+)\}/g, 'cite', (match) => ({
          key: match[1]
        }));

        tokenizeMacro(/\\label\{([^}]+)\}/g, 'label', (match) => ({
          key: match[1]
        }));

        tokenizeMacro(/\$([^$]+)\$/g, 'inline-math', (match) => ({
          formula: match[1]
        }));

        return tokens.map((token, idx) => {
          switch (token.type) {
            case 'text':
              return token.content;
            case 'bold':
              return <strong key={idx} className="font-bold text-slate-900">{parseText(token.content)}</strong>;
            case 'italic':
              return <em key={idx} className="italic text-slate-800">{parseText(token.content)}</em>;
            case 'hl':
              return <span key={idx} className="bg-yellow-200/80 px-1 rounded-sm border-b border-yellow-400">{parseText(token.content)}</span>;
            case 'large':
              return <span key={idx} className="text-lg leading-normal">{parseText(token.content)}</span>;
            case 'small':
              return <span key={idx} className="text-xs leading-normal">{parseText(token.content)}</span>;
            case 'subsection':
              return <h3 key={idx} className="font-bold text-base mt-4 mb-2 text-slate-800 font-serif">{parseText(token.content)}</h3>;
            case 'subsubsection':
              return <h4 key={idx} className="font-bold text-sm mt-3 mb-1 text-slate-800 font-serif">{parseText(token.content)}</h4>;
            case 'cite':
              return <span key={idx} className="text-xs font-semibold text-indigo-650 hover:underline cursor-pointer" title={`Citation: ${token.key}`}>[${token.key}]</span>;
            case 'href':
              return <a key={idx} href={token.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">{parseText(token.label)}⤎</a>;
            case 'inline-math':
              return <code key={idx} className="font-mono text-xs bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-serif italic">{token.formula}</code>;
            case 'label':
              return null;
            default:
              return null;
          }
        });
      };

      if (sections[0] && sections[0].trim()) {
        parsedElements.push(<p key="intro" className="text-[14px] mb-8 leading-[1.8] text-slate-700 font-serif text-justify">{parseText(sections[0].trim())}</p>);
      }

      for (let i = 1; i < sections.length; i += 2) {
        const sectionTitle = sections[i];
        const sectionContent = sections[i + 1] || '';

        parsedElements.push(
          <h2 key={`h2-${i}`} className="font-bold text-lg mb-4 text-slate-800 font-serif">
            {sectionTitle}
          </h2>
        );

        const paragraphs = sectionContent.split('\n\n').filter(p => p.trim());
        paragraphs.forEach((p, pIndex) => {
          const contentStr = p.trim();

          // 1. Render equation block
          if (contentStr.includes('\\begin{equation}')) {
            const match = contentStr.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/);
            if (match) {
              const formula = match[1].trim();
              parsedElements.push(
                <div key={`eq-${i}-${pIndex}`} className="my-6 py-3 flex items-center justify-between px-8 bg-slate-50/50 border border-slate-100 rounded-lg font-serif italic text-base">
                  <div className="flex-1 text-center font-mono">{formula}</div>
                  <div className="text-slate-400 text-sm">({pIndex + 1})</div>
                </div>
              );
              return;
            }
          }

          // 2. Render figure block
          if (contentStr.includes('\\begin{figure}')) {
            const captionMatch = contentStr.match(/\\caption\{([^}]+)\}/);
            const caption = captionMatch ? captionMatch[1] : 'Hình ảnh';
            parsedElements.push(
              <div key={`fig-${i}-${pIndex}`} className="my-6 p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-3">
                <div className="w-full max-w-sm aspect-video rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 border border-slate-300">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-xs text-slate-500 font-serif italic text-center">
                  Hình 1: {caption}
                </p>
              </div>
            );
            return;
          }

          // 3. Render table block
          if (contentStr.includes('\\begin{table}')) {
            const captionMatch = contentStr.match(/\\caption\{([^}]+)\}/);
            const caption = captionMatch ? captionMatch[1] : 'Bảng số liệu';
            const rows = [];
            const tabularMatch = contentStr.match(/\\begin\{tabular\}\{[^}]+\}([\s\S]*?)\\end\{tabular\}/);
            if (tabularMatch) {
              const rawRows = tabularMatch[1].split('\\\\');
              rawRows.forEach((r) => {
                const cleanRow = r.replace(/\\hline/g, '').trim();
                if (cleanRow) {
                  const cells = cleanRow.split('&').map(c => c.trim());
                  rows.push(cells);
                }
              });
            }
            parsedElements.push(
              <div key={`tab-${i}-${pIndex}`} className="my-6 flex flex-col items-center gap-2.5">
                <p className="text-xs text-slate-500 font-serif italic text-center w-full">
                  Bảng 1: {caption}
                </p>
                <div className="w-full overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                  <table className="w-full text-xs font-serif text-slate-700">
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-50 border-b border-slate-200 font-bold text-slate-800' : 'border-b border-slate-100 last:border-0'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2 border-r border-slate-100 last:border-0 text-center">{parseText(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            return;
          }

          // 4. Default render paragraph
          parsedElements.push(
            <p key={`p-${i}-${pIndex}`} className="text-[14px] mb-8 leading-[1.8] text-slate-700 font-serif text-justify">
              {parseText(contentStr)}
            </p>
          );
        });
      }

      return (
        <div key={pageIndex} className="bg-white shadow-2xl rounded-sm w-[720px] min-h-[1018px] p-16 select-text transition-all duration-300 relative text-left mb-6 flex flex-col justify-between">
          <div>
            {titleMatch && (
              <h1 className="text-2xl font-serif font-bold text-center mb-3 leading-snug text-slate-900">
                {titleMatch[1].split('\\\\').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
              </h1>
            )}
            {authorMatch && (
              <p className="text-center text-sm mb-10 text-slate-600 font-serif italic">{authorMatch[1]}</p>
            )}
            {parsedElements}
          </div>

          {/* Page number footer */}
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-serif shrink-0">
            <span>Evidence Pilot PDF Compiler</span>
            <span>Trang {pageIndex + 1} / {pages.length}</span>
          </div>
        </div>
      );
    });
  };

  const generateRichTextHtml = (latexCode) => {
    const titleMatch = latexCode.match(/\\title\{([^}]+)\}/);
    const authorMatch = latexCode.match(/\\author\{([^}]+)\}/);

    let body = latexCode.replace(/\\documentclass.*?\n/g, '')
      .replace(/\\usepackage.*?\n/g, '')
      .replace(/\\title\{.*?\}/g, '')
      .replace(/\\author\{.*?\}/g, '')
      .replace(/\\date\{.*?\}/g, '')
      .replace(/\\begin\{document\}/g, '')
      .replace(/\\end\{document\}/g, '')
      .replace(/\\maketitle/g, '');

    const sections = body.split(/\\section\{([^}]+)\}/);
    let html = '';

    if (titleMatch) {
      html += `<h1 class="text-3xl font-bold mb-2 text-slate-900">${titleMatch[1].replace(/\\\\/g, ' ')}</h1>`;
    }
    if (authorMatch) {
      html += `<p class="text-sm text-slate-500 mb-8 italic">By ${authorMatch[1]}</p>`;
    }

    const parseText = (text) => {
      let parsed = text;
      parsed = parsed.replace(/\\hl\{([^}]+)\}/g, '<span class="bg-yellow-200/50 px-1.5 rounded text-slate-800 border-b border-yellow-300">$1</span>');
      parsed = parsed.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
      parsed = parsed.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
      parsed = parsed.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1" class="text-indigo-600 underline" target="_blank">$2</a>');
      parsed = parsed.replace(/(?:\\large\{([^}]+)\}|\{\\large\s+([^}]+)\})/g, '<span class="text-lg">$1$2</span>');
      parsed = parsed.replace(/(?:\\small\{([^}]+)\}|\{\\small\s+([^}]+)\})/g, '<span class="text-xs">$1$2</span>');
      return parsed;
    };

    if (sections[0] && sections[0].trim()) {
      html += `<p class="mb-6 text-[15px] text-slate-700">${parseText(sections[0].trim())}</p>`;
    }

    for (let i = 1; i < sections.length; i += 2) {
      const sectionTitle = sections[i];
      const sectionContent = sections[i + 1] || '';

      html += `<h2 class="text-xl font-bold mb-3 text-slate-800">${sectionTitle}</h2>`;

      const paragraphs = sectionContent.split('\n\n').filter(p => p.trim());
      paragraphs.forEach(p => {
        html += `<p class="mb-6 text-[15px] text-slate-700">${parseText(p.trim())}</p>`;
      });
    }

    return html;
  };

  const parseHtmlToLatex = (container) => {
    let newLatex = `\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\n`;
    Array.from(container.children).forEach(child => {
      if (child.tagName === 'H1') {
        newLatex += `\\title{${child.innerText}}\n`;
      } else if (child.tagName === 'P' && child.innerText.startsWith('By ')) {
        newLatex += `\\author{${child.innerText.substring(3)}}\n\\date{\\today}\n\n\\begin{document}\n\n\\maketitle\n\n`;
      } else if (child.tagName === 'H2') {
        newLatex += `\\section{${child.innerText}}\n\n`;
      } else if (child.tagName === 'P') {
        let text = child.innerHTML
          .replace(/<strong>(.*?)<\/strong>/gi, '\\textbf{$1}')
          .replace(/<b>(.*?)<\/b>/gi, '\\textbf{$1}')
          .replace(/<em>(.*?)<\/em>/gi, '\\textit{$1}')
          .replace(/<i>(.*?)<\/i>/gi, '\\textit{$1}')
          .replace(/<span[^>]*class="bg-yellow[^"]*"[^>]*>(.*?)<\/span>/gi, '\\hl{$1}')
          .replace(/<span[^>]*class="text-lg"[^>]*>(.*?)<\/span>/gi, '\\large{$1}')
          .replace(/<span[^>]*class="text-xs"[^>]*>(.*?)<\/span>/gi, '\\small{$1}')
          .replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '\\href{$1}{$2}')
          .replace(/&nbsp;/g, ' ');
        text = text.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<[^>]*>?/gm, '');
        if (text.trim()) newLatex += `${text}\n\n`;
      }
    });
    return newLatex.trim();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Link to="/student/projects" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Back to Projects">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')} title="Go to Home">
            <div className="w-7 h-7 bg-indigo-600 text-white rounded-md text-xs flex items-center justify-center font-bold shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">EP</div>
            {projects.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={project?.id || ''}
                  onChange={(e) => navigate(`/student/projects/${e.target.value}`)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCreateProject}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                  title={UI_TEXT[language].newProject}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">{UI_TEXT[language].noProjects}</span>
                <button
                  onClick={handleCreateProject}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded transition-colors"
                >
                  {UI_TEXT[language].createProject}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-xs text-slate-400 mr-2 font-medium">{UI_TEXT[language].workspaceDescription}</div>
          {activePaperFeedbacks.length > 0 && (
            <div className={`flex gap-1.5 border rounded-full px-1 py-1 ${
              latestPaperFb?.status === 'RETURNED' ? 'bg-rose-50 border-rose-100' :
              latestPaperFb?.status === 'PENDING' ? 'bg-amber-50 border-amber-100' :
              latestPaperFb?.status === 'REVIEWED' ? 'bg-emerald-50 border-emerald-100' :
              'bg-blue-50 border-blue-100'
            }`}>
              <span className={`text-[11px] px-2 py-0.5 font-semibold rounded-full bg-white shadow-sm ${
                latestPaperFb?.status === 'RETURNED' ? 'text-rose-700' :
                latestPaperFb?.status === 'PENDING' ? 'text-amber-700' :
                latestPaperFb?.status === 'REVIEWED' ? 'text-emerald-700' :
                'text-blue-700'
              }`}>
                {latestPaperFb?.status === 'RETURNED' && (language === 'vi' ? 'Đã trả về với phản hồi' : 'Returned with Feedback')}
                {latestPaperFb?.status === 'PENDING' && (language === 'vi' ? 'Đang chờ duyệt' : 'In Review')}
                {latestPaperFb?.status === 'REVIEWED' && (language === 'vi' ? 'Đã phê duyệt' : 'Approved')}
              </span>
              <span className={`text-[11px] px-2 py-0.5 font-semibold rounded-full bg-white shadow-sm flex items-center gap-1 ${
                latestPaperFb?.status === 'RETURNED' ? 'text-rose-700' :
                latestPaperFb?.status === 'PENDING' ? 'text-amber-700' :
                latestPaperFb?.status === 'REVIEWED' ? 'text-emerald-700' :
                'text-blue-700'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  latestPaperFb?.status === 'RETURNED' ? 'bg-rose-500' :
                  latestPaperFb?.status === 'PENDING' ? 'bg-amber-500' :
                  latestPaperFb?.status === 'REVIEWED' ? 'bg-emerald-500' :
                  'bg-blue-500'
                }`}></div>
                {activePaperFeedbacks.length} {UI_TEXT[language].feedbacks}
              </span>
            </div>
          )}

          <button
            onClick={() => navigate('/student/projects')}
            className="text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all ml-1"
          >
            Projects
          </button>
          <button
            onClick={toggleLanguage}
            className="text-xs font-semibold text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all ml-1"
            title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            {language === 'vi' ? 'EN' : 'VI'}
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-xs font-medium text-slate-500 hover:text-red-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-red-200 hover:bg-red-50 transition-all ml-1"
          >
            {UI_TEXT[language].signOut}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div id="workspace-container" className="flex-1 flex overflow-hidden">
        {/* Activity Bar (Dark sidebar like VS Code / Overleaf) */}
        <div className="w-14 bg-slate-950 flex flex-col justify-between py-4 shrink-0 z-20 border-r border-slate-900 shadow-[2px_0_8px_rgba(0,0,0,0.5)]">
          <div className="w-full flex flex-col items-center gap-6">
            {/* Logo */}
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg text-sm flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
              EP
            </div>
            
            {/* File Tree Toggle */}
            <button
              onClick={() => setIsFileTreeOpen(!isFileTreeOpen)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors group relative ${isFileTreeOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              title={UI_TEXT[language].fileTree}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              <span className="absolute left-14 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md">{UI_TEXT[language].fileTree}</span>
            </button>


            {/* AI Assistant drawer toggle */}
            <button
              onClick={handleAiAssistantClick}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors group relative ${isDrawerOpen && activeTab === 'Claims' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              title={UI_TEXT[language].aiAssistant}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              <span className="absolute left-14 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md">{UI_TEXT[language].aiAssistant}</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => showToast('Settings opened')}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors group relative"
              title={UI_TEXT[language].settings}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="absolute left-14 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md">{UI_TEXT[language].settings}</span>
            </button>
          </div>
          
          <div className="w-full flex flex-col items-center gap-4">
            {/* Toggle language */}
            <button
              onClick={toggleLanguage}
              className="text-xs font-black text-indigo-400 hover:text-white transition-colors w-8 h-8 rounded-full border border-slate-800 hover:border-slate-600 flex items-center justify-center bg-slate-900"
            >
              {language === 'vi' ? 'EN' : 'VI'}
            </button>
            {/* Sign Out */}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors group relative"
              title={UI_TEXT[language].signOut}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="absolute left-14 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md">{UI_TEXT[language].signOut}</span>
            </button>
          </div>
        </div>

        {/* Panel 1: File Tree & Outline (Left Sidebar) */}
        <aside
          style={{ width: isFileTreeOpen ? `${fileTreeWidth}px` : '0px' }}
          className={`bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 relative z-10 ${!isFileTreeOpen ? 'overflow-hidden border-r-0' : ''}`}
        >
          {/* File Tree Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-100">
            <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">{UI_TEXT[language].projectFiles}</span>
            <div className="flex gap-1.5 text-slate-400">
              <label className="hover:text-indigo-600 transition-colors cursor-pointer" title="Tải lên bản thảo mới">
                <input
                  type="file"
                  className="hidden"
                  accept=".tex,.pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadPaper(e.target.files[0]);
                    }
                  }}
                />
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              </label>
            </div>
          </div>

          {/* Directory Tree View */}
          <div className="p-3 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {/* Root folder representing the Project */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 truncate mb-2">
                <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <span className="truncate">{project?.title || 'Dự án nghiên cứu'}</span>
              </div>
              
              {/* Folders */}
              <div className="pl-3 space-y-3">
                {/* Folder 1: Paper Workspace */}
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>📂 {UI_TEXT[language].paperDrafts}</span>
                  </div>
                  <div className="pl-3 space-y-1.5">
                    {papers.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic block py-1">{UI_TEXT[language].empty}</span>
                    ) : (
                      <div className="space-y-1">
                        {/* 1. main.tex */}
                        {(() => {
                          const p = papers.find(x => x.filename === 'main.tex');
                          if (!p) return null;
                          return (
                            <div
                              key={p.id}
                              onClick={async () => {
                                setSelectedPaper(p);
                                loadCode(p.content || '');
                                localStorage.setItem('current_selected_paper_id', p.id);
                                await syncClaimsFromCode(getCompiledLatex(), projectId);
                              }}
                              className={`flex items-center justify-between text-xs font-semibold p-1.5 rounded cursor-pointer transition-all group ${selectedPaper?.id === p.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span>📄</span>
                                <span className="truncate font-semibold" title={p.filename}>{p.filename}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. references.bib */}
                        {(() => {
                          const p = papers.find(x => x.filename === 'references.bib');
                          if (!p) return null;
                          return (
                            <div
                              key={p.id}
                              onClick={async () => {
                                setSelectedPaper(p);
                                loadCode(p.content || '');
                                localStorage.setItem('current_selected_paper_id', p.id);
                                await syncClaimsFromCode(getCompiledLatex(), projectId);
                              }}
                              className={`flex items-center justify-between text-xs font-semibold p-1.5 rounded cursor-pointer transition-all group ${selectedPaper?.id === p.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span>📚</span>
                                <span className="truncate font-semibold" title={p.filename}>{p.filename}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. Folder sections/ */}
                        <div className="mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                            <span>📂 sections</span>
                          </div>
                          <div className="pl-3 space-y-0.5 border-l border-slate-200">
                            {papers
                              .filter(p => p.filename.startsWith('sections/'))
                              .sort((a, b) => a.filename.localeCompare(b.filename))
                              .map(p => {
                                const cleanFilename = p.filename.split('/').pop();
                                const memberObj = project?.members?.find(m => m.email === p.assignedTo);
                                const initialsBadge = memberObj ? `[${memberObj.role}]` : '';

                                return (
                                  <div
                                    key={p.id}
                                    onClick={async () => {
                                      setSelectedPaper(p);
                                      loadCode(p.content || '');
                                      localStorage.setItem('current_selected_paper_id', p.id);
                                      await syncClaimsFromCode(getCompiledLatex(), projectId);
                                    }}
                                    className={`flex items-center justify-between text-[11px] font-medium p-1.5 rounded cursor-pointer transition-all group ${selectedPaper?.id === p.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                                  >
                                    <div className="flex items-center justify-between w-full truncate">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span>📝</span>
                                        <span className="truncate" title={cleanFilename}>{cleanFilename}</span>
                                      </div>
                                      {initialsBadge && (
                                        <span className="text-[9px] font-black text-indigo-650 bg-indigo-50 px-1 rounded shrink-0 scale-90">
                                          {initialsBadge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Folder 2: Sources */}
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <span>📂 {UI_TEXT[language].sources}</span>
                  </div>
                  <div className="pl-3 space-y-1">
                    {sources.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic block py-1">{UI_TEXT[language].empty}</span>
                    ) : (
                      sources.map(src => (
                        <div
                          key={src.id}
                          onClick={() => {
                            setViewerFile({
                              fileUrl: import.meta.env.VITE_API_BASE_URL + `/api/sources/${src.id}/view`,
                              fileName: src.originalFilename || src.filename || src.name || 'document.pdf'
                            });
                          }}
                          className="flex items-center justify-between text-xs font-medium p-1.5 rounded hover:bg-slate-200/60 cursor-pointer transition-all group text-slate-600"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                            <span className="truncate" title={src.originalFilename || src.filename || src.name}>{src.originalFilename || src.filename || src.name || 'document.pdf'}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSource(src.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all p-0.5"
                            title="Xóa tài liệu"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Outline */}
          <div className="border-t border-slate-200 flex flex-col h-[40%] bg-slate-100/30">
            <div className="px-4 py-2 border-b border-slate-200 flex items-center bg-slate-100">
              <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">{UI_TEXT[language].sectionOutline}</span>
            </div>
            <div className="p-3 overflow-y-auto flex-1 custom-scrollbar text-xs">
              {getOutlineSections().length === 0 ? (
                <div className="text-slate-400 italic text-center py-4">Không tìm thấy tiêu đề \section nào trong tài liệu.</div>
              ) : (
                getOutlineSections().map((sec, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSectionClick(sec.title)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 hover:text-indigo-700 cursor-pointer truncate transition-colors flex items-center gap-2 font-medium"
                  >
                    <span className="text-indigo-500 font-bold font-mono">§{idx + 1}</span>
                    <span className="truncate" title={sec.title}>{sec.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
        {isFileTreeOpen && (
          <div
            onMouseDown={handleLeftDividerMouseDown}
            className="w-1 hover:w-1.5 bg-slate-200 hover:bg-slate-400 cursor-col-resize self-stretch transition-all shrink-0 z-30 relative group flex items-center justify-center border-r border-slate-200/80"
            title="Kéo để thay đổi kích thước"
          >
            <div className="h-6 w-0.5 bg-slate-400 group-hover:bg-slate-500 rounded"></div>
          </div>
        )}


        {/* Center Panes: Editor & Preview */}
        <div id="editor-preview-container" className="flex-1 flex overflow-hidden bg-slate-200/50 p-2 gap-2">
          
          {/* Panel 2: LaTeX Editor */}
          <div
            style={{ width: `${editorWidth}%`, flexGrow: 0, flexShrink: 0 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Editor Header */}
            <div className="h-10 border-b border-slate-100 flex items-center justify-between px-3 bg-white shadow-sm shrink-0 z-10">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wide font-mono">LaTeX</span>
                <span className="text-xs font-bold text-slate-700 truncate">
                  Drafts / {selectedPaper ? selectedPaper.originalFilename : 'main.tex'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {selectedPaper && (
                  <button
                    onClick={handleRunAiReview}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                    title="AI Review cấu trúc và định dạng"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    {UI_TEXT[language].aiReview}
                  </button>
                )}
                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => setEditorMode('Code')}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-colors ${editorMode === 'Code' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                    Code
                  </button>
                  <button
                    onClick={() => setEditorMode('Rich Text')}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-colors ${editorMode === 'Rich Text' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                    Visual
                  </button>
                </div>
              </div>
            </div>



            {/* LaTeX Text Formatting & Advanced Utility Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 flex flex-col shrink-0 select-none">
              {/* Row 1: LaTeX formatting & inserts */}
              <div className="h-9 flex items-center justify-between px-3 border-b border-slate-100 gap-1">
                <div className="flex-1 flex items-center gap-1 overflow-x-auto min-w-0 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* Undo */}
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-600 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Hoàn tác (Undo)"
                  >
                    <span className="text-xs">↶</span>
                  </button>
                  {/* Redo */}
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= codeHistory.length - 1}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-600 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Làm lại (Redo)"
                  >
                    <span className="text-xs">↷</span>
                  </button>

                  <div className="w-px h-4 bg-slate-200 mx-1"></div>

                  {/* TT Heading size menu */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowTextSizeMenu(!showTextSizeMenu);
                        setShowSymbolMenu(false);
                      }}
                      className="h-7 px-1.5 flex items-center gap-1 hover:bg-slate-200 rounded text-slate-700 font-extrabold text-[11px] transition-colors cursor-pointer"
                      title="Tiêu đề & Cỡ chữ (Heading / Font size)"
                    >
                      <span>TT</span>
                      <span className="text-[7px]">▼</span>
                    </button>
                    {showTextSizeMenu && (
                      <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-32 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                        <button onClick={() => { insertLatexTag('section'); setShowTextSizeMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer">Section</button>
                        <button onClick={() => { insertLatexTag('subsection'); setShowTextSizeMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">Sub-section</button>
                        <button onClick={() => { insertLatexTag('subsubsection'); setShowTextSizeMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs text-slate-700 cursor-pointer">Sub-sub-section</button>
                        <hr className="border-slate-150 my-1" />
                        <button onClick={() => { insertLatexTag('large'); setShowTextSizeMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs text-slate-700 cursor-pointer">Large font</button>
                        <button onClick={() => { insertLatexTag('small'); setShowTextSizeMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-[10px] text-slate-700 cursor-pointer">Small font</button>
                      </div>
                    )}
                  </div>

                  {/* Bold B */}
                  <button
                    onClick={() => insertLatexTag('bold')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 font-extrabold font-serif transition-colors cursor-pointer"
                    title="In đậm (Bold)"
                  >
                    B
                  </button>
                  {/* Italic I */}
                  <button
                    onClick={() => insertLatexTag('italic')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 italic font-serif transition-colors cursor-pointer"
                    title="In nghiêng (Italic)"
                  >
                    I
                  </button>

                  {/* Math */}
                  <button
                    onClick={() => insertLatexTag('inline-math')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 font-serif text-xs transition-colors cursor-pointer"
                    title="Chèn công thức toán ($inline$)"
                  >
                    $
                  </button>
                  <button
                    onClick={() => insertLatexTag('equation')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 font-serif text-xs transition-colors cursor-pointer"
                    title="Khối công thức toán (equation)"
                  >
                    ∑
                  </button>

                  {/* Omega Symbol Picker */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowSymbolMenu(!showSymbolMenu);
                        setShowTextSizeMenu(false);
                      }}
                      className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 font-bold transition-colors cursor-pointer"
                      title="Ký tự Hy Lạp (Ω Symbols)"
                    >
                      Ω
                    </button>
                    {showSymbolMenu && (
                      <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-2 w-48 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { code: '\\alpha', char: 'α' },
                            { code: '\\beta', char: 'β' },
                            { code: '\\gamma', char: 'γ' },
                            { code: '\\delta', char: 'δ' },
                            { code: '\\epsilon', char: 'ε' },
                            { code: '\\theta', char: 'θ' },
                            { code: '\\lambda', char: 'λ' },
                            { code: '\\pi', char: 'π' },
                            { code: '\\omega', char: 'ω' },
                            { code: '\\sigma', char: 'σ' },
                            { code: '\\infty', char: '∞' },
                            { code: '\\pm', char: '±' },
                            { code: '\\approx', char: '≈' },
                            { code: '\\neq', char: '≠' },
                            { code: '\\le', char: '≤' },
                            { code: '\\ge', char: '≥' }
                          ].map(sym => (
                            <button
                              key={sym.code}
                              onClick={() => {
                                insertSymbol(sym.code);
                                setShowSymbolMenu(false);
                              }}
                              className="h-7 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 flex items-center justify-center cursor-pointer hover:text-indigo-600"
                              title={sym.code}
                            >
                              {sym.char}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-4 bg-slate-200 mx-1"></div>

                  {/* Link */}
                  <button
                    onClick={() => insertLatexTag('link')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chèn liên kết (Hyperlink)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </button>

                  {/* Comment */}
                  <button
                    onClick={() => insertLatexTag('comment')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chèn bình luận (Comment)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </button>

                  {/* Label */}
                  <button
                    onClick={() => insertLatexTag('label')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chèn Nhãn (Label)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </button>

                  {/* Citation */}
                  <button
                    onClick={() => insertLatexTag('cite')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chèn Trích dẫn (Citation)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </button>

                  {/* Figure */}
                  <button
                    onClick={() => insertLatexTag('figure')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chèn khung Hình ảnh (Figure)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </button>

                  {/* Table */}
                  <button
                    onClick={() => insertLatexTag('table')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    title="Chèn Bảng biểu (Table)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Search Kính lúp */}
                  <button
                    onClick={() => setShowSearchPanel(!showSearchPanel)}
                    className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${showSearchPanel ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200 text-slate-700'}`}
                    title="Tìm kiếm & Thay thế (Find & Replace)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>

              <div className="h-8 flex items-center justify-between px-3 bg-slate-50/70 border-t border-slate-100 gap-1">
                <div className="flex items-center gap-2">
                  {(() => {
                    const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
                    const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
                    const isPL = userRole === 'PL';
                    const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
                    const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
                    
                    if (selectedPaper && selectedPaper.filename.startsWith('sections/') && allowed && selectedPaper.status === 'DRAFT') {
                      return (
                        <button
                          onClick={handleSubmitSectionReview}
                          className="px-2 py-0.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-extrabold transition shadow-sm cursor-pointer flex items-center gap-1 shrink-0 border border-violet-750"
                          title="Nộp riêng phần này lên giảng viên phê duyệt"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                          Nộp phê duyệt
                        </button>
                      );
                    }
                    return <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">TIỆN ÍCH HỆ THỐNG</span>;
                  })()}
                </div>
                <div className="flex items-center gap-1">
                  {/* Export / Download */}
                  <button
                    onClick={handleDownloadTex}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="Tải về file LaTeX (.tex)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                  {/* Sync / Refresh */}
                  <button
                    onClick={handleSyncContent}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="Đồng bộ hóa / Lưu lên server"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                  {/* Settings */}
                  <button
                    onClick={() => showToast('Cài đặt biên tập LaTeX đã mở.')}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="Cấu hình soạn thảo"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                </div>
              </div>

              {/* Row 3 (Optional / Dynamic): Find & Replace panel */}
              {showSearchPanel && (
                <div className="bg-indigo-50/55 px-4 py-2 border-t border-slate-200 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tìm:</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Từ khóa..."
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 w-36 outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Thay thế:</label>
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      placeholder="Chuỗi mới..."
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 w-36 outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleFindReplace(false)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
                    >
                      Thay thế cái đầu
                    </button>
                    <button
                      onClick={() => handleFindReplace(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Thay thế tất cả
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lock / Status Alert Banners */}
            {(() => {
              const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
              const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
              const isPL = userRole === 'PL';
              const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
              const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
              
              if (!allowed && selectedPaper) {
                return (
                  <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs flex items-center gap-2 font-medium shrink-0">
                    <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>Chế độ chỉ xem. File này do <strong>{selectedPaper.assignedTo || 'Trưởng nhóm (PL)'}</strong> chịu trách nhiệm chỉnh sửa.</span>
                  </div>
                );
              }
              if (selectedPaper?.status === 'APPROVED') {
                return (
                  <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs flex items-center gap-2 font-medium shrink-0">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Đã phê duyệt! Section này đã được giảng viên duyệt và không cần chỉnh sửa thêm.</span>
                  </div>
                );
              }
              if (selectedPaper?.status === 'SUBMITTED') {
                return (
                  <div className="bg-indigo-50 border-b border-indigo-200 text-indigo-800 px-4 py-2 text-xs flex items-center gap-2 font-medium shrink-0">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Đang chờ duyệt! Phần này đã được nộp lên giảng viên để chờ đánh giá.</span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Code / Visual Mode Container */}
            {editorMode === 'Code' ? (
              <div className="relative flex-1 flex bg-[#0d1117] overflow-hidden">
                {/* Gutter: Line numbers and Syntax warnings */}
                <div
                  id="editor-gutter"
                  className="w-11 bg-[#090d12] border-r border-[#1a1f26] text-[#4f5b66] font-mono text-[12px] pt-5 text-right pr-2 select-none overflow-hidden shrink-0"
                  style={{ lineHeight: '26px' }}
                >
                  {(codeContent || '').split('\n').map((_, i) => {
                    const errorMsg = getSyntaxErrors()[i];
                    const isError = errorMsg !== undefined;
                    return (
                      <div key={i} className="h-[26px] relative pr-1.5 flex items-center justify-end">
                        {isError && (
                          <div className="absolute left-1.5 group/tooltip z-30 flex items-center">
                            <span
                              className="w-2 h-2 rounded-full bg-rose-500 animate-pulse cursor-help"
                            />
                            {/* Custom instant tooltip */}
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover/tooltip:flex flex-col bg-slate-900 border border-slate-700 text-white text-[11px] rounded-lg p-2.5 shadow-2xl z-50 pointer-events-none whitespace-normal w-56 text-left leading-normal animate-in fade-in zoom-in-95 duration-150">
                              <div className="flex items-center gap-1.5 mb-1 font-bold text-[9px] uppercase tracking-wider text-rose-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Lỗi cú pháp LaTeX
                              </div>
                              <span className="text-slate-200">{errorMsg}</span>
                            </div>
                          </div>
                        )}
                        <span>{i + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Editor code area */}
                <div className="flex-1 relative overflow-hidden h-full">
                  <textarea
                    id="latex-textarea"
                    value={codeContent}
                    onChange={(e) => {
                      const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
                      const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
                      const isPL = userRole === 'PL';
                      const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
                      const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
                      if (allowed && selectedPaper?.status !== 'APPROVED') {
                        updateCode(e.target.value);
                      }
                    }}
                    readOnly={(() => {
                      const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
                      const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
                      const isPL = userRole === 'PL';
                      const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
                      const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
                      return !allowed || selectedPaper?.status === 'APPROVED';
                    })()}
                    onScroll={handleScroll}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white resize-none outline-none z-10 m-0 border-0 font-mono text-[13px] p-5 whitespace-pre overflow-auto custom-scrollbar"
                    style={{ lineHeight: '26px' }}
                  />
                  <pre
                    ref={preRef}
                    className="absolute inset-0 w-full h-full pointer-events-none text-slate-300 m-0 border-0 font-mono text-[13px] p-5 whitespace-pre overflow-auto custom-scrollbar"
                    style={{ lineHeight: '26px' }}
                    aria-hidden="true"
                  >
                    {(codeContent || '').split('\n').map((line, index) => {
                      const lineError = getSyntaxErrors()[index];
                      const isLineError = lineError !== undefined;
                      const lineParts = line.split(/(\\[a-zA-Z]+|\{[^{}]*\})/g).map((part, j) => {
                        if (!part) return null;
                        if (part.startsWith('\\')) return <span key={j} className="text-[#ff7b72]">{part}</span>;
                        if (part.startsWith('{') && part.endsWith('}')) {
                          return (
                            <span key={j} className="text-[#a5d6ff]">
                              <span className="text-slate-500">{'{'}</span>
                              {part.slice(1, -1)}
                              <span className="text-slate-500">{'}'}</span>
                            </span>
                          );
                        }
                        return <span key={j} className="text-slate-100">{part}</span>;
                      });

                      return (
                        <div
                          key={index}
                          className={`h-[26px] whitespace-pre ${
                            isLineError ? 'bg-rose-950/25 border-b border-dashed border-rose-500/30' : ''
                          }`}
                          style={{ lineHeight: '26px' }}
                        >
                          {lineParts.length === 0 ? '\n' : lineParts}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </div>
            ) : (
              <RichTextEditor
                initialHtml={generateRichTextHtml(codeContent)}
                readOnly={(() => {
                  const userRoleObj = project?.members?.find(m => m.email === currentUser?.email);
                  const userRole = userRoleObj ? userRoleObj.role : (project?.ownerId === currentUser?.id ? 'PL' : '');
                  const isPL = userRole === 'PL';
                  const isAssigned = selectedPaper?.assignedTo === currentUser?.email;
                  const allowed = selectedPaper?.filename === 'main.tex' || selectedPaper?.filename === 'references.bib' ? isPL : isAssigned;
                  return !allowed || selectedPaper?.status === 'APPROVED';
                })()}
                onHtmlChange={(target) => {
                  const newCode = parseHtmlToLatex(target);
                  updateCode(newCode);
                }}
              />
            )}
          </div>

          {/* Divider Handle between Editor and PDF Preview */}
          <div
            onMouseDown={handleMouseDown}
            className="w-2 cursor-col-resize self-stretch shrink-0 z-30 relative group flex items-center justify-center -mx-2"
            title="Kéo để thay đổi kích thước"
          >
            <div className="w-1 h-12 rounded bg-slate-300 group-hover:bg-slate-400 transition-colors"></div>
          </div>

          {/* Panel 3: PDF Preview */}
          <div
            style={{ width: `${100 - editorWidth}%`, flexGrow: 0, flexShrink: 0 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden relative"
          >
            {/* Collapse / Expand right drawer floating button tab */}
            {!isDrawerOpen && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-r-0 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 w-5 h-16 rounded-l-xl flex items-center justify-center shadow-md transition-all z-45 group cursor-pointer"
                title="Mở bảng điều khiển phải"
              >
                <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {/* Preview Header */}
            <div className="h-10 border-b border-slate-100 flex items-center justify-between px-3 bg-white shrink-0 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                  {UI_TEXT[language].pdfHeader}
                </span>
                
                {/* Syntax Error count pill */}
                {Object.keys(getSyntaxErrors()).length > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse" title="Phát hiện lỗi cú pháp">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    {Object.keys(getSyntaxErrors()).length} lỗi
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Download PDF button */}
                <button
                  onClick={() => {
                    const blob = new Blob([displayContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = selectedPaper ? (selectedPaper.originalFilename || selectedPaper.filename || 'main.tex') : 'main.tex';
                    link.click();
                    showToast('Đã xuất bản mã nguồn LaTeX (.tex)');
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                  title="Tải xuống tệp LaTeX"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12" /></svg>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border border-slate-200 rounded bg-slate-50 p-0.5 text-[11px] font-bold text-slate-600">
                  <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className="px-1.5 py-0.5 hover:bg-white rounded hover:shadow-sm" title="Thu nhỏ">-</button>
                  <span className="px-1 select-none min-w-[32px] text-center">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))} className="px-1.5 py-0.5 hover:bg-white rounded hover:shadow-sm" title="Phóng to">+</button>
                </div>

                {/* Recompile Button */}
                <button
                  onClick={handleRecompile}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-102 duration-150"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {UI_TEXT[language].recompile}
                </button>
              </div>
            </div>

            {/* Document preview container */}
            <div className="flex-1 bg-slate-200/60 p-6 overflow-auto custom-scrollbar relative">
              {/* Compile Loading Overlay */}
              {isCompiling && (
                <div className="absolute inset-0 bg-slate-200/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                  <div className="animate-spin rounded-full h-9 w-9 border-4 border-emerald-500 border-t-transparent shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-700">Đang tạo bản xem trước PDF...</span>
                </div>
              )}
              
              {/* Scale preview document */}
              <div
                className="transition-all duration-200 h-max mx-auto origin-top w-[720px]"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                }}
              >
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
        {isDrawerOpen && (
          <div
            onMouseDown={handleRightDividerMouseDown}
            className="w-1 hover:w-1.5 bg-slate-200 hover:bg-slate-400 cursor-col-resize self-stretch transition-all shrink-0 z-30 relative group flex items-center justify-center border-l border-slate-200/80"
            title="Kéo để thay đổi kích thước"
          >
            <div className="h-6 w-0.5 bg-slate-400 group-hover:bg-slate-500 rounded"></div>
          </div>
        )}
        <aside
          style={{ width: isDrawerOpen ? `${rightDrawerWidth}px` : '0px' }}
          className={`bg-white border-l border-slate-200 flex flex-col shrink-0 relative z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] ${!isDrawerOpen ? 'overflow-hidden border-l-0' : ''}`}
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white relative shrink-0">
            <button
              onClick={() => handleTabClick('Source')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col justify-center items-center gap-1 transition-all relative ${activeTab === 'Source' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {UI_TEXT[language].tabSource}
              {activeTab === 'Source' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_-2px_8px_rgba(79,70,229,0.5)]"></div>}
            </button>
            <button
              onClick={() => handleTabClick('Claims')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col justify-center items-center gap-1 transition-all relative ${activeTab === 'Claims' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              {UI_TEXT[language].tabClaims}
              {activeTab === 'Claims' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_-2px_8px_rgba(79,70,229,0.5)]"></div>}
            </button>
            <button
              onClick={() => handleTabClick('Feedback')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col justify-center items-center gap-1 transition-all relative ${activeTab === 'Feedback' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <div className="relative">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                {activePaperFeedbacks.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white flex items-center justify-center text-[9px] w-4 h-4 rounded-full font-bold animate-pulse">{activePaperFeedbacks.length}</span>
                )}
              </div>
              {UI_TEXT[language].tabFeedback}
              {activeTab === 'Feedback' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_-2px_8px_rgba(79,70,229,0.5)]"></div>}
            </button>
            <button
              onClick={() => handleTabClick('Graph')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col justify-center items-center gap-1 transition-all relative ${activeTab === 'Graph' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
              {UI_TEXT[language].tabGraph}
              {activeTab === 'Graph' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_-2px_8px_rgba(79,70,229,0.5)]"></div>}
            </button>
            <button
              onClick={() => handleTabClick('Team')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col justify-center items-center gap-1 transition-all relative ${activeTab === 'Team' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              {language === 'vi' ? 'Thành viên' : 'Team'}
              {activeTab === 'Team' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_-2px_8px_rgba(79,70,229,0.5)]"></div>}
            </button>
            
            {/* Collapse button */}
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="px-2 text-slate-400 hover:text-slate-850 border-l border-slate-200 transition-colors"
              title="{UI_TEXT[language].closeBtn}"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">

            {/* 1. PROJECT INFO TAB */}
            {activeTab === 'Source' && (
              <div className="p-5 flex flex-col gap-6 animate-in fade-in duration-300">
                <label className={`w-full flex justify-center items-center gap-2 border-2 border-dashed rounded-xl p-6 transition-all group mb-6 shadow-sm cursor-pointer ${isUploading ? 'border-indigo-300 bg-indigo-100/50 opacity-60 pointer-events-none' : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50'}`}>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    disabled={isUploading}
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (!project) {
                          showToast('No project selected to upload to.');
                          return;
                        }
                        setIsUploading(true);
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          await api.post(`/api/sources/upload?uploadedBy=${user.id}&projectId=${project.id}`, formData);
                          showToast(`${file.name} uploaded successfully.`);
                          const srcRes = await api.get(`/api/projects/${project.id}/sources`);
                          setSources(srcRes.data);
                        } catch (err) {
                          console.error('Upload failed', err);
                          showToast(`Failed to upload ${file.name}`);
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                  />
                  <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    {isUploading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-indigo-700">{isUploading ? UI_TEXT[language].uploadingText : UI_TEXT[language].uploadBtn}</span>
                </label>

                {/* Thanh tìm kiếm tài liệu */}
                <div className="mb-4 relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài liệu..."
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl px-9 py-2.5 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-slate-800"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {docSearchQuery && (
                    <button
                      onClick={() => setDocSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors font-bold text-xs"
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 tracking-widest mb-3 uppercase flex items-center gap-2">
                    <div className="h-px bg-slate-200 flex-1"></div> {UI_TEXT[language].sharedResources} <div className="h-px bg-slate-200 flex-1"></div>
                  </h3>
                  {(() => {
                    const filteredCollections = sharedCollections
                      .filter(col => !col.paperId || String(col.paperId) === String(selectedPaper?.id))
                      .filter(col => {
                        if (!docSearchQuery) return true;
                        const query = docSearchQuery.toLowerCase();
                        const matchCol = col.title.toLowerCase().includes(query) || (col.description && col.description.toLowerCase().includes(query));
                        const colDocs = sharedDocuments.filter(doc => doc.collectionId === col.id);
                        const matchDocs = colDocs.some(doc => doc.name.toLowerCase().includes(query) || (doc.description && doc.description.toLowerCase().includes(query)));
                        return matchCol || matchDocs;
                      });
                    return filteredCollections.length === 0 ? (
                      <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 w-full">
                        Không tìm thấy tài liệu chia sẻ phù hợp.
                      </div>
                    ) : (
                      filteredCollections.map(col => {
                        const colDocs = sharedDocuments
                          .filter(doc => doc.collectionId === col.id)
                          .filter(doc => {
                            if (!docSearchQuery) return true;
                            const query = docSearchQuery.toLowerCase();
                            const matchDoc = doc.name.toLowerCase().includes(query) || (doc.description && doc.description.toLowerCase().includes(query));
                            const matchCol = col.title.toLowerCase().includes(query);
                            return matchDoc || matchCol;
                          });
                        return (
                          <div key={col.id} className="bg-white border border-slate-200 rounded-xl shadow-sm mb-3 hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-3.5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                              <div>
                                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">{col.title}</h4>
                                {col.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{col.description}</p>}
                              </div>
                              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md shadow-sm">{colDocs.length}</span>
                            </div>
                            <div className="p-0">
                              {colDocs.map(doc => (
                                <div 
                                  key={doc.id}
                                  onClick={() => setViewerFile({ 
                                    fileUrl: doc.fileUrl || '/api/sources/shared-1/view', 
                                    fileName: doc.name 
                                  })} 
                                  className="px-4 py-2.5 border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    </svg>
                                    {doc.name}
                                  </p>
                                  {doc.description && <p className="text-[11px] text-slate-400 mt-1 pl-5">{doc.description}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    );
                  })()}
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 tracking-widest mb-3 uppercase flex items-center gap-2">
                    <div className="h-px bg-slate-200 flex-1"></div> {UI_TEXT[language].uploadedSources} <div className="h-px bg-slate-200 flex-1"></div>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {(() => {
                      const filteredSources = sources
                        .filter(src => !src.paperId || String(src.paperId) === String(selectedPaper?.id))
                        .filter(src => {
                          if (!docSearchQuery) return true;
                          const query = docSearchQuery.toLowerCase();
                          const filename = src.originalFilename || src.filename || src.name || "document.pdf";
                          return filename.toLowerCase().includes(query);
                        });
                      return filteredSources.length === 0 ? (
                        <div className="text-sm text-slate-500 italic text-center p-4 w-full">Không tìm thấy tài liệu tải lên phù hợp.</div>
                      ) : (
                        filteredSources.map(src => (
                          <div key={src.id} onClick={() => setViewerFile({
                            fileUrl: src.fileUrl || (import.meta.env.VITE_API_BASE_URL + `/api/sources/${src.id}/view`),
                            fileName: src.originalFilename || src.filename || src.name || "document.pdf"
                          })} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer transform hover:-translate-y-0.5">
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>{src.originalFilename || src.filename || src.name || "document.pdf"}</p>
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">Source file uploaded to this project.</p>
                          </div>
                        ))
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Danh sách Claims */}
            {activeTab === 'Claims' && (
              <div className="space-y-4">
                {/* Form thêm luận điểm mới */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex gap-2">
                  <input
                    type="text"
                    value={newClaimContent}
                    onChange={(e) => setNewClaimContent(e.target.value)}
                    placeholder={UI_TEXT[language].addClaimPlaceholder}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleCreateClaim}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-sm shrink-0"
                  >
                    {UI_TEXT[language].addClaimBtn}
                  </button>
                </div>

                {claims.length === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center py-8">{UI_TEXT[language].noClaims}</div>
                ) : (
                  claims.map(claim => {
                    const isSelected = selectedClaim?.id === claim.id;
                    const isEditing = editingClaim?.id === claim.id;

                    if (isEditing) {
                      return (
                        <div key={claim.id} className="bg-slate-50 border border-indigo-300 rounded-xl p-3.5 shadow-sm space-y-3">
                          <textarea
                            value={editClaimContent}
                            onChange={(e) => setEditClaimContent(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 h-16 resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setEditingClaim(null); setEditClaimContent(''); }}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-2.5 py-1.5 rounded-md"
                            >
                              {UI_TEXT[language].cancelBtn}
                            </button>
                            <button
                              onClick={handleUpdateClaim}
                              className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-md shadow-sm"
                            >
                              {UI_TEXT[language].saveBtn}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={claim.id}
                        onClick={() => {
                          setSelectedClaim(claim);
                          handleFetchMatches(claim.id);
                        }}
                        className={`bg-white border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer ${isSelected ? 'border-indigo-400 ring-1 ring-indigo-400/20' : 'border-slate-200'}`}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                        <div className="flex justify-between items-center mb-1.5 pl-1">
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
                            ID: {claim.id}
                          </span>
                          {claim.aiConfidenceScore !== null ? (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${claim.aiConfidenceScore >= 0.7 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : claim.aiConfidenceScore >= 0.4 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                              {UI_TEXT[language].aiConfidence} {(claim.aiConfidenceScore * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">{UI_TEXT[language].pendingAnalysis}</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 pl-1 leading-relaxed">
                          {claim.content}
                        </p>

                        <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100 pl-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAnalyzeClaim(claim.id); }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            {UI_TEXT[language].aiAnalyzeBtn}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClaim(claim);
                              setEditClaimContent(claim.content);
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-0.5 ml-auto"
                          >
                            {UI_TEXT[language].editBtn}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClaim(claim.id); }}
                            className="text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5"
                          >
                            {UI_TEXT[language].deleteBtn}
                          </button>
                        </div>

                        {/* Hiển thị danh sách Matches khi được chọn */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-dashed border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{UI_TEXT[language].bestMatchEvidence}</h4>
                            {loadingMatches ? (
                              <div className="text-center py-2 text-[10px] text-slate-400 italic">{UI_TEXT[language].searchingMatches}</div>
                            ) : claimMatches.length === 0 ? (
                              <div className="text-center py-2 text-[10px] text-slate-400 italic">{UI_TEXT[language].noMatches}</div>
                            ) : (
                              <div className="space-y-2">
                                {claimMatches.map((m, idx) => (
                                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex justify-between items-center mb-1 text-[9px] font-medium text-slate-500">
                                      <span className="truncate max-w-[150px] font-bold text-slate-700 flex items-center gap-1"><svg className="w-2.5 h-2.5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>{m.filename}</span>
                                      <span className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">{Math.round(m.score * 100)}% {UI_TEXT[language].matchPercent}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 line-clamp-3 italic leading-relaxed">"{m.excerpt}"</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          {/* 3. FEEDBACK TAB (Nhận xét của Instructor) */}
          {activeTab === 'Feedback' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-1 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Trạng thái bản thảo</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {paperStatus === 'ACTIVE' && (language === 'vi' ? 'Đang soạn thảo (Active)' : 'Drafting (Active)')}
                    {paperStatus === 'PENDING' && (language === 'vi' ? 'Đang chờ duyệt (In Review)' : 'Pending (In Review)')}
                    {paperStatus === 'RETURNED' && (language === 'vi' ? 'Cần chỉnh sửa (Returned)' : 'Returned for Revision')}
                    {paperStatus === 'REVIEWED' && (language === 'vi' ? 'Đã phê duyệt (Approved)' : 'Approved')}
                    {paperStatus === 'REJECTED' && (language === 'vi' ? 'Bị từ chối (Rejected)' : 'Rejected')}
                  </p>
                </div>
                {paperStatus !== 'PENDING' && (
                  <button
                    onClick={() => setShowSubmitReviewModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    Gửi duyệt
                  </button>
                )}
              </div>

              <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mt-2">
                <div className="h-px bg-slate-200 flex-1"></div> Lịch sử đánh giá <div className="h-px bg-slate-200 flex-1"></div>
              </h3>

              <div className="space-y-4">
                {activePaperFeedbacks.length === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center py-8">Chưa có yêu cầu duyệt hoặc nhận xét nào cho bản thảo này.</div>
                ) : (
                  activePaperFeedbacks.map((fb, idx) => (
                    <div key={fb.id || idx} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">I</div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              {instructorsList.find(inst => Number(inst.id) === Number(fb.instructorId))
                                ? `${instructorsList.find(inst => Number(inst.id) === Number(fb.instructorId)).firstName} ${instructorsList.find(inst => Number(inst.id) === Number(fb.instructorId)).lastName}`
                                : `Giảng viên (ID: ${fb.instructorId})`}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">{fb.requestedAt ? new Date(fb.requestedAt).toLocaleString('vi-VN') : ''}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase ${fb.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : fb.status === 'RETURNED' ? 'bg-rose-50 text-rose-700 border-rose-200' : fb.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700'}`}>{fb.status}</span>
                      </div>
                      <div className="p-3 text-xs leading-relaxed text-slate-700 space-y-2">
                        {fb.status === 'PENDING' && (
                          <p className="text-amber-600 font-medium italic">Bản thảo {fb.paperName || 'bài viết'} đã được gửi đi. Đang chờ giảng viên kiểm tra và cho nhận xét.</p>
                        )}
                        {fb.status === 'RETURNED' && (
                          <p className="text-rose-600 font-medium">Giảng viên đã trả lại bản thảo {fb.paperName || 'bài viết'}. Vui lòng kiểm tra lại sự tương đồng giữa các luận điểm đã viết và tài liệu chứng cứ đính kèm, chỉnh sửa lại rồi gửi lại.</p>
                        )}
                        {fb.status === 'REVIEWED' && (
                          <p className="text-emerald-600 font-medium">Giảng viên đã duyệt thành công bản thảo {fb.paperName || 'bài viết'} của bạn. Điểm số tương thích giữa các lập luận và nguồn đã được xác thực tốt.</p>
                        )}
                        {fb.status === 'REJECTED' && (
                          <p className="text-red-600 font-medium">Yêu cầu duyệt của bạn bị từ chối.</p>
                        )}
                        {fb.content && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-100 bg-slate-50 p-2.5 rounded-lg text-slate-650">
                            <span className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                              💬 Nhận xét chi tiết:
                            </span>
                            <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-600">{fb.content}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. GRAPH TAB (Bản đồ liên kết bài viết tương tác) */}
          {activeTab === 'Graph' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-xs text-indigo-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    {language === 'vi' ? 'Bản đồ liên kết bài viết' : 'Paper Connection Map'}
                  </h4>
                  <span className="text-[9px] text-slate-500">{language === 'vi' ? 'Học viên: 10 bài viết' : 'Student: 10 papers'}</span>
                </div>

                {/* Dynamic Preview Banner (HUD) */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2.5 mb-3 min-h-[54px] flex items-center justify-center transition-all duration-300">
                  {hoveredNodeId ? (() => {
                    const node = dynamicNodes.find(p => p.id === hoveredNodeId);
                    if (!node) return null;
                    return (
                      <div className="w-full flex items-center justify-between gap-3 text-left animate-in fade-in duration-200">
                        <div className="truncate">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-black text-white px-1.5 py-0.2 rounded uppercase tracking-wider" style={{ backgroundColor: node.color }}>
                              Paper #{node.num}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold font-mono truncate">
                              {node.name}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-200 line-clamp-1 leading-snug">
                            {node.title}
                          </p>
                        </div>
                        <span className="text-[9px] text-indigo-400 font-bold shrink-0 animate-pulse">
                          {language === 'vi' ? 'Xem PDF' : 'View PDF'}
                        </span>
                      </div>
                    );
                  })() : (
                    <p className="text-[11px] text-slate-450 italic text-center font-medium">
                      {language === 'vi' ? 'Di chuột vào các số trên bản đồ để xem tiêu đề...' : 'Hover over numbers on map to view titles...'}
                    </p>
                  )}
                </div>

                {/* SVG interactive network mapping */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex justify-center items-center relative overflow-hidden select-none">
                  <svg className="w-full max-w-[340px] h-[320px]" viewBox="0 0 340 320">
                    {/* Render Connecting Lines */}
                    {dynamicLinks.map((link, idx) => {
                      const sourceNode = dynamicNodes.find(p => p.id === link.source);
                      const targetNode = dynamicNodes.find(p => p.id === link.target);
                      if (!sourceNode || !targetNode) return null;

                      const isHighlighted = hoveredNodeId === null || 
                                            hoveredNodeId === link.source || 
                                            hoveredNodeId === link.target;

                      return (
                        <line
                          key={idx}
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={sourceNode.color}
                          strokeWidth={isHighlighted ? 2.5 : 1}
                          strokeOpacity={isHighlighted ? 0.75 : 0.08}
                          className="transition-all duration-300"
                        />
                      );
                    })}

                    {/* Render Nodes */}
                    {dynamicNodes.map((node) => {
                      const isHighlighted = hoveredNodeId === null || 
                                            hoveredNodeId === node.id ||
                                            dynamicNodes.find(p => p.id === hoveredNodeId)?.category === node.category;

                      return (
                        <g
                          key={node.id}
                          className="cursor-pointer transition-all duration-300 transform"
                          style={{ 
                            opacity: isHighlighted ? 1 : 0.25
                          }}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onClick={() => setSelectedPaperDetail(node)}
                        >
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={16}
                            fill="#1e293b"
                            stroke={node.color}
                            strokeWidth={hoveredNodeId === node.id ? 3.5 : 2}
                            className="transition-all duration-300"
                          />
                          <text
                            x={node.x}
                            y={node.y + 4}
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="11px"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {node.num}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Floating Legend */}
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 border border-slate-800 rounded-md p-1.5 flex justify-between text-[9px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span> ReactJS (1, 7, 10)
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> DevOps (2, 3, 5)
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]"></span> Micro (4, 6, 8, 9)
                    </div>
                  </div>
                </div>
              </div>

              {/* Sơ lược hướng dẫn */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm text-xs text-slate-500 leading-relaxed">
                <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {language === 'vi' ? 'Hướng dẫn xem bản đồ:' : 'Map Guide:'}
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {language === 'vi' ? (
                    <>
                      <li>Di chuột lên các vòng tròn số để xem kết nối nhóm.</li>
                      <li>Mỗi vòng tròn đại diện cho 1 Paper (sắp xếp và đánh số theo thời gian tạo từ 1 đến 10).</li>
                      <li>Click vào vòng tròn bất kỳ để xem chi tiết và liên kết nhanh.</li>
                    </>
                  ) : (
                    <>
                      <li>Hover over circles to see group connections.</li>
                      <li>Each circle represents 1 Paper (ordered and numbered 1 to 10 by creation time).</li>
                      <li>Click any circle to view detailed info and quick links.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* 5. TEAM TAB (Quản lý thành viên & Phân công công việc) */}
          {activeTab === 'Team' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200 text-xs">
              
              {/* Giảng viên hướng dẫn */}
              {(() => {
                const projInst = instructorsList.find(inst => Number(inst.id) === Number(project?.instructorId));
                if (!projInst) return null;
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <h4 className="font-extrabold text-indigo-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-xs">
                      <span>👨‍🏫</span> Giảng viên hướng dẫn
                    </h4>
                    <div className="flex items-center gap-3 bg-white p-3 border border-indigo-100 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 shrink-0 text-xs">
                        {projInst.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">
                          {projInst.firstName} {projInst.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{projInst.email}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Member Invitation Panel (PL Only) */}
              {project?.ownerId === currentUser?.id && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h4 className="font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>➕</span> Mời thành viên mới
                  </h4>
                  <div className="flex gap-2">
                    <select
                      id="team-invite-select"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white text-xs font-medium"
                      defaultValue=""
                    >
                      <option value="" disabled>-- Chọn sinh viên --</option>
                      {allStudents
                        ?.filter(s => !project.members?.some(m => m.email === s.email))
                        ?.map(s => (
                          <option key={s.id} value={s.email}>{s.firstName} {s.lastName} ({s.email})</option>
                        ))
                      }
                    </select>
                    <button
                      onClick={async () => {
                        const selectEl = document.getElementById('team-invite-select');
                        const email = selectEl.value;
                        if (!email) return;
                        const updatedMembers = [...(project.members || []), { email, role: 'RW' }];
                        try {
                          const res = await api.put(`/api/projects/${project.id}/members`, {
                            members: updatedMembers
                          });
                          setProject(res.data);
                          selectEl.value = "";
                          showToast('Đã mời thành viên thành công!');
                        } catch (err) {
                          console.error(err);
                          showToast('Lỗi khi mời thành viên!');
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-sm cursor-pointer text-xs"
                    >
                      Mời
                    </button>
                  </div>
                </div>
              )}

              {/* Members List Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>👥</span> Danh sách nhóm ({project?.members?.length || 0})
                </h4>
                <div className="space-y-3">
                  {project?.members?.map((m, idx) => {
                    const isPL = m.role === 'PL';
                    const dbUser = allStudents?.find(s => s.email === m.email) || (m.email === 'student@evidencepilot.edu' ? currentUser : null);
                    const displayName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : m.email.split('@')[0];
                    const isCurrentUserPL = project?.ownerId === currentUser?.id;
                    
                    return (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-2 relative text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                              {displayName}
                              {m.email === currentUser?.email && (
                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">Bạn</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.email}</div>
                          </div>
                          {isCurrentUserPL && m.email !== currentUser?.email && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Xóa ${displayName} khỏi nhóm?`)) {
                                  const updatedMembers = project.members.filter(mem => mem.email !== m.email);
                                  const assignments = {};
                                  papers.forEach(p => {
                                    if (p.assignedTo === m.email) {
                                      assignments[p.filename] = '';
                                    }
                                  });
                                  try {
                                    const res = await api.put(`/api/projects/${project.id}/members`, {
                                      members: updatedMembers,
                                      assignments
                                    });
                                    setProject(res.data);
                                    const paperRes = await api.get(`/api/papers/by-project/${project.id}`);
                                    setPapers(paperRes.data || []);
                                    showToast('Đã xóa thành viên khỏi nhóm.');
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Xóa thành viên"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-400 font-bold text-[10px]">Vai trò:</span>
                          {isCurrentUserPL && m.email !== currentUser?.email ? (
                            <select
                              value={m.role}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                const updatedMembers = project.members.map(mem => mem.email === m.email ? { ...mem, role: newRole } : mem);
                                try {
                                  const res = await api.put(`/api/projects/${project.id}/members`, {
                                    members: updatedMembers
                                  });
                                  setProject(res.data);
                                  showToast('Đã cập nhật vai trò thành viên.');
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 text-xs w-36"
                            >
                              <option value="PL">Project Leader (PL)</option>
                              <option value="RW">Related Work (RW)</option>
                              <option value="DG">Discussion Generator (DG)</option>
                              <option value="LR">Lead Researcher (LR)</option>
                              <option value="MS">Metric Specialist (MS)</option>
                            </select>
                          ) : (
                            <span className="font-bold text-slate-650 bg-slate-200/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                              {m.role === 'PL' ? 'Project Leader (PL)' : 
                               m.role === 'RW' ? 'Related Work (RW)' :
                               m.role === 'DG' ? 'Discussion Gen (DG)' :
                               m.role === 'LR' ? 'Lead Researcher (LR)' :
                               m.role === 'MS' ? 'Metric Specialist (MS)' : m.role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section Assignment Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
                <h4 className="font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>📌</span> Phân công viết phần (Sections)
                </h4>
                <div className="space-y-2.5">
                  {papers
                    ?.filter(p => p.filename.startsWith('sections/'))
                    ?.sort((a, b) => a.filename.localeCompare(b.filename))
                    ?.map((p, idx) => {
                      const isCurrentUserPL = project?.ownerId === currentUser?.id;
                      const cleanName = p.filename.split('/').pop().replace('.tex', '').substring(3).toUpperCase();
                      const statusColors = {
                        DRAFT: 'bg-slate-100 text-slate-500',
                        SUBMITTED: 'bg-amber-100 text-amber-700',
                        APPROVED: 'bg-emerald-100 text-emerald-700'
                      };
                      
                      return (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-lg flex flex-col gap-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 font-mono text-[11px]">§{idx + 1} {cleanName}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider ${statusColors[p.status] || 'bg-slate-100 text-slate-500'}`}>
                              {p.status || 'DRAFT'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-slate-100">
                            <span className="text-slate-400 font-semibold shrink-0">Người phụ trách:</span>
                            {isCurrentUserPL ? (
                              <select
                                value={p.assignedTo || ""}
                                onChange={async (e) => {
                                  const email = e.target.value;
                                  try {
                                    const res = await api.put(`/api/projects/${project.id}/members`, {
                                      assignments: { [p.filename]: email }
                                    });
                                    const paperRes = await api.get(`/api/papers/by-project/${project.id}`);
                                    setPapers(paperRes.data || []);
                                    showToast(`Đã phân công ${p.filename.split('/').pop()} thành công.`);
                                  } catch (err) {
                                    console.error(err);
                                    showToast('Lỗi khi phân công!');
                                  }
                                }}
                                className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 text-xs w-36 truncate"
                              >
                                <option value="">-- Chưa phân công --</option>
                                {project.members?.map(mem => {
                                  const memUser = allStudents?.find(s => s.email === mem.email) || (mem.email === 'student@evidencepilot.edu' ? currentUser : null);
                                  const memName = memUser ? `${memUser.firstName} ${memUser.lastName}` : mem.email;
                                  return (
                                    <option key={mem.email} value={mem.email}>{memName}</option>
                                  );
                                })}
                              </select>
                            ) : (
                              <span className="font-medium text-slate-705 truncate w-32 text-right">
                                {(() => {
                                  const memUser = allStudents?.find(s => s.email === p.assignedTo) || (p.assignedTo === 'student@evidencepilot.edu' ? currentUser : null);
                                  return memUser ? `${memUser.firstName} ${memUser.lastName}` : (p.assignedTo || 'Chưa phân công');
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
      </div>





  {
    showSubmitReviewModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Gửi bản thảo phê duyệt</h2>
            <button onClick={() => setShowSubmitReviewModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">Vui lòng chọn Giảng viên bạn muốn gửi bản thảo {selectedPaper ? (selectedPaper.originalFilename || selectedPaper.name) : 'này'} để đánh giá và nhận xét.</p>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chọn Giảng viên</label>
            <select
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {instructorsList.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.firstName} {inst.lastName} ({inst.email})
                </option>
              ))}
              {instructorsList.length === 0 && (
                <option value="">Không tìm thấy giảng viên nào</option>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowSubmitReviewModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
            <button
              onClick={handleSubmitReview}
              disabled={!selectedInstructorId}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50"
            >
              Gửi duyệt
            </button>
          </div>
        </div>
      </div>
    )
  }

  {
    showAiReviewModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-indigo-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              <h2 className="text-base font-bold tracking-wide">Báo cáo Đánh giá của AI (AI Structural & Style Review)</h2>
            </div>
            <button onClick={() => setShowAiReviewModal(false)} className="text-indigo-200 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6 custom-scrollbar">
            {loadingAiReview ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Trợ lý AI đang quét bài viết...</p>
                  <p className="text-xs text-slate-400 mt-1">Đánh giá cấu trúc học thuật, chất lượng chứng cứ và văn phong khoa học...</p>
                </div>
              </div>
            ) : aiReviewResult ? (
              <>
                {/* 1. Academic Tone Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-indigo-600 rounded"></span>
                      1. Đánh giá văn phong học thuật
                    </h3>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">Văn phong: Đạt yêu cầu</span>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 italic">
                    "{aiReviewResult.styleFeedback}"
                  </p>
                  <div className="mt-3.5 space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đề xuất từ chuyên gia AI:</p>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li>Hãy sửa đổi các khẳng định như "Chúng tôi cho rằng..." hoặc "Tôi đề xuất..." thành thể bị động khách quan như "Đề xuất này hướng đến...", "Phân tích chỉ ra rằng...".</li>
                      <li>Duy trì văn phong tường thuật khoa học xuyên suốt các chương mục.</li>
                    </ul>
                  </div>
                </div>

                {/* 2. Evidence Coverage Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-indigo-600 rounded"></span>
                      2. Đồ thị đối sánh chứng cứ (Evidence Mapping)
                    </h3>
                    <span className="bg-amber-50 text-amber-700 border border-amber-250 text-[10px] font-bold px-2 py-0.5 rounded">Phát hiện khoảng trống chứng cứ</span>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 italic">
                    "{aiReviewResult.structureFeedback}"
                  </p>
                  <div className="mt-3.5 space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đề xuất giải quyết:</p>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li>Truy cập tab <b>Luận điểm</b> ở thanh bên phải, đối chiếu xem luận điểm nào chưa có nhãn chứng cứ xanh lá (Độ tin cậy).</li>
                      <li>Tải lên thêm tài liệu nghiên cứu thực nghiệm (`devops-adoption-metrics.pdf`...) để liên kết cơ sở dữ liệu.</li>
                    </ul>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer Action Buttons */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
            <button
              onClick={() => setShowAiReviewModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white cursor-pointer"
            >
              Đóng
            </button>

          </div>
        </div>
      </div>
    )
  }

  {
    viewerFile && (
      <FileViewerModal
        fileUrl={viewerFile.fileUrl}
        fileName={viewerFile.fileName}
        onClose={() => setViewerFile(null)}
      />
    )
  }
  {/* Detail modal for Graph Papers */}
  {
    selectedPaperDetail && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all border border-slate-100 flex flex-col h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: selectedPaperDetail.color }}
              >
                Paper #{selectedPaperDetail.num}
              </span>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {selectedPaperDetail.name}
              </span>
            </div>
            <button 
              onClick={() => setSelectedPaperDetail(null)} 
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Grid Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Column 1: Info */}
            <div className="w-1/2 p-6 overflow-y-auto custom-scrollbar space-y-4 border-r border-slate-150">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                  {selectedPaperDetail.title}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'vi' ? 'Thời gian tạo' : 'Created at'}: {selectedPaperDetail.created}
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-slate-500">{language === 'vi' ? 'Chủ đề' : 'Category'}:</span>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm"
                  style={{ backgroundColor: selectedPaperDetail.color }}
                >
                  {selectedPaperDetail.category}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{language === 'vi' ? 'Tóm tắt nội dung' : 'Abstract / Summary'}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {selectedPaperDetail.summary}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{language === 'vi' ? 'Tài liệu liên quan' : 'Related Papers'}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {dynamicNodes.filter(p => p.category === selectedPaperDetail.category && p.id !== selectedPaperDetail.id).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPaperDetail(p)}
                      className="p-3 border border-slate-200 hover:border-indigo-400 hover:shadow-sm bg-white rounded-xl text-left transition-all group flex flex-col gap-1 col-span-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">Paper #{p.num}</span>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 line-clamp-1 transition-colors leading-tight">{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: PDF Preview */}
            <div className="w-1/2 p-6 bg-slate-100 flex flex-col overflow-hidden">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 shrink-0">
                <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                {language === 'vi' ? 'Nội dung PDF (Bản thảo)' : 'PDF Preview (Draft)'}
              </h4>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {renderModalPaperPdf(selectedPaperDetail.name)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
            <button
              onClick={() => setSelectedPaperDetail(null)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors"
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    )
  }
    </div >
  );
}

