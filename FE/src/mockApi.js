import { initialMockData } from './mockData.js';

export default function mockAdapter(config) {
  return new Promise((resolve, reject) => {
    const method = config.method.toUpperCase();
    const url = config.url;
    
    // Tìm đường dẫn bắt đầu bằng /api
    const apiPathIndex = url.indexOf('/api');
    if (apiPathIndex === -1) {
      return reject({
        config,
        response: { status: 404, data: { message: 'Không tìm thấy API.' } }
      });
    }
    const path = url.substring(apiPathIndex);
    
    // Tách query string nếu có
    let pathWithoutQuery = path;
    let queryParams = {};
    const queryIndex = path.indexOf('?');
    if (queryIndex !== -1) {
      pathWithoutQuery = path.substring(0, queryIndex);
      const queryString = path.substring(queryIndex + 1);
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, val] = pair.split('=');
        if (key) {
          queryParams[decodeURIComponent(key)] = decodeURIComponent(val || '');
        }
      }
    }
    
    if (config.params) {
      queryParams = { ...queryParams, ...config.params };
    }

    // Các hàm phụ trợ thao tác với localStorage
    const getDB = (key, defaultVal) => {
      const val = localStorage.getItem(`mock_db_${key}`);
      return val ? JSON.parse(val) : defaultVal;
    };
    const setDB = (key, data) => {
      localStorage.setItem(`mock_db_${key}`, JSON.stringify(data));
    };

    // Khởi tạo cơ sở dữ liệu mẫu nếu chưa có
    const initDB = () => {
      

      if (!localStorage.getItem('mock_db_initialized_en_v11')) {
        setDB('users', [
          { id: 1, email: 'student@evidencepilot.edu', password: '123', role: 'STUDENT', firstName: 'Nguyễn', lastName: 'Văn A', age: 21 },
          { id: 102, email: 'student2@evidencepilot.edu', password: '123', role: 'STUDENT', firstName: 'Trần', lastName: 'Văn B', age: 22 },
          { id: 103, email: 'student3@evidencepilot.edu', password: '123', role: 'STUDENT', firstName: 'Lê', lastName: 'Thị C', age: 21 },
          { id: 104, email: 'student4@evidencepilot.edu', password: '123', role: 'STUDENT', firstName: 'Phạm', lastName: 'Văn D', age: 23 },
          { id: 105, email: 'student5@evidencepilot.edu', password: '123', role: 'STUDENT', firstName: 'Hoàng', lastName: 'Thị E', age: 22 },
          { id: 2, email: 'instructor.test@fpt.edu.vn', password: '123', role: 'INSTRUCTOR', firstName: 'Dr. Phạm', lastName: 'Thị B', age: 45 }
        ]);
        setDB('projects', [
          { 
            id: 'proj-1', 
            title: 'Nghiên cứu Agile & DevOps', 
            name: 'Nghiên cứu Agile & DevOps', 
            description: 'Dự án phân tích tính hiệu quả của Agile/Scrum kết hợp DevOps trong các doanh nghiệp khởi nghiệp.', 
            ownerId: 1, 
            status: 'ACTIVE', 
            createdAt: new Date().toISOString(),
            instructorId: 2,
            members: [
              { email: 'student@evidencepilot.edu', role: 'PL' },
              { email: 'student2@evidencepilot.edu', role: 'RW' },
              { email: 'student3@evidencepilot.edu', role: 'DG' },
              { email: 'student4@evidencepilot.edu', role: 'LR' },
              { email: 'student5@evidencepilot.edu', role: 'MS' }
            ]
          }
        ]);
        setDB('sources', [
          { id: 'src-1', projectId: 'proj-1', filename: 'agile-performance-report.pdf', name: 'agile-performance-report.pdf', originalFilename: 'agile-performance-report.pdf', type: 'application/pdf', size: 1024500, uploadedAt: new Date().toISOString() },
          { id: 'src-2', projectId: 'proj-1', filename: 'devops-adoption-metrics.pdf', name: 'devops-adoption-metrics.pdf', originalFilename: 'devops-adoption-metrics.pdf', type: 'application/pdf', size: 852000, uploadedAt: new Date().toISOString() },
          { id: 'src-3', projectId: 'proj-1', filename: 'react-rendering-perf.pdf', name: 'react-rendering-perf.pdf', originalFilename: 'react-rendering-perf.pdf', type: 'application/pdf', size: 450000, uploadedAt: new Date().toISOString() }
        ]);
        setDB('papers', [
          {
            id: 'paper-1-main',
            projectId: 'proj-1',
            name: 'main.tex',
            filename: 'main.tex',
            size: 1500,
            uploadedAt: new Date().toISOString(),
            content: `% LaTeX main.tex\n\\documentclass[conference]{IEEEtran}\n\\usepackage[utf8]{inputenc}\n\\usepackage{graphicx}\n\\usepackage{booktabs}\n\\usepackage{listings}\n\\usepackage{hyperref}\n\n\\begin{document}\n\n\\title{Nghiên cứu Agile \\& DevOps trong Khởi nghiệp}\n\\author{\\IEEEauthorblockN{Nguyen Van A, Tran Van B, Le Thi C}\n\\IEEEauthorblockA{FPT University, Vietnam}}\n\n\\maketitle\n\n\\begin{abstract}\n\\input{sections/00_abstract}\n\\end{abstract}\n\n\\input{sections/01_intro}\n\\input{sections/02_related}\n\\input{sections/03_method}\n\\input{sections/04_results}\n\\input{sections/05_discussion}\n\\input{sections/06_threats}\n\\input{sections/07_conclusion}\n\n\\bibliographystyle{IEEEtran}\n\\bibliography{references}\n\n\\end{document}`,
            extractedText: ''
          },
          {
            id: 'paper-1-bib',
            projectId: 'proj-1',
            name: 'references.bib',
            filename: 'references.bib',
            size: 500,
            uploadedAt: new Date().toISOString(),
            content: `@inproceedings{chen2023testgen,\n  author    = {Chen, Mark and others},\n  title     = {Evaluating Large Language Models for Unit Test Generation},\n  booktitle = {Proc. ICSE 2023},\n  year      = {2023},\n  doi       = {10.1145/3597503.3608135}\n}`,
            extractedText: ''
          },
          {
            id: 'paper-1-abstract',
            projectId: 'proj-1',
            name: 'sections/00_abstract.tex',
            filename: 'sections/00_abstract.tex',
            size: 800,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student@evidencepilot.edu',
            status: 'DRAFT',
            comments: [],
            content: `% Abstract (PL)\nUnit test generation remains labor-intensive despite tools like EvoSuite. No prior study has evaluated GPT-4o mini for this task using mutation score as the primary metric. We apply GPT-4o mini to 200 Java functions from the Apache Commons dataset and measure mutation score and branch coverage. GPT-4o mini achieves median mutation score 61.3% vs EvoSuite 48.7%. Our results suggest LLM-generated tests can complement search-based tools, particularly for functions with complex logic.`,
            extractedText: ''
          },
          {
            id: 'paper-1-intro',
            projectId: 'proj-1',
            name: 'sections/01_intro.tex',
            filename: 'sections/01_intro.tex',
            size: 1000,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student2@evidencepilot.edu',
            status: 'SUBMITTED',
            comments: [],
            content: `% Introduction (RW)\n\\section{Introduction}\n\\label{sec:intro}\nWriting software unit tests manually is time-consuming and error-prone. Recent studies have shown that Large Language Models (LLMs) can automate unit test generation. However, no study has evaluated GPT-4o mini on Java projects using mutation score as the primary metric.\n\nIn this paper, we present an empirical evaluation of GPT-4o mini. To summarize, this paper contributes:\n(1) The first empirical evaluation of GPT-4o mini for Java unit test generation.\n(2) Experimental results showing LLM-generated tests achieve higher mutation score.\n\nThe rest of this paper is structured as follows. Section \\ref{sec:related} discusses related work.`,
            extractedText: ''
          },
          {
            id: 'paper-1-related',
            projectId: 'proj-1',
            name: 'sections/02_related.tex',
            filename: 'sections/02_related.tex',
            size: 900,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student3@evidencepilot.edu',
            status: 'DRAFT',
            comments: [],
            content: `% Related Work (DG)\n\\section{Related Work}\n\\label{sec:related}\n\\subsection{LLM for Test Generation}\nSeveral researchers have explored LLMs for test generation. Chen et al. \\cite{chen2023testgen} evaluated LLMs on Python code. However, their study did not focus on Java or mutation coverage.\n\n\\subsection{Search-Based Software Testing}\nSearch-Based Software Testing (SBST) tools like EvoSuite use genetic algorithms to generate tests. While effective at coverage, they often generate tests with weak assertions. Unlike prior work, this paper is the first to directly compare GPT-4o mini with EvoSuite on Java libraries.`,
            extractedText: ''
          },
          {
            id: 'paper-1-method',
            projectId: 'proj-1',
            name: 'sections/03_method.tex',
            filename: 'sections/03_method.tex',
            size: 1000,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student4@evidencepilot.edu',
            status: 'DRAFT',
            comments: [],
            content: `% Methodology (LR)\n\\section{Methodology}\n\\label{sec:method}\n\\subsection{Dataset}\nWe select 200 Java functions from the Apache Commons library. These functions represent typical utility code with varying complexity.\n\n\\subsection{Experimental Setup}\nWe use the \\texttt{gpt-4o-mini-2024-07-18} model with temperature 0. The prompt template includes the signature and body of the target Java function. Our replication package, including datasets, prompts, scripts, and raw results, is publicly available at: \\url{https://github.com/evidencepilot/swt301-replication}.\n\n\\subsection{Metrics}\nWe measure mutation score using PITest, and branch coverage using JaCoCo.`,
            extractedText: ''
          },
          {
            id: 'paper-1-results',
            projectId: 'proj-1',
            name: 'sections/04_results.tex',
            filename: 'sections/04_results.tex',
            size: 1100,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student5@evidencepilot.edu',
            status: 'DRAFT',
            comments: [],
            content: `% Results (MS)\n\\section{Results}\n\\label{sec:results}\nTable \\ref{tab:results} shows the mutation scores for each tool. The median mutation score of GPT-4o mini is 61.3% (IQR: [55%, 72%]). The Wilcoxon signed-rank test yields $p=0.007$, showing statistical significance with Cliff's delta $\\delta=0.21$ (small effect size).\n\n\\begin{table}[h]\n\\caption{Mutation Score Comparison}\n\\label{tab:results}\n\\begin{center}\n\\begin{tabular}{lccc}\n\\toprule\n\\textbf{Condition} & \\textbf{Mutation Score} & \\textbf{p-value} & \\textbf{Effect Size} \\\\\n\\midrule\nEvoSuite & 0.48 $\\pm$ 0.12 & — & — \\\\\nGPT-4o mini & 0.61 $\\pm$ 0.09 & p=0.007 & $\\delta$=0.21 (small) \\\\\n\\bottomrule\n\\end{tabular}\n\\end{center}\n\\end{table}`,
            extractedText: ''
          },
          {
            id: 'paper-1-discussion',
            projectId: 'proj-1',
            name: 'sections/05_discussion.tex',
            filename: 'sections/05_discussion.tex',
            size: 800,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student@evidencepilot.edu',
            status: 'DRAFT',
            comments: [],
            content: `% Discussion (PL)\n\\section{Discussion}\n\\label{sec:discussion}\n\\subsection{Qualitative Analysis of Failures}\nWe observe that GPT-4o mini struggles with complex mathematical constraints, producing uncompilable assertions in 5% of cases.\n\n\\subsection{Comparison with Prior Work}\nOur results confirm the findings of Chen et al. \\cite{chen2023testgen} that LLMs generate more readable assertions than search-based tools.`,
            extractedText: ''
          },
          {
            id: 'paper-1-threats',
            projectId: 'proj-1',
            name: 'sections/06_threats.tex',
            filename: 'sections/06_threats.tex',
            size: 800,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student2@evidencepilot.edu',
            status: 'DRAFT',
            comments: [],
            content: `% Threats to Validity (RW)\n\\section{Threats to Validity}\n\\label{sec:threats}\n\\begin{itemize}\n\\item \\textbf{Internal:} The stochastic nature of LLMs could cause variations in results. We mitigated this by setting temperature to 0.\n\\item \\textbf{External:} Our findings are limited to Java functions from Apache Commons, which may not generalize to other programming languages.\n\\end{itemize}`,
            extractedText: ''
          },
          {
            id: 'paper-1-conclusion',
            projectId: 'proj-1',
            name: 'sections/07_conclusion.tex',
            filename: 'sections/07_conclusion.tex',
            size: 800,
            uploadedAt: new Date().toISOString(),
            assignedTo: 'student2@evidencepilot.edu',
            status: 'DRAFT',
            comments: [],
            content: `% Conclusion (RW)\n\\section{Conclusion}\n\\label{sec:conclusion}\nWe evaluated GPT-4o mini on Java unit test generation. Results show that GPT-4o mini outperforms EvoSuite with a median mutation score of 61.3%. Future work could investigate prompt engineering techniques to improve compilability.`,
            extractedText: ''
          }
        ]);
        setDB('claims', [
          { id: 'claim-1', projectId: 'proj-1', content: 'Agile methods combined with DevOps improve software delivery frequency.', active: true, aiConfidenceScore: 0.88, status: 'ANALYZED', verdict: 'SUPPORTED', confidence: 0.88, explanation: 'Tài liệu agile-performance-report.pdf ghi nhận hiệu suất triển khai tăng gấp 4 lần sau khi áp dụng kết hợp.', missing_evidence: [] },
          { id: 'claim-2', projectId: 'proj-1', content: 'Daily standup meetings help identify technical blockers early.', active: true, aiConfidenceScore: 0.82, status: 'ANALYZED', verdict: 'SUPPORTED', confidence: 0.82, explanation: 'Tài liệu scrum-guide-2020.pdf nhấn mạnh vai trò của Daily Scrum trong việc tối ưu hóa khả năng cộng tác và xử lý điểm nghẽn.', missing_evidence: [] },
          { id: 'claim-3', projectId: 'proj-1', content: 'CI/CD automation reduces software release defects.', active: true, aiConfidenceScore: 0.91, status: 'ANALYZED', verdict: 'SUPPORTED', confidence: 0.91, explanation: 'Tài liệu devops-adoption-metrics.pdf ghi nhận tỉ lệ lỗi giảm 40% nhờ tích hợp kiểm thử tự động.', missing_evidence: [] }
        ]);
        setDB('datasets', [
          { id: 'data-1', title: 'Tài liệu tham khảo Agile chuẩn', description: 'Tập hợp các báo cáo khoa học về Agile Software Development.', ownerId: 2, createdAt: new Date().toISOString() }
        ]);
        setDB('dataset_sources', [
          { id: 'dsrc-1', datasetId: 'data-1', filename: 'scrum-guide-2020.pdf', name: 'scrum-guide-2020.pdf', type: 'application/pdf', size: 2450000, uploadedAt: new Date().toISOString() }
        ]);
        const initialRequest = {
          id: 'req-initial-1',
          projectId: 'proj-1',
          project: { id: 'proj-1', name: 'Nghiên cứu Agile & DevOps', title: 'Nghiên cứu Agile & DevOps' },
          paperId: 'paper-1-intro',
          paperName: 'sections/01_intro.tex',
          student: { firstName: 'Học', lastName: 'Viên', email: 'student2@evidencepilot.edu' },
          instructorId: 2,
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        };
        setDB('feedbackRequests', [initialRequest]);
        setDB('feedbacks', [{
          id: 'fb-initial-1',
          requestId: 'req-initial-1',
          projectId: 'proj-1',
          paperId: 'paper-1-intro',
          paperName: 'sections/01_intro.tex',
          instructorId: 2,
          content: 'Yêu cầu phê duyệt đang chờ được xử lý.',
          status: 'PENDING',
          requestedAt: initialRequest.requestedAt
        }]);
        localStorage.setItem('mock_db_initialized_en_v11', 'true');
      }

      if (!localStorage.getItem('mock_db_initialized_collections_v4')) {
        console.log("[Mock API DB Seed] Initializing collections database v4...");
        localStorage.removeItem('mock_db_collections');
        localStorage.removeItem('mock_db_referenceDocuments');
        setDB('collections', initialMockData.collections);
        setDB('referenceDocuments', initialMockData.referenceDocuments);
        setDB('systemHealth', initialMockData.systemHealth);
        setDB('auditLogs', initialMockData.auditLogs);
        
        const users = getDB('users', []);
        if (!users.some(u => u.role === 'ADMIN')) {
          users.push({
            id: 3,
            email: 'admin@evidencepilot.edu',
            password: '123',
            role: 'ADMIN',
            firstName: 'System',
            lastName: 'Administrator',
            age: 30
          });
          setDB('users', users);
        }
        
        localStorage.setItem('mock_db_initialized_collections_v4', 'true');
      }
    };
    initDB();

    // Phân tích dữ liệu body
    let body = {};
    if (config.data) {
      if (typeof config.data === 'string') {
        try {
          body = JSON.parse(config.data);
        } catch (e) {
          // data có thể là FormData
        }
      } else {
        body = config.data;
      }
    }

    // Các hàm phản hồi
    const respond200 = (data) => {
      setTimeout(() => {
        resolve({
          data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }, 300);
    };

    const respond201 = (data) => {
      setTimeout(() => {
        resolve({
          data,
          status: 201,
          statusText: 'Created',
          headers: {},
          config
        });
      }, 300);
    };

    const respond400 = (message) => {
      setTimeout(() => {
        reject({
          config,
          response: {
            data: { message },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config
          }
        });
      }, 300);
    };

    const respond401 = (message = 'Unauthorized') => {
      setTimeout(() => {
        reject({
          config,
          response: {
            data: { message },
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config
          }
        });
      }, 300);
    };

    const respond404 = (message = 'Not Found') => {
      setTimeout(() => {
        reject({
          config,
          response: {
            data: { message },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config
          }
        });
      }, 300);
    };

    // Lấy thông tin user hiện tại qua Header Authorization
    const getCurrentUserFromHeaders = () => {
      const authHeader = config.headers?.Authorization || config.headers?.authorization;
      if (!authHeader) return null;
      const token = authHeader.replace('Bearer ', '');
      if (token.startsWith('mock-token-')) {
        const userId = parseInt(token.replace('mock-token-', ''));
        const users = getDB('users', []);
        return users.find(u => u.id === userId) || null;
      }
      return null;
    };

    // ----------------------------------------------------
    // Xử lý các Routes (Đường dẫn API)
    // ----------------------------------------------------
    
    // 1. Đăng ký & Đăng nhập
    if (method === 'POST' && pathWithoutQuery === '/api/auth/register') {
      const users = getDB('users', []);
      const { email, password, role } = body;
      if (users.some(u => u.email === email)) {
        return respond400('Email này đã được sử dụng bởi tài khoản khác!');
      }
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        email,
        password,
        role: role || 'STUDENT',
        firstName: email.split('@')[0],
        lastName: '',
        age: 20
      };
      users.push(newUser);
      setDB('users', users);

      // Tạo mã xác thực OTP 5 số
      const otp = String(Math.floor(10000 + Math.random() * 90000));
      const otps = getDB('otps', {});
      otps[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
      setDB('otps', otps);

      return respond201({ 
        message: 'Đăng ký tài khoản thành công! Mã xác thực 5 số đã được gửi.', 
        otp,
        email 
      });
    }

    if (method === 'POST' && pathWithoutQuery === '/api/auth/verify-otp') {
      const { email, otp } = body;
      const otps = getDB('otps', {});
      const userOtpRecord = otps[email];
      
      if (!userOtpRecord) {
        return respond400('Không tìm thấy mã xác thực cho email này.');
      }
      
      if (Date.now() > userOtpRecord.expiresAt) {
        return respond400('Mã xác thực đã hết hạn (quá 5 phút). Hãy gửi lại mã.');
      }
      
      if (String(userOtpRecord.otp) !== String(otp)) {
        return respond400('Mã xác thực không chính xác.');
      }
      
      // Xác nhận thành công, trả về token đăng nhập
      const users = getDB('users', []);
      const user = users.find(u => u.email === email);
      if (!user) return respond404('Không tìm thấy tài khoản người dùng.');
      
      delete otps[email];
      setDB('otps', otps);
      
      return respond200({
        token: `mock-token-${user.id}`,
        role: user.role
      });
    }

    if (method === 'POST' && pathWithoutQuery === '/api/auth/resend-otp') {
      const { email } = body;
      const users = getDB('users', []);
      const user = users.find(u => u.email === email);
      if (!user) return respond404('Không tìm thấy tài khoản người dùng.');

      const otp = String(Math.floor(10000 + Math.random() * 90000));
      const otps = getDB('otps', {});
      otps[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
      setDB('otps', otps);

      return respond200({
        message: 'Mã xác thực mới đã được gửi.',
        otp
      });
    }

    if (method === 'POST' && pathWithoutQuery === '/api/auth/login') {
      const users = getDB('users', []);
      const { email, password } = body;
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        return respond401('Email hoặc mật khẩu không chính xác.');
      }
      return respond200({
        token: `mock-token-${user.id}`,
        role: user.role
      });
    }

    if (method === 'POST' && pathWithoutQuery === '/api/auth/fpt-google-login') {
      const users = getDB('users', []);
      const { email } = body;
      
      if (!email || !email.endsWith('@fpt.edu.vn')) {
        return respond400('Chỉ chấp nhận tài khoản Google có đuôi @fpt.edu.vn');
      }
      
      let user = users.find(u => u.email === email);
      if (!user) {
        let initialRole = 'STUDENT';
        if (email.toLowerCase().includes('instructor')) {
          initialRole = 'INSTRUCTOR';
        } else if (email.toLowerCase().includes('admin')) {
          initialRole = 'ADMIN';
        }
        
        user = {
          id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
          email,
          password: 'fpt_google_oauth_bypass',
          role: initialRole,
          firstName: email.split('@')[0],
          lastName: '',
          age: 21
        };
        users.push(user);
        setDB('users', users);
      }
      
      return respond200({
        token: `mock-token-${user.id}`,
        role: user.role
      });
    }

    // 2. Thông tin người dùng
    if (method === 'GET' && pathWithoutQuery === '/api/users/me') {
      const currentUser = getCurrentUserFromHeaders();
      if (!currentUser) return respond401();
      return respond200(currentUser);
    }

    if (method === 'PUT' && pathWithoutQuery === '/api/users/me') {
      const currentUser = getCurrentUserFromHeaders();
      if (!currentUser) return respond401();
      const users = getDB('users', []);
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex === -1) return respond404('Không tìm thấy tài khoản.');
      
      users[userIndex] = {
        ...users[userIndex],
        firstName: body.firstName,
        lastName: body.lastName,
        age: body.age
      };
      setDB('users', users);
      return respond200(users[userIndex]);
    }

    if (method === 'GET' && pathWithoutQuery === '/api/users/instructors') {
      const users = getDB('users', []);
      const instructors = users.filter(u => u.role === 'INSTRUCTOR');
      return respond200(instructors);
    }

    if (method === 'GET' && pathWithoutQuery === '/api/users/students') {
      const users = getDB('users', []);
      const students = users.filter(u => u.role === 'STUDENT');
      return respond200(students);
    }

    // 3. Tập dữ liệu (Datasets của Giảng viên)
    if (method === 'GET' && pathWithoutQuery === '/api/datasets') {
      const datasets = getDB('datasets', []);
      return respond200(datasets);
    }

    if (method === 'POST' && pathWithoutQuery === '/api/datasets') {
      const datasets = getDB('datasets', []);
      const currentUser = getCurrentUserFromHeaders();
      const newDataset = {
        id: 'data-' + Math.random().toString(36).substr(2, 9),
        title: body.title,
        description: body.description,
        ownerId: currentUser?.id || 2,
        createdAt: new Date().toISOString()
      };
      datasets.push(newDataset);
      setDB('datasets', datasets);
      return respond201(newDataset);
    }

    if (method === 'PUT' && pathWithoutQuery.startsWith('/api/datasets/')) {
      const parts = pathWithoutQuery.split('/');
      const datasetId = parts[3];
      const datasets = getDB('datasets', []);
      const idx = datasets.findIndex(d => d.id === datasetId);
      if (idx === -1) return respond404('Không tìm thấy tập dữ liệu.');

      datasets[idx] = {
        ...datasets[idx],
        title: body.title,
        description: body.description
      };
      setDB('datasets', datasets);
      return respond200(datasets[idx]);
    }

    if (method === 'DELETE' && pathWithoutQuery.startsWith('/api/datasets/')) {
      const parts = pathWithoutQuery.split('/');
      const datasetId = parts[3];
      
      const datasets = getDB('datasets', []);
      setDB('datasets', datasets.filter(d => d.id !== datasetId));

      const datasetSources = getDB('dataset_sources', []);
      setDB('dataset_sources', datasetSources.filter(s => s.datasetId !== datasetId));

      return respond200({ message: 'Xóa tập dữ liệu thành công.' });
    }

    if (method === 'GET' && pathWithoutQuery.startsWith('/api/datasets/') && pathWithoutQuery.endsWith('/sources')) {
      const parts = pathWithoutQuery.split('/');
      const datasetId = parts[3];
      const datasetSources = getDB('dataset_sources', []);
      const sources = datasetSources.filter(s => s.datasetId === datasetId);
      return respond200(sources);
    }

    if (method === 'POST' && pathWithoutQuery.startsWith('/api/datasets/') && pathWithoutQuery.endsWith('/sources')) {
      const parts = pathWithoutQuery.split('/');
      const datasetId = parts[3];
      
      let filename = 'document.pdf';
      let size = 500000;
      if (body instanceof FormData) {
        const file = body.get('file');
        if (file) {
          filename = file.name;
          size = file.size;
        }
      }
      
      const datasetSources = getDB('dataset_sources', []);
      const newSource = {
        id: 'dsrc-' + Math.random().toString(36).substr(2, 9),
        datasetId,
        filename,
        name: filename,
        type: 'application/pdf',
        size,
        uploadedAt: new Date().toISOString()
      };
      datasetSources.push(newSource);
      setDB('dataset_sources', datasetSources);
      return respond201(newSource);
    }

    // 4. Dự án của Sinh viên & Giảng viên
    if (method === 'GET' && pathWithoutQuery === '/api/projects') {
      let projects = getDB('projects', []);
      const currentUser = getCurrentUserFromHeaders();
      if (!currentUser) return respond401();
      
      if (currentUser.role === 'STUDENT') {
        projects = projects.filter(p => p.ownerId === currentUser.id);
      }

      // Hỗ trợ tìm kiếm theo từ khóa (q)
      if (queryParams.q) {
        const query = queryParams.q.toLowerCase();
        projects = projects.filter(p => 
          (p.title && p.title.toLowerCase().includes(query)) ||
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
      }

      // Hỗ trợ lọc theo trạng thái (status)
      if (queryParams.status) {
        projects = projects.filter(p => p.status === queryParams.status);
      }
      
      return respond200(projects);
    }

    if (method === 'POST' && pathWithoutQuery === '/api/projects') {
      const projects = getDB('projects', []);
      const currentUser = getCurrentUserFromHeaders();
      if (!currentUser) return respond401();

      const newProjId = 'proj-' + Math.random().toString(36).substr(2, 9);
      const title = body.title || 'Dự án mới';
      const description = body.description || '';
      const instructorId = body.instructorId ? Number(body.instructorId) : 2;
      const memberEmails = body.memberEmails || [];
      const template = body.template || 'IEEE';

      // Default creator is Project Leader (PL)
      const projectMembers = [
        { email: currentUser.email, role: 'PL' }
      ];

      // Add invited members
      memberEmails.forEach(email => {
        if (email.trim() && email.trim() !== currentUser.email) {
          projectMembers.push({ email: email.trim(), role: 'RW' }); // Default role RW
        }
      });

      const newProject = {
        id: newProjId,
        title,
        name: title,
        description,
        ownerId: currentUser.id,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        instructorId,
        members: projectMembers
      };

      projects.push(newProject);
      setDB('projects', projects);

      // Seed LaTeX files based on selected template
      const papers = getDB('papers', []);
      let mainContent = '';

      if (template === 'IEEE') {
        mainContent = `% LaTeX main.tex (IEEE Conference Template)
\\documentclass[conference]{IEEEtran}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{listings}
\\usepackage{hyperref}

\\begin{document}

\\title{${title}}
\\author{\\IEEEauthorblockN{Nguyen Van A, Tran Van B}
\\IEEEauthorblockA{FPT University, Vietnam}}

\\maketitle

\\begin{abstract}
\\input{sections/00_abstract}
\\end{abstract}

\\input{sections/01_intro}
\\input{sections/02_related}
\\input{sections/03_method}
\\input{sections/04_results}
\\input{sections/05_discussion}
\\input{sections/06_threats}
\\input{sections/07_conclusion}

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}`;
      } else if (template === 'ACM') {
        mainContent = `% LaTeX main.tex (ACM sigconf Template)
\\documentclass[sigconf]{acmart}
\\usepackage[utf8]{inputenc}
\\usepackage{booktabs}
\\usepackage{hyperref}

\\begin{document}

\\title{${title}}
\\author{Nguyen Van A}
\\affiliation{\\institution{FPT University}\\country{Vietnam}}
\\email{student@evidencepilot.edu}

\\begin{abstract}
\\input{sections/00_abstract}
\\end{abstract}

\\maketitle

\\input{sections/01_intro}
\\input{sections/02_related}
\\input{sections/03_method}
\\input{sections/04_results}
\\input{sections/05_discussion}
\\input{sections/06_threats}
\\input{sections/07_conclusion}

\\bibliographystyle{ACM-Reference-Format}
\\bibliography{references}

\\end{document}`;
      } else {
        // Springer
        mainContent = `% LaTeX main.tex (Springer llncs Template)
\\documentclass{llncs}
\\usepackage[utf8]{inputenc}
\\usepackage{booktabs}
\\usepackage{hyperref}

\\begin{document}

\\title{${title}}
\\author{Nguyen Van A}
\\institute{FPT University, Vietnam}

\\maketitle

\\begin{abstract}
\\input{sections/00_abstract}
\\end{abstract}

\\input{sections/01_intro}
\\input{sections/02_related}
\\input{sections/03_method}
\\input{sections/04_results}
\\input{sections/05_discussion}
\\input{sections/06_threats}
\\input{sections/07_conclusion}

\\bibliographystyle{splncs04}
\\bibliography{references}

\\end{document}`;
      }

      const fileTemplates = [
        { id: `${newProjId}-main`, name: 'main.tex', filename: 'main.tex', content: mainContent },
        { id: `${newProjId}-bib`, name: 'references.bib', filename: 'references.bib', content: `@inproceedings{chen2023testgen,\n  author    = {Chen, Mark and others},\n  title     = {Evaluating Large Language Models for Unit Test Generation},\n  booktitle = {Proc. ICSE 2023},\n  year      = {2023},\n  doi       = {10.1145/3597503.3608135}\n}` },
        { id: `${newProjId}-abstract`, name: 'sections/00_abstract.tex', filename: 'sections/00_abstract.tex', content: '% Abstract (PL)\nUnit test generation remains labor-intensive despite tools like EvoSuite. No prior study has evaluated GPT-4o mini for this task using mutation score as the primary metric. We apply GPT-4o mini to 200 Java functions from the Apache Commons dataset and measure mutation score and branch coverage. GPT-4o mini achieves median mutation score 61.3% vs EvoSuite 48.7%. Our results suggest LLM-generated tests can complement search-based tools, particularly for functions with complex logic.', assignedTo: currentUser.email },
        { id: `${newProjId}-intro`, name: 'sections/01_intro.tex', filename: 'sections/01_intro.tex', content: '% Introduction (RW)\n\\section{Introduction}\n\\label{sec:intro}\nWriting software unit tests manually is time-consuming and error-prone. Recent studies have shown that Large Language Models (LLMs) can automate unit test generation. However, no study has evaluated GPT-4o mini on Java projects using mutation score as the primary metric.\n\nIn this paper, we present an empirical evaluation of GPT-4o mini. To summarize, this paper contributes:\n(1) The first empirical evaluation of GPT-4o mini for Java unit test generation.\n(2) Experimental results showing LLM-generated tests achieve higher mutation score.\n\nThe rest of this paper is structured as follows. Section \\ref{sec:related} discusses related work.', assignedTo: memberEmails[0] || '' },
        { id: `${newProjId}-related`, name: 'sections/02_related.tex', filename: 'sections/02_related.tex', content: '% Related Work (DG)\n\\section{Related Work}\n\\label{sec:related}\n\\subsection{LLM for Test Generation}\nSeveral researchers have explored LLMs for test generation. Chen et al. \\cite{chen2023testgen} evaluated LLMs on Python code. However, their study did not focus on Java or mutation coverage.\n\n\\subsection{Search-Based Software Testing}\nSearch-Based Software Testing (SBST) tools like EvoSuite use genetic algorithms to generate tests. While effective at coverage, they often generate tests with weak assertions. Unlike prior work, this paper is the first to directly compare GPT-4o mini with EvoSuite on Java libraries.', assignedTo: memberEmails[1] || '' },
        { id: `${newProjId}-method`, name: 'sections/03_method.tex', filename: 'sections/03_method.tex', content: '% Methodology (LR)\n\\section{Methodology}\n\\label{sec:method}\n\\subsection{Dataset}\nWe select 200 Java functions from the Apache Commons library. These functions represent typical utility code with varying complexity.\n\n\\subsection{Experimental Setup}\nWe use the \\texttt{gpt-4o-mini-2024-07-18} model with temperature 0. The prompt template includes the signature and body of the target Java function. Our replication package, including datasets, prompts, scripts, and raw results, is publicly available at: \\url{https://github.com/evidencepilot/swt301-replication}.\n\n\\subsection{Metrics}\nWe measure mutation score using PITest, and branch coverage using JaCoCo.', assignedTo: memberEmails[2] || '' },
        { id: `${newProjId}-results`, name: 'sections/04_results.tex', filename: 'sections/04_results.tex', content: '% Results (MS)\n\\section{Results}\n\\label{sec:results}\nTable \\ref{tab:results} shows the mutation scores for each tool. The median mutation score of GPT-4o mini is 61.3% (IQR: [55%, 72%]). The Wilcoxon signed-rank test yields $p=0.007$, showing statistical significance with Cliff\'s delta $\\delta=0.21$ (small effect size).\n\n\\begin{table}[h]\n\\caption{Mutation Score Comparison}\n\\label{tab:results}\n\\begin{center}\n\\begin{tabular}{lccc}\n\\toprule\n\\textbf{Condition} & \\textbf{Mutation Score} & \\textbf{p-value} & \\textbf{Effect Size} \\\\\n\\midrule\nEvoSuite & 0.48 $\\pm$ 0.12 & — & — \\\\\nGPT-4o mini & 0.61 $\\pm$ 0.09 & p=0.007 & $\\delta$=0.21 (small) \\\\\n\\bottomrule\n\\end{tabular}\n\\end{center}\n\\end{table}', assignedTo: memberEmails[3] || '' },
        { id: `${newProjId}-discussion`, name: 'sections/05_discussion.tex', filename: 'sections/05_discussion.tex', content: '% Discussion (PL)\n\\section{Discussion}\n\\label{sec:discussion}\n\\subsection{Qualitative Analysis of Failures}\nWe observe that GPT-4o mini struggles with complex mathematical constraints, producing uncompilable assertions in 5% of cases.\n\n\\subsection{Comparison with Prior Work}\nOur results confirm the findings of Chen et al. \\cite{chen2023testgen} that LLMs generate more readable assertions than search-based tools.', assignedTo: currentUser.email },
        { id: `${newProjId}-threats`, name: 'sections/06_threats.tex', filename: 'sections/06_threats.tex', content: '% Threats to Validity (RW)\n\\section{Threats to Validity}\n\\label{sec:threats}\n\\begin{itemize}\n\\item \\textbf{Internal:} The stochastic nature of LLMs could cause variations in results. We mitigated this by setting temperature to 0.\n\\item \\textbf{External:} Our findings are limited to Java functions from Apache Commons, which may not generalize to other programming languages.\n\\end{itemize}', assignedTo: memberEmails[0] || '' },
        { id: `${newProjId}-conclusion`, name: 'sections/07_conclusion.tex', filename: 'sections/07_conclusion.tex', content: '% Conclusion (RW)\n\\section{Conclusion}\n\\label{sec:conclusion}\nWe evaluated GPT-4o mini on Java unit test generation. Results show that GPT-4o mini outperforms EvoSuite with a median mutation score of 61.3%. Future work could investigate prompt engineering techniques to improve compilability.', assignedTo: memberEmails[0] || '' }
      ];

      fileTemplates.forEach(t => {
        papers.push({
          id: t.id,
          projectId: newProjId,
          name: t.name,
          filename: t.filename,
          originalFilename: t.filename,
          content: t.content,
          extractedText: '',
          size: t.content.length,
          uploadedAt: new Date().toISOString(),
          assignedTo: t.assignedTo || '',
          status: 'DRAFT',
          comments: []
        });
      });
      setDB('papers', papers);

      return respond201(newProject);
    }

    if (method === 'GET' && pathWithoutQuery.startsWith('/api/projects/')) {
      const parts = pathWithoutQuery.split('/');
      const projId = parts[3];
      
      if (parts[4] === 'sources') {
        const sources = getDB('sources', []);
        const filtered = sources.filter(s => s.projectId === projId).map(s => ({
          ...s,
          originalFilename: s.originalFilename || s.filename || s.name || 'document.pdf'
        }));
        return respond200(filtered);
      }
      
      if (parts[4] === 'collections') {
        const collections = getDB('collections', []);
        const filtered = collections.filter(c => c.projectId === projId);
        console.log("[Mock API Debug] GET collections for project via projects route:", projId);
        console.log("All collections in DB:", collections);
        console.log("Filtered collections:", filtered);
        return respond200(filtered);
      }
      
      if (parts[4] === 'traceability-export') {
        const projects = getDB('projects', []);
        const project = projects.find(p => p.id === projId);
        if (!project) return respond404('Không tìm thấy dự án.');

        const claims = getDB('claims', []).filter(c => c.projectId === projId);
        const sources = getDB('sources', []).filter(s => s.projectId === projId);

        const graphClaims = claims.map(c => {
          return {
            content: c.content,
            graphData: c.status === 'ANALYZED' ? {
              status: 'COMPLETED',
              verdict: c.verdict || 'SUPPORTED',
              confidence: c.confidence || 0.85,
              explanation: c.explanation || 'Luận điểm được đối sánh khớp hoàn toàn với tài liệu chứng cứ tải lên.',
              missing_evidence: c.missing_evidence || []
            } : {
              status: 'MISSING',
              verdict: null,
              confidence: 0,
              explanation: null,
              missing_evidence: []
            }
          };
        });

        const graphSources = sources.map(s => {
          return {
            filename: s.filename,
            referenceCount: claims.some(c => c.status === 'ANALYZED') ? 1 : 0
          };
        });

        return respond200({
          projectTitle: project.title,
          projectStatus: project.status,
          claims: graphClaims,
          sources: graphSources
        });
      }

      const projects = getDB('projects', []);
      const project = projects.find(p => p.id === projId);
      if (!project) return respond404('Không tìm thấy dự án.');
      return respond200(project);
    }

    if (method === 'PUT' && pathWithoutQuery.startsWith('/api/projects/') && pathWithoutQuery.endsWith('/members')) {
      const parts = pathWithoutQuery.split('/');
      const projId = parts[3];
      const projects = getDB('projects', []);
      const pIdx = projects.findIndex(p => p.id === projId);
      if (pIdx === -1) return respond404('Không tìm thấy dự án.');

      const { members, assignments } = body;

      if (members) {
        projects[pIdx].members = members;
      }
      setDB('projects', projects);

      if (assignments) {
        const papers = getDB('papers', []);
        papers.forEach(p => {
          if (p.projectId === projId && assignments[p.filename] !== undefined) {
            p.assignedTo = assignments[p.filename];
          }
        });
        setDB('papers', papers);
      }

      return respond200(projects[pIdx]);
    }

    if (method === 'DELETE' && pathWithoutQuery.startsWith('/api/projects/')) {
      const parts = pathWithoutQuery.split('/');
      const projId = parts[3];
      const projects = getDB('projects', []);
      setDB('projects', projects.filter(p => p.id !== projId));
      
      const sources = getDB('sources', []);
      setDB('sources', sources.filter(s => s.projectId !== projId));

      const claims = getDB('claims', []);
      setDB('claims', claims.filter(c => c.projectId !== projId));

      const papers = getDB('papers', []);
      setDB('papers', papers.filter(p => p.projectId !== projId));

      return respond200({ message: 'Đã xóa dự án thành công.' });
    }

    // 5. Tải lên tệp chứng cứ (Sources của dự án)
    if (method === 'POST' && pathWithoutQuery === '/api/sources/upload') {
      let projectId = queryParams.projectId || '';
      let filename = 'document.pdf';
      let size = 1200000;
      let paperId = queryParams.paperId || '';

      if (body instanceof FormData) {
        const file = body.get('file');
        if (file) {
          filename = file.name;
          size = file.size;
        }
        if (body.get('projectId')) {
          projectId = body.get('projectId');
        }
        if (body.get('paperId')) {
          paperId = body.get('paperId');
        }
      }

      const sources = getDB('sources', []);
      const newSource = {
        id: 'src-' + Math.random().toString(36).substr(2, 9),
        projectId,
        paperId,
        filename,
        name: filename,
        originalFilename: filename,
        type: 'application/pdf',
        size,
        uploadedAt: new Date().toISOString()
      };
      sources.push(newSource);
      setDB('sources', sources);
      return respond201(newSource);
    }

    if (method === 'DELETE' && pathWithoutQuery.startsWith('/api/sources/')) {
      const parts = pathWithoutQuery.split('/');
      const sourceId = parts[3];
      
      const sources = getDB('sources', []);
      const datasetSources = getDB('dataset_sources', []);

      if (sources.some(s => s.id === sourceId)) {
        setDB('sources', sources.filter(s => s.id !== sourceId));
      } else if (datasetSources.some(ds => ds.id === sourceId)) {
        setDB('dataset_sources', datasetSources.filter(ds => ds.id !== sourceId));
      }
      
      return respond200({ message: 'Xóa tệp chứng cứ thành công.' });
    }

    // 6. Tài liệu khoa học (Papers của dự án)
    if (method === 'GET' && pathWithoutQuery.startsWith('/api/papers/by-project/')) {
      const parts = pathWithoutQuery.split('/');
      const projId = parts[4];
      const papers = getDB('papers', []);
      const mapped = papers
        .filter(p => p.projectId === projId)
        .map(p => ({
          ...p,
          originalFilename: p.originalFilename || p.name || p.filename || 'main.tex',
          extractedText: p.extractedText || p.content || ''
        }));
      return respond200(mapped);
    }

    if (method === 'POST' && pathWithoutQuery === '/api/papers/upload') {
      let projectId = '';
      let filename = 'draft.tex';
      let size = 5000;
      
      if (body instanceof FormData) {
        const file = body.get('file');
        if (file) {
          filename = file.name;
          size = file.size;
        }
        projectId = body.get('projectId') || body.get('project_id') || '';
      }

      const papers = getDB('papers', []);
      const newPaper = {
        id: 'paper-' + Math.random().toString(36).substr(2, 9),
        projectId,
        name: filename,
        originalFilename: filename,
        filename: filename,
        size,
        uploadedAt: new Date().toISOString(),
        content: `% Tài liệu LaTeX mới tải lên\n\\documentclass{article}\n\\begin{document}\n\\section{Mở đầu}\nĐang cập nhật nội dung...\n\\end{document}`,
        extractedText: `% Tài liệu LaTeX mới tải lên\n\\documentclass{article}\n\\begin{document}\n\\section{Mở đầu}\nĐang cập nhật nội dung...\n\\end{document}`
      };
      papers.push(newPaper);
      setDB('papers', papers);
      return respond201(newPaper);
    }

    // 6.5 Lịch sử phiên bản (Paper Versions)
    if (method === 'GET' && pathWithoutQuery.startsWith('/api/papers/') && pathWithoutQuery.endsWith('/versions')) {
      const parts = pathWithoutQuery.split('/');
      const paperId = parts[3];
      const versions = getDB('paperVersions', []);
      const paperVersionsList = versions.filter(v => v.paperId === paperId);
      return respond200(paperVersionsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }

    if (method === 'POST' && pathWithoutQuery.startsWith('/api/papers/') && pathWithoutQuery.endsWith('/versions')) {
      const parts = pathWithoutQuery.split('/');
      const paperId = parts[3];
      const versions = getDB('paperVersions', []);
      const newVersion = {
        id: 'ver-' + Math.random().toString(36).substr(2, 9),
        paperId,
        versionName: body.versionName || `Phiên bản #${versions.length + 1}`,
        description: body.description || 'Sao lưu thủ công bởi sinh viên.',
        content: body.content || '',
        createdAt: new Date().toISOString()
      };
      versions.push(newVersion);
      setDB('paperVersions', versions);
      return respond201(newVersion);
    }

    if (method === 'PUT' && pathWithoutQuery.startsWith('/api/papers/')) {
      const parts = pathWithoutQuery.split('/');
      const paperId = parts[3];
      const papers = getDB('papers', []);
      const pIdx = papers.findIndex(p => p.id === paperId);
      if (pIdx !== -1) {
        papers[pIdx].content = body.content || '';
        papers[pIdx].extractedText = body.content || '';
        setDB('papers', papers);
        return respond200(papers[pIdx]);
      }
      return respond404('Không tìm thấy tài liệu.');
    }

    if (method === 'DELETE' && pathWithoutQuery.startsWith('/api/papers/')) {
      const parts = pathWithoutQuery.split('/');
      const paperId = parts[3];
      const papers = getDB('papers', []);
      setDB('papers', papers.filter(p => p.id !== paperId));
      return respond200({ message: 'Xóa tài liệu thành công.' });
    }

    if (method === 'POST' && pathWithoutQuery.startsWith('/api/papers/') && pathWithoutQuery.endsWith('/review')) {
      return respond200({
        styleFeedback: "Cấu trúc văn phong học thuật tốt. Tuy nhiên nên tránh sử dụng đại từ nhân xưng ngôi thứ nhất (như 'chúng tôi', 'tôi') trong các lập luận khoa học để giữ tính khách quan.",
        structureFeedback: "Phần 2 (Phân tích) có nhắc đến sự phối hợp DevOps nhưng chưa đính kèm tài liệu tham khảo thực nghiệm từ các dự án lớn. Hãy bổ sung dữ liệu chứng cứ từ tệp nguồn."
      });
    }

    // 7. Luận điểm (Claims) & AI Phân tích chứng cứ đối sánh
    if (method === 'GET' && pathWithoutQuery.startsWith('/api/claims/by-project/')) {
      const parts = pathWithoutQuery.split('/');
      const projId = parts[4];
      const claims = getDB('claims', []);
      return respond200(claims.filter(c => c.projectId === projId));
    }

    if (method === 'POST' && pathWithoutQuery.startsWith('/api/projects/') && pathWithoutQuery.endsWith('/sync-claims')) {
      const parts = pathWithoutQuery.split('/');
      const projId = parts[3];
      const { claimContents } = body;
      const claims = getDB('claims', []);
      const otherClaims = claims.filter(c => c.projectId !== projId);
      const projectClaims = claims.filter(c => c.projectId === projId);

      const newProjectClaims = claimContents.map((content, idx) => {
        const targetId = 'claim-' + (idx + 1);
        // Look for an existing claim in this project with the same content
        const existing = projectClaims.find(c => c.content === content);
        if (existing) {
          return {
            ...existing,
            id: targetId // Re-index ID to match its new physical order of appearance
          };
        } else {
          return {
            id: targetId,
            projectId: projId,
            content,
            active: true,
            aiConfidenceScore: null,
            status: 'PENDING'
          };
        }
      });

      // Sort claims numerically by ID suffix
      newProjectClaims.sort((a, b) => {
        const numA = parseInt(a.id.replace('claim-', '')) || 0;
        const numB = parseInt(b.id.replace('claim-', '')) || 0;
        return numA - numB;
      });

      setDB('claims', [...otherClaims, ...newProjectClaims]);
      return respond200(newProjectClaims);
    }

    if (method === 'POST' && pathWithoutQuery === '/api/claims') {
      const claims = getDB('claims', []);
      const projectId = body.project?.id;
      const newClaim = {
        id: 'claim-' + Math.random().toString(36).substr(2, 9),
        projectId,
        content: body.content,
        active: true,
        aiConfidenceScore: null,
        status: 'PENDING'
      };
      claims.push(newClaim);
      setDB('claims', claims);
      return respond201(newClaim);
    }

    if (method === 'PUT' && pathWithoutQuery.startsWith('/api/claims/')) {
      const parts = pathWithoutQuery.split('/');
      const claimId = parts[3];
      const claims = getDB('claims', []);
      const idx = claims.findIndex(c => c.id === claimId);
      if (idx === -1) return respond404('Không tìm thấy luận điểm.');

      claims[idx] = {
        ...claims[idx],
        content: body.content,
        active: body.active !== undefined ? body.active : claims[idx].active,
        aiConfidenceScore: body.aiConfidenceScore
      };
      setDB('claims', claims);
      return respond200(claims[idx]);
    }

    if (method === 'DELETE' && pathWithoutQuery.startsWith('/api/claims/')) {
      const parts = pathWithoutQuery.split('/');
      const claimId = parts[3];
      const claims = getDB('claims', []);
      setDB('claims', claims.filter(c => c.id !== claimId));
      return respond200({ message: 'Xóa luận điểm thành công.' });
    }

    if (method === 'POST' && pathWithoutQuery.startsWith('/api/claims/') && pathWithoutQuery.endsWith('/analyze')) {
      const parts = pathWithoutQuery.split('/');
      const claimId = parts[3];
      const claims = getDB('claims', []);
      const idx = claims.findIndex(c => c.id === claimId);
      if (idx === -1) return respond404('Không tìm thấy luận điểm.');

      const sources = getDB('sources', []).filter(s => s.projectId === claims[idx].projectId);
      const hasSources = sources.length > 0;
      
      const content = claims[idx].content;
      let confidence = 0.85;
      let verdict = 'SUPPORTED';
      let explanation = 'Luận điểm được đối sánh thành công.';
      let missingEvidence = [];
      
      if (content.includes('Code review') || content.includes('design quality') || content.includes('code review')) {
        explanation = 'The document devops-adoption-metrics.pdf indicates that the Peer Review process successfully identifies 60% of code issues before they enter the staging environment.';
        confidence = 0.84;
      } else if (content.includes('Informal feedback') || content.includes('drift') || content.includes('informal')) {
        explanation = 'The document agile-performance-report.pdf demonstrates that the lack of formal documentation in sync meetings increases system design drift risk by 25%.';
        confidence = 0.87;
      } else if (content.includes('Automated testing') || content.includes('regression')) {
        explanation = 'The document devops-adoption-metrics.pdf proves that automated test suites executed on every commit successfully block regression bugs from entering production.';
        confidence = 0.89;
      } else if (content.includes('Refactoring') || content.includes('technical debt')) {
        explanation = 'The document agile-performance-report.pdf points out that allocating regular sprint resources to refactoring keeps developers velocity stable at 90%.';
        confidence = 0.83;
      } else if (content.includes('traceability graph') || content.includes('auditing')) {
        explanation = 'The document devops-adoption-metrics.pdf confirms that utilizing an automated traceability graph reduces compliance auditing time by 70%.';
        confidence = 0.92;
      } else if (content.includes('Retrospective') || content.includes('continuous process')) {
        explanation = 'The document scrum-guide-2020.pdf describes the Sprint Retrospective as a formal opportunity for the Scrum Team to inspect themselves and plan process improvements.';
        confidence = 0.86;
      } else if (content.includes('Oral agreements') || content.includes('mismatch')) {
        explanation = 'The document agile-performance-report.pdf notes that undocumented verbal agreements are the primary drivers of deliverable deviations.';
        confidence = 0.88;
      } else {
        confidence = hasSources ? (0.75 + Math.random() * 0.2) : 0.45;
        verdict = confidence > 0.7 ? 'SUPPORTED' : 'REFUTED';
        explanation = hasSources 
          ? 'AI found matching references verifying this developer claim.'
          : 'No reference documents found to support this assertion.';
      }

      claims[idx] = {
        ...claims[idx],
        status: 'ANALYZED',
        aiConfidenceScore: confidence,
        confidence,
        verdict,
        explanation,
        missing_evidence: missingEvidence
      };
      setDB('claims', claims);
      return respond200(claims[idx]);
    }

    if (method === 'GET' && pathWithoutQuery.startsWith('/api/claims/') && pathWithoutQuery.endsWith('/matches')) {
      const parts = pathWithoutQuery.split('/');
      const claimId = parts[3];
      const claims = getDB('claims', []);
      const claim = claims.find(c => c.id === claimId);
      if (!claim) return respond404('Không tìm thấy luận điểm.');

      const content = claim.content;
      let filename = 'agile-performance-report.pdf';
      let excerpt = 'Trích dẫn tài liệu mẫu chứng minh cho luận điểm này.';
      
      if (content.includes('DevOps improve') || content.includes('delivery frequency') || content.includes('Agile methods')) {
        filename = 'agile-performance-report.pdf';
        excerpt = 'Key Finding: Organizations that combine lightweight sprint methodologies with strong automation release software 4x more frequently than peers using ad-hoc processes.';
      } else if (content.includes('Daily standup') || content.includes('blockers') || content.includes('standup meetings')) {
        filename = 'agile-performance-report.pdf';
        excerpt = 'Daily standup meetings remain the primary tool for identifying development blocks. In our surveyed cohorts, teams that enforce standard 15-minute daily retrospectives solved blocker issues within an average of 18 hours, compared to 72 hours for teams using ad-hoc slack coordination.';
      } else if (content.includes('CI/CD') || content.includes('release defects') || content.includes('CI/CD automation')) {
        filename = 'devops-adoption-metrics.pdf';
        excerpt = 'Automated testing is crucial for continuous delivery. Running test suites automatically on every pull request reduces critical production bugs by 40% and keeps release regressions near zero.';
      } else if (content.includes('Code review') || content.includes('design quality') || content.includes('code review')) {
        filename = 'devops-adoption-metrics.pdf';
        excerpt = 'Peer code reviews before merging pull requests serve as both a gatekeeper and a knowledge transfer mechanism. Analysis shows that peer reviews identify 60% of critical architecture defects before staging.';
      } else if (content.includes('Informal feedback') || content.includes('drift') || content.includes('informal')) {
        filename = 'agile-performance-report.pdf';
        excerpt = 'We note that informal message channels often cause requirements drift, leading to a 25% increase in technical design rework.';
      } else if (content.includes('Automated testing') || content.includes('regression')) {
        filename = 'devops-adoption-metrics.pdf';
        excerpt = 'Test suites integrated directly into the CI/CD pipeline ensure that refactored codebase changes do not break legacy dependencies.';
      } else if (content.includes('Refactoring') || content.includes('technical debt')) {
        filename = 'devops-adoption-metrics.pdf';
        excerpt = 'Refactoring legacy code minimizes long-term technical debt. Our metrics indicate that dedicating 15% of sprint capacity to automated code refactoring sustains a long-term development velocity of 90%.';
      } else if (content.includes('traceability graph') || content.includes('auditing')) {
        filename = 'instructor-agile-risk-framework.pdf';
        excerpt = 'A claims traceability graph simplifies the auditing process. By automating the extraction and linkage of developer text claims to regulatory resources, organizations can satisfy auditors and maintain velocity.';
      } else if (content.includes('Retrospective') || content.includes('continuous process')) {
        filename = 'scrum-guide-2020.pdf';
        excerpt = 'The Scrum Team inspects how the last Sprint went with regards to individuals, interactions, processes, tools, and their Definition of Done.';
      } else if (content.includes('Oral agreements') || content.includes('mismatch')) {
        filename = 'instructor-agile-risk-framework.pdf';
        excerpt = 'Oral agreements without tracking lead to deliverable mismatch. The lack of structured sprint logs leads to confusion and regression during final delivery.';
      } else {
        filename = 'agile-performance-report.pdf';
        excerpt = 'This report analyzes the adoption of agile frameworks across software organizations in 2026. The empirical study focuses on deployment velocity, sprint predictability, and team satisfaction.';
      }

      return respond200({
        matches: [
          { filename, score: 0.8 + Math.random() * 0.15, excerpt }
        ]
      });
    }

    // 8. Đánh giá & Phản hồi (Feedback & Review)
    if (method === 'POST' && pathWithoutQuery.startsWith('/api/projects/') && pathWithoutQuery.endsWith('/submit-review')) {
      const parts = pathWithoutQuery.split('/');
      const projId = parts[3];
      const { instructorId, paperId } = body;

      const projects = getDB('projects', []);
      const pIdx = projects.findIndex(p => p.id === projId);
      if (pIdx === -1) return respond404('Không tìm thấy dự án.');

      projects[pIdx].status = 'IN_REVIEW';
      setDB('projects', projects);

      const papers = getDB('papers', []);
      const paper = papers.find(p => String(p.id) === String(paperId));
      const paperName = paper ? (paper.originalFilename || paper.name) : 'Unknown Paper.tex';

      if (paper) {
        paper.status = 'SUBMITTED';
        setDB('papers', papers);
      }

      const currentUser = getCurrentUserFromHeaders();
      const feedbackRequests = getDB('feedbackRequests', []);
      const newRequest = {
        id: 'req-' + Math.random().toString(36).substr(2, 9),
        projectId: projId,
        project: { id: projId, name: projects[pIdx].title, title: projects[pIdx].title },
        paperId: paperId || null,
        paperName: paperName,
        student: currentUser ? {
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email
        } : { firstName: 'Học', lastName: 'Viên', email: 'student@evidencepilot.edu' },
        instructorId,
        status: 'PENDING',
        requestedAt: new Date().toISOString()
      };
      feedbackRequests.push(newRequest);
      setDB('feedbackRequests', feedbackRequests);

      const feedbacks = getDB('feedbacks', []);
      feedbacks.push({
        id: 'fb-' + Math.random().toString(36).substr(2, 9),
        requestId: newRequest.id,
        projectId: projId,
        paperId: paperId || null,
        paperName: paperName,
        instructorId,
        content: 'Yêu cầu phê duyệt đang chờ được xử lý.',
        status: 'PENDING',
        requestedAt: newRequest.requestedAt
      });
      setDB('feedbacks', feedbacks);

      return respond200({ message: 'Gửi phê duyệt thành công.' });
    }

    if (method === 'GET' && pathWithoutQuery === '/api/feedback-requests') {
      const feedbackRequests = getDB('feedbackRequests', []);
      const currentUser = getCurrentUserFromHeaders();
      if (!currentUser) return respond401();
      
      if (currentUser.role === 'INSTRUCTOR') {
        return respond200(feedbackRequests.filter(r => r.instructorId === currentUser.id));
      }
      
      if (currentUser.role === 'STUDENT') {
        const studentProjects = getDB('projects', []).filter(p => p.ownerId === currentUser.id).map(p => p.id);
        const feedbacks = getDB('feedbacks', []).filter(f => studentProjects.includes(f.projectId));
        return respond200(feedbacks);
      }

      return respond200(feedbackRequests);
    }

    if (method === 'POST' && pathWithoutQuery.startsWith('/api/feedback-requests/') && pathWithoutQuery.endsWith('/feedback')) {
      const parts = pathWithoutQuery.split('/');
      const reqId = parts[3];
      const { content } = body;

      const feedbackRequests = getDB('feedbackRequests', []);
      const req = feedbackRequests.find(r => r.id === reqId);
      if (!req) return respond404('Không tìm thấy yêu cầu.');

      const feedbacks = getDB('feedbacks', []);
      const existingFbIdx = feedbacks.findIndex(f => f.requestId === reqId);
      if (existingFbIdx !== -1) {
        feedbacks[existingFbIdx].content = content;
      } else {
        feedbacks.push({
          id: 'fb-' + Math.random().toString(36).substr(2, 9),
          requestId: reqId,
          projectId: req.projectId,
          paperId: req.paperId || null,
          paperName: req.paperName || 'Unknown Paper.tex',
          instructorId: req.instructorId,
          content,
          status: req.status === 'APPROVED' ? 'REVIEWED' : req.status,
          requestedAt: new Date().toISOString()
        });
      }
      setDB('feedbacks', feedbacks);

      // Sync comment back to papers database
      if (req.paperId) {
        const papers = getDB('papers', []);
        const paper = papers.find(p => String(p.id) === String(req.paperId));
        if (paper) {
          if (!paper.comments) paper.comments = [];
          
          // Clear default placeholder comments to avoid bloating
          paper.comments = paper.comments.filter(c => c.text !== 'Yêu cầu phê duyệt đang chờ được xử lý.');
          
          paper.comments.push({
            id: 'c-' + Math.random().toString(36).substr(2, 9),
            author: 'Giảng viên',
            text: content,
            createdAt: new Date().toISOString()
          });
          setDB('papers', papers);
        }
      }

      return respond200({ message: 'Cập nhật nhận xét thành công.' });
    }

    if (method === 'POST' && pathWithoutQuery.startsWith('/api/feedback-requests/')) {
      const parts = pathWithoutQuery.split('/');
      const reqId = parts[3];
      const action = parts[4];

      const feedbackRequests = getDB('feedbackRequests', []);
      const reqIdx = feedbackRequests.findIndex(r => r.id === reqId);
      if (reqIdx === -1) return respond404('Không tìm thấy yêu cầu.');

      const req = feedbackRequests[reqIdx];
      const projects = getDB('projects', []);
      const pIdx = projects.findIndex(p => p.id === req.projectId);
      
      const feedbacks = getDB('feedbacks', []);
      const fbIdx = feedbacks.findIndex(f => f.requestId === reqId);

      if (action === 'reviewed') {
        feedbackRequests[reqIdx].status = 'APPROVED';
        if (pIdx !== -1) projects[pIdx].status = 'ACTIVE';
        if (fbIdx !== -1) {
          feedbacks[fbIdx].status = 'REVIEWED';
        }
      } else if (action === 'rejected') {
        feedbackRequests[reqIdx].status = 'REJECTED';
        if (pIdx !== -1) projects[pIdx].status = 'ACTIVE';
        if (fbIdx !== -1) {
          feedbacks[fbIdx].status = 'REJECTED';
        }
      } else if (action === 'return-to-active') {
        feedbackRequests[reqIdx].status = 'RETURNED';
        if (pIdx !== -1) projects[pIdx].status = 'ACTIVE';
        if (fbIdx !== -1) {
          feedbacks[fbIdx].status = 'RETURNED';
        }
      }

      // Sync section paper status and comments
      if (req.paperId) {
        const papers = getDB('papers', []);
        const paper = papers.find(p => String(p.id) === String(req.paperId));
        if (paper) {
          paper.status = action === 'reviewed' ? 'APPROVED' : 'DRAFT';
          if (!paper.comments) paper.comments = [];
          
          const fb = feedbacks.find(f => f.requestId === reqId);
          const commentText = fb ? fb.content : 'Không có nhận xét chi tiết.';
          
          paper.comments.push({
            id: 'c-' + Math.random().toString(36).substr(2, 9),
            author: 'Giảng viên',
            text: commentText,
            createdAt: new Date().toISOString()
          });
          setDB('papers', papers);
        }
      }

      setDB('feedbackRequests', feedbackRequests);
      setDB('projects', projects);
      setDB('feedbacks', feedbacks);

      return respond200({ message: `Trạng thái yêu cầu đã cập nhật thành công: ${action}` });
    }

    // 9. Admin Platform Metrics & Logs
    if (method === 'GET' && pathWithoutQuery === '/api/health') {
      const health = getDB('systemHealth', {
        storageUsed: 42,
        storageTotal: 100,
        activeWorkspaces: 14,
        cpuUsage: "28%"
      });
      return respond200(health);
    }

    if (method === 'GET' && pathWithoutQuery === '/api/user/audit-logs') {
      const logs = getDB('auditLogs', []);
      return respond200(logs);
    }

    // 10. Collections and Reference Documents
    const collectionsProjectRegex = /^\/api\/projects\/([^/]+)\/collections$/;
    const colProjMatch = pathWithoutQuery.match(collectionsProjectRegex);
    if (method === 'GET' && colProjMatch) {
      const pId = colProjMatch[1];
      const collections = getDB('collections', []);
      const filtered = collections.filter(c => c.projectId === pId);
      console.log("[Mock API Debug] GET collections for project:", pId);
      console.log("All collections in DB:", collections);
      console.log("Filtered collections:", filtered);
      return respond200(filtered);
    }

    if (method === 'POST' && pathWithoutQuery === '/api/collections') {
      const collections = getDB('collections', []);
      const newCol = {
        id: 'col_' + Math.floor(100 + Math.random() * 900),
        title: body.title,
        description: body.description || 'No description provided.',
        projectId: body.projectId || 'proj_101',
        paperId: body.paperId || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      collections.push(newCol);
      setDB('collections', collections);

      // Ghi audit log
      const logs = getDB('auditLogs', []);
      const currentUser = getCurrentUserFromHeaders();
      logs.unshift({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        username: currentUser?.email || 'instructor.test@fpt.edu.vn',
        role: currentUser?.role || 'INSTRUCTOR',
        action: `Created new evidence collection template [${newCol.id}]`,
        status: 'SUCCESS'
      });
      setDB('auditLogs', logs);

      return respond201(newCol);
    }

    const collectionIdRegex = /^\/api\/collections\/([^/]+)$/;
    const colMatch = pathWithoutQuery.match(collectionIdRegex);
    if (method === 'PUT' && colMatch) {
      const colId = colMatch[1];
      const collections = getDB('collections', []);
      const idx = collections.findIndex(c => c.id === colId);
      if (idx === -1) return respond404('Không tìm thấy bộ sưu tập.');

      collections[idx] = {
        ...collections[idx],
        title: body.title,
        description: body.description
      };
      setDB('collections', collections);
      return respond200(collections[idx]);
    }

    if (method === 'DELETE' && colMatch) {
      const colId = colMatch[1];
      const collections = getDB('collections', []);
      setDB('collections', collections.filter(c => c.id !== colId));

      const referenceDocuments = getDB('referenceDocuments', []);
      setDB('referenceDocuments', referenceDocuments.filter(d => d.collectionId !== colId));
      return respond200({ message: 'Xóa bộ sưu tập thành công.' });
    }

    if (method === 'GET' && pathWithoutQuery === '/api/collections/documents') {
      const docs = getDB('referenceDocuments', []);
      return respond200(docs);
    }

    const collectionDocsRegex = /^\/api\/collections\/([^/]+)\/documents$/;
    const colDocsMatch = pathWithoutQuery.match(collectionDocsRegex);
    if (method === 'POST' && colDocsMatch) {
      const colId = colDocsMatch[1];
      let filename = 'document.pdf';
      let fileUrl = 'https://pdfobject.com/pdf/sample.pdf';

      if (body instanceof FormData) {
        const file = body.get('file');
        if (file) {
          filename = file.name;
        }
      } else if (body.fileName) {
        filename = body.fileName;
        fileUrl = body.fileUrl;
      }

      const referenceDocuments = getDB('referenceDocuments', []);
      const idx = referenceDocuments.findIndex(d => d.collectionId === colId);
      const newDoc = {
        id: idx > -1 ? referenceDocuments[idx].id : `doc_${Date.now()}`,
        name: filename,
        collectionId: colId,
        fileUrl: fileUrl,
        uploadedAt: new Date().toISOString().split('T')[0]
      };

      if (idx > -1) {
        referenceDocuments[idx] = newDoc;
      } else {
        referenceDocuments.push(newDoc);
      }

      setDB('referenceDocuments', referenceDocuments);
      return respond201(newDoc);
    }

    const paperSectionsRegex = /^\/api\/papers\/([^/]+)\/sections$/;
    const paperSectionsMatch = pathWithoutQuery.match(paperSectionsRegex);
    if (method === 'GET' && paperSectionsMatch) {
      const paperId = paperSectionsMatch[1];
      const papers = getDB('papers', []);
      const paper = papers.find(p => String(p.id) === String(paperId));
      if (!paper) return respond404('Không tìm thấy tài liệu.');

      const sections = [
        { id: 'sec-1', sectionTitle: '1. Introduction' },
        { id: 'sec-2', sectionTitle: '2. Communication Protocols and Risk Reduction' },
        { id: 'sec-3', sectionTitle: '3. Addressing Assumptions' },
        { id: 'sec-4', sectionTitle: '4. CI/CD and Automation Pipelines' }
      ];
      return respond200(sections);
    }

    const paperReviewRegex = /^\/api\/papers\/([^/]+)\/reviews$/;
    const paperReviewMatch = pathWithoutQuery.match(paperReviewRegex);
    if ((method === 'GET' || method === 'POST') && paperReviewMatch) {
      return respond200({
        styleFeedback: "Cấu trúc văn phong học thuật tốt. Tuy nhiên nên tránh sử dụng đại từ nhân xưng ngôi thứ nhất (như 'chúng tôi', 'tôi') trong các lập luận khoa học để giữ tính khách quan.",
        structureFeedback: "Phần 2 (Phân tích) có nhắc đến sự phối hợp DevOps nhưng chưa đính kèm tài liệu tham khảo thực nghiệm từ các dự án lớn. Hãy bổ sung dữ liệu chứng cứ từ tệp nguồn."
      });
    }

    return respond404(`Không tìm thấy endpoint giả lập cho: ${method} ${pathWithoutQuery}`);
  });
}
