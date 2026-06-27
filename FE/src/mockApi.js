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
      

      if (!localStorage.getItem('mock_db_initialized_en_v7')) {
        setDB('users', [
          { id: 1, email: 'student@evidencepilot.edu', password: '123', role: 'STUDENT', firstName: 'Nguyễn', lastName: 'Văn A', age: 21 },
          { id: 2, email: 'instructor@evidencepilot.edu', password: '123', role: 'INSTRUCTOR', firstName: 'Dr. Phạm', lastName: 'Thị B', age: 45 }
        ]);
        setDB('projects', [
          { id: 'proj-1', title: 'Nghiên cứu Agile & DevOps', name: 'Nghiên cứu Agile & DevOps', description: 'Dự án phân tích tính hiệu quả của Agile/Scrum kết hợp DevOps trong các doanh nghiệp khởi nghiệp.', ownerId: 1, status: 'ACTIVE', createdAt: new Date().toISOString() }
        ]);
        setDB('sources', [
          { id: 'src-1', projectId: 'proj-1', filename: 'agile-performance-report.pdf', name: 'agile-performance-report.pdf', originalFilename: 'agile-performance-report.pdf', type: 'application/pdf', size: 1024500, uploadedAt: new Date().toISOString() },
          { id: 'src-2', projectId: 'proj-1', filename: 'devops-adoption-metrics.pdf', name: 'devops-adoption-metrics.pdf', originalFilename: 'devops-adoption-metrics.pdf', type: 'application/pdf', size: 852000, uploadedAt: new Date().toISOString() }
        ]);
        setDB('papers', [
          {
            id: 'paper-1',
            projectId: 'proj-1',
            name: 'react-benchmarks.tex',
            originalFilename: 'react-benchmarks.tex',
            filename: 'react-benchmarks.tex',
            size: 6000,
            uploadedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - React Benchmarks\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{React Concurrent Mode Performance Benchmarks}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nReact concurrent rendering introduces scheduling priorities. Under high load, we verify that \\hl{React Concurrent Mode improves rendering scheduling priorities under high load.} Component state updates are split into low and high priority tasks.\n\\end{document}',
            extractedText: '% LaTeX Draft - React Benchmarks\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{React Concurrent Mode Performance Benchmarks}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nReact concurrent rendering introduces scheduling priorities. Under high load, we verify that \\hl{React Concurrent Mode improves rendering scheduling priorities under high load.} Component state updates are split into low and high priority tasks.\n\\end{document}'
          },
          {
            id: 'paper-2',
            projectId: 'proj-1',
            name: 'agile-devops-thesis.tex',
            originalFilename: 'agile-devops-thesis.tex',
            filename: 'agile-devops-thesis.tex',
            size: 12000,
            uploadedAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - Agile DevOps Analysis\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\n\\title{Evidence-Based Automated Traceability in Agile Software Engineering}\n\\author{John Doe}\n\\date{\\today}\n\n\\begin{document}\n\\maketitle\n\n\\section{Introduction}\nAgile software development depends on fast communication between stakeholders, product owners, and delivery teams. However, project risk increases when feedback loops are informal or delayed. \n\n\\hl{Agile methods combined with DevOps improve software delivery frequency.} By tracking the relationships between developer claims and underlying source document facts, we can build a formal network of evidence that satisfies regulatory audits and sprint feedback loops.\n\n\\section{Team Collaboration and Ceremonies}\nThe Scrum guide establishes specific roles and ceremonies to build trust. Collaboration is key in modern development. Furthermore, \\hl{Daily standup meetings help identify technical blockers early.} Daily synchronization reduces blocker delays from weeks to under 24 hours.\n\nAt the end of each sprint, \\hl{Sprint Retrospective meetings drive continuous process improvement.} The team inspects its own performance and implements action items for the next cycle.\n\n\\section{CI/CD and Automation Pipelines}\nModern software delivery requires reliable automation. Integration and deployment processes must be automated to reduce manual errors. \\hl{CI/CD automation reduces software release defects.} \n\nAdditionally, continuous testing is critical. \\hl{Automated testing prevents regression defects during refactoring.} Running automated test suites on every pull request prevents regression defects. To keep codebase maintainable, developers must refactor. \\hl{Refactoring legacy code minimizes long-term technical debt.} Continuous refactoring prevents architectural decay.\n\n\\section{Quality Assurance and Peer Review}\nQuality assurance cannot rely only on tests. Human reviews are necessary. \\hl{Code review improves system design quality.} Peer reviews distribute system knowledge across the team and catch design issues.\n\nHowever, formal documentation is needed. \\hl{Informal feedback loops increase requirement drift risks.} Relying on informal chats instead of written requirements causes deviations. Similarly, \\hl{Oral agreements without tracking lead to deliverable mismatch.} Oral agreements tend to be forgotten or misinterpreted.\n\n\\section{Auditability and Traceability Graph}\nCompliance in regulated industries requires detailed audits. Manually mapping developer claims to technical evidence is exhausting. \\hl{A claims traceability graph simplifies the auditing process.} Our traceability graph reduces compliance audit time by 70\\% by automatically mapping claims to documents.\n\\end{document}',
            extractedText: '% LaTeX Draft - Agile DevOps Analysis\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\n\\title{Evidence-Based Automated Traceability in Agile Software Engineering}\n\\author{John Doe}\n\\date{\\today}\n\n\\begin{document}\n\\maketitle\n\n\\section{Introduction}\nAgile software development depends on fast communication between stakeholders, product owners, and delivery teams. However, project risk increases when feedback loops are informal or delayed. \n\n\\hl{Agile methods combined with DevOps improve software delivery frequency.} By tracking the relationships between developer claims and underlying source document facts, we can build a formal network of evidence that satisfies regulatory audits and sprint feedback loops.\n\n\\section{Team Collaboration and Ceremonies}\nThe Scrum guide establishes specific roles and ceremonies to build trust. Collaboration is key in modern development. Furthermore, \\hl{Daily standup meetings help identify technical blockers early.} Daily synchronization reduces blocker delays from weeks to under 24 hours.\n\nAt the end of each sprint, \\hl{Sprint Retrospective meetings drive continuous process improvement.} The team inspects its own performance and implements action items for the next cycle.\n\n\\section{CI/CD and Automation Pipelines}\nModern software delivery requires reliable automation. Integration and deployment processes must be automated to reduce manual errors. \\hl{CI/CD automation reduces software release defects.} \n\nAdditionally, continuous testing is critical. \\hl{Automated testing prevents regression defects during refactoring.} Running automated test suites on every pull request prevents regression defects. To keep codebase maintainable, developers must refactor. \\hl{Refactoring legacy code minimizes long-term technical debt.} Continuous refactoring prevents architectural decay.\n\n\\section{Quality Assurance and Peer Review}\nQuality assurance cannot rely only on tests. Human reviews are necessary. \\hl{Code review improves system design quality.} Peer reviews distribute system knowledge across the team and catch design issues.\n\nHowever, formal documentation is needed. \\hl{Informal feedback loops increase requirement drift risks.} Relying on informal chats instead of written requirements causes deviations. Similarly, \\hl{Oral agreements without tracking lead to deliverable mismatch.} Oral agreements tend to be forgotten or misinterpreted.\n\n\\section{Auditability and Traceability Graph}\nCompliance in regulated industries requires detailed audits. Manually mapping developer claims to technical evidence is exhausting. \\hl{A claims traceability graph simplifies the auditing process.} Our traceability graph reduces compliance audit time by 70\\% by automatically mapping claims to documents.\n\\end{document}'
          },
          {
            id: 'paper-3',
            projectId: 'proj-1',
            name: 'cicd-testing-pipelines.tex',
            originalFilename: 'cicd-testing-pipelines.tex',
            filename: 'cicd-testing-pipelines.tex',
            size: 5500,
            uploadedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - CI/CD Pipelines\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{CI/CD Automation and Test Suite Predictability}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nAutomated deployment pipelines improve quality. We show that \\hl{CI/CD automation reduces software release defects.} Continuous checking blocks runtime failures.\n\\end{document}',
            extractedText: '% LaTeX Draft - CI/CD Pipelines\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{CI/CD Automation and Test Suite Predictability}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nAutomated deployment pipelines improve quality. We show that \\hl{CI/CD automation reduces software release defects.} Continuous checking blocks runtime failures.\n\\end{document}'
          },
          {
            id: 'paper-4',
            projectId: 'proj-1',
            name: 'microservices-security.tex',
            originalFilename: 'microservices-security.tex',
            filename: 'microservices-security.tex',
            size: 5000,
            uploadedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - Security\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{Microservices Security and Token Exchange Patterns}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nDistributed gateways manage authentication tokens. \\hl{Token caching across distributed gateway nodes minimizes latency.} This caches active sessions locally to avoid upstream queries.\n\\end{document}',
            extractedText: '% LaTeX Draft - Security\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{Microservices Security and Token Exchange Patterns}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nDistributed gateways manage authentication tokens. \\hl{Token caching across distributed gateway nodes minimizes latency.} This caches active sessions locally to avoid upstream queries.\n\\end{document}'
          },
          {
            id: 'paper-5',
            projectId: 'proj-1',
            name: 'devops-infrastructure-as-code.tex',
            originalFilename: 'devops-infrastructure-as-code.tex',
            filename: 'devops-infrastructure-as-code.tex',
            size: 5800,
            uploadedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - DevOps IaC\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{DevOps Infrastructure as Code Audit Compliance}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nModern cloud environments are defined as code. We propose that \\hl{An automated compliance auditing framework maps deployment scripts to security requirements.} This ensures continuous checks on clouds.\n\\end{document}',
            extractedText: '% LaTeX Draft - DevOps IaC\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{DevOps Infrastructure as Code Audit Compliance}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nModern cloud environments are defined as code. We propose that \\hl{An automated compliance auditing framework maps deployment scripts to security requirements.} This ensures continuous checks on clouds.\n\\end{document}'
          },
          {
            id: 'paper-6',
            projectId: 'proj-1',
            name: 'distributed-database-consensus.tex',
            originalFilename: 'distributed-database-consensus.tex',
            filename: 'distributed-database-consensus.tex',
            size: 6100,
            uploadedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - Consensus\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{Distributed Consensus under Transient Partitions}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nState replication requires quorum nodes. \\hl{Raft consensus protocol heals quickly under network drops.} Our logs show swift leader re-elections.\n\\end{document}',
            extractedText: '% LaTeX Draft - Consensus\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{Distributed Consensus under Transient Partitions}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nState replication requires quorum nodes. \\hl{Raft consensus protocol heals quickly under network drops.} Our logs show swift leader re-elections.\n\\end{document}'
          },
          {
            id: 'paper-7',
            projectId: 'proj-1',
            name: 'react-state-management.tex',
            originalFilename: 'react-state-management.tex',
            filename: 'react-state-management.tex',
            size: 6400,
            uploadedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - React State\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{React State Management in Scalable Applications}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nGlobal states trigger component renders. \\hl{Zustand has a lower memory footprint and prevents unnecessary re-renders compared to Redux.} This optimizes client performance.\n\\end{document}',
            extractedText: '% LaTeX Draft - React State\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{React State Management in Scalable Applications}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nGlobal states trigger component renders. \\hl{Zustand has a lower memory footprint and prevents unnecessary re-renders compared to Redux.} This optimizes client performance.\n\\end{document}'
          },
          {
            id: 'paper-8',
            projectId: 'proj-1',
            name: 'kafka-event-driven-architecture.tex',
            originalFilename: 'kafka-event-driven-architecture.tex',
            filename: 'kafka-event-driven-architecture.tex',
            size: 6200,
            uploadedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - Kafka\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{Kafka Event-Driven Microservices Communication}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nEvent streams must be highly reliable. \\hl{Transactional message brokers guarantee exact message ordering.} This prevents state anomalies across downstream consumers.\n\\end{document}',
            extractedText: '% LaTeX Draft - Kafka\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{Kafka Event-Driven Microservices Communication}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nEvent streams must be highly reliable. \\hl{Transactional message brokers guarantee exact message ordering.} This prevents state anomalies across downstream consumers.\n\\end{document}'
          },
          {
            id: 'paper-9',
            projectId: 'proj-1',
            name: 'api-gateway-rate-limiting.tex',
            originalFilename: 'api-gateway-rate-limiting.tex',
            filename: 'api-gateway-rate-limiting.tex',
            size: 5900,
            uploadedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - Gateways\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{API Gateway Adaptive Rate Limiting Algorithms}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nGateways protect backend services. We show that \\hl{Dynamic token-bucket algorithms prevent backend server starvation.} Incoming bursts are smoothed dynamically.\n\\end{document}',
            extractedText: '% LaTeX Draft - Gateways\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{API Gateway Adaptive Rate Limiting Algorithms}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nGateways protect backend services. We show that \\hl{Dynamic token-bucket algorithms prevent backend server starvation.} Incoming bursts are smoothed dynamically.\n\\end{document}'
          },
          {
            id: 'paper-10',
            projectId: 'proj-1',
            name: 'react-server-components.tex',
            originalFilename: 'react-server-components.tex',
            filename: 'react-server-components.tex',
            size: 5700,
            uploadedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
            content: '% LaTeX Draft - RSC\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{React Server Components Architecture Analysis}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nServer components render on the backend. \\hl{React Server Components reduce client-side bundle sizes.} Code dependencies stay server-side.\n\\end{document}',
            extractedText: '% LaTeX Draft - RSC\n\\documentclass{article}\n\\usepackage[utf-8]{inputenc}\n\\usepackage{xcolor}\n\\usepackage{soul}\n\\begin{document}\n\\title{React Server Components Architecture Analysis}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nServer components render on the backend. \\hl{React Server Components reduce client-side bundle sizes.} Code dependencies stay server-side.\n\\end{document}'
          }
        ]);
        setDB('paperVersions', [
          { 
            id: 'ver-1', 
            paperId: 'paper-1', 
            versionName: 'Initial Draft', 
            description: 'Initial LaTeX outline for Agile & DevOps research.', 
            content: '% LaTeX Draft - Initial Draft\n\\documentclass{article}\n\\begin{document}\n\\title{Evidence Traceability in Agile Environments}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nAgile methods combined with DevOps improve software delivery.\n\\end{document}', 
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString() 
          },
          { 
            id: 'ver-2', 
            paperId: 'paper-1', 
            versionName: 'Expanded Draft', 
            description: 'Added daily standup section and CI/CD parameters.', 
            content: '% LaTeX Draft - Expanded Draft\n\\documentclass{article}\n\\begin{document}\n\\title{Evidence Traceability in Agile Environments}\n\\author{John Doe}\n\\maketitle\n\\section{Introduction}\nAgile methods combined with DevOps improve software delivery.\n\\section{Team Collaboration}\n\\hl{Daily standup meetings help identify technical blockers early.}\n\\end{document}', 
            createdAt: new Date(Date.now() - 3600000).toISOString() 
          }
        ]);
        setDB('claims', [
          { id: 'claim-1', projectId: 'proj-1', content: 'Agile methods combined with DevOps improve software delivery frequency.', active: true, aiConfidenceScore: 0.88, status: 'ANALYZED', verdict: 'SUPPORTED', confidence: 0.88, explanation: 'Tài liệu agile-performance-report.pdf ghi nhận hiệu suất triển khai tăng gấp 4 lần sau khi áp dụng kết hợp.', missing_evidence: [] },
          { id: 'claim-2', projectId: 'proj-1', content: 'Daily standup meetings help identify technical blockers early.', active: true, aiConfidenceScore: 0.82, status: 'ANALYZED', verdict: 'SUPPORTED', confidence: 0.82, explanation: 'Tài liệu scrum-guide-2020.pdf nhấn mạnh vai trò của Daily Scrum trong việc tối ưu hóa khả năng cộng tác và xử lý điểm nghẽn.', missing_evidence: [] },
          { id: 'claim-3', projectId: 'proj-1', content: 'CI/CD automation reduces software release defects.', active: true, aiConfidenceScore: 0.91, status: 'ANALYZED', verdict: 'SUPPORTED', confidence: 0.91, explanation: 'Tài liệu devops-adoption-metrics.pdf ghi nhận tỉ lệ lỗi giảm 40% nhờ tích hợp kiểm thử tự động.', missing_evidence: [] },
          { id: 'claim-4', projectId: 'proj-1', content: 'Code review improves system design quality.', active: true, aiConfidenceScore: null, status: 'PENDING' },
          { id: 'claim-5', projectId: 'proj-1', content: 'Informal feedback loops increase requirement drift risks.', active: true, aiConfidenceScore: null, status: 'PENDING' },
          { id: 'claim-6', projectId: 'proj-1', content: 'Automated testing prevents regression defects during refactoring.', active: true, aiConfidenceScore: null, status: 'PENDING' },
          { id: 'claim-7', projectId: 'proj-1', content: 'Refactoring legacy code minimizes long-term technical debt.', active: true, aiConfidenceScore: null, status: 'PENDING' },
          { id: 'claim-8', projectId: 'proj-1', content: 'A claims traceability graph simplifies the auditing process.', active: true, aiConfidenceScore: null, status: 'PENDING' },
          { id: 'claim-9', projectId: 'proj-1', content: 'Sprint Retrospective meetings drive continuous process improvement.', active: true, aiConfidenceScore: null, status: 'PENDING' },
          { id: 'claim-10', projectId: 'proj-1', content: 'Oral agreements without tracking lead to deliverable mismatch.', active: true, aiConfidenceScore: null, status: 'PENDING' }
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
          paperId: 'paper-1',
          paperName: 'react-benchmarks.tex',
          student: { firstName: 'Học', lastName: 'Viên', email: 'student@evidencepilot.edu' },
          instructorId: 2,
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        };
        setDB('feedbackRequests', [initialRequest]);
        setDB('feedbacks', [{
          id: 'fb-initial-1',
          requestId: 'req-initial-1',
          projectId: 'proj-1',
          paperId: 'paper-1',
          paperName: 'react-benchmarks.tex',
          instructorId: 2,
          content: 'Yêu cầu phê duyệt đang chờ được xử lý.',
          status: 'PENDING',
          requestedAt: initialRequest.requestedAt
        }]);
        localStorage.setItem('mock_db_initialized_en_v7', 'true');
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
      return respond201({ message: 'Đăng ký tài khoản thành công!' });
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

    // 4. Dự án của Sinh viên
    if (method === 'GET' && pathWithoutQuery === '/api/projects') {
      const projects = getDB('projects', []);
      const currentUser = getCurrentUserFromHeaders();
      if (!currentUser) return respond401();
      
      if (currentUser.role === 'STUDENT') {
        return respond200(projects.filter(p => p.ownerId === currentUser.id));
      }
      return respond200(projects);
    }

    if (method === 'POST' && pathWithoutQuery === '/api/projects') {
      const projects = getDB('projects', []);
      const currentUser = getCurrentUserFromHeaders();
      if (!currentUser) return respond401();
      const newProject = {
        id: 'proj-' + Math.random().toString(36).substr(2, 9),
        title: body.title,
        name: body.title,
        description: body.description,
        ownerId: currentUser.id,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      projects.push(newProject);
      setDB('projects', projects);
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

      if (body instanceof FormData) {
        const file = body.get('file');
        if (file) {
          filename = file.name;
          size = file.size;
        }
        if (body.get('projectId')) {
          projectId = body.get('projectId');
        }
      }

      const sources = getDB('sources', []);
      const newSource = {
        id: 'src-' + Math.random().toString(36).substr(2, 9),
        projectId,
        filename,
        name: filename,
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
      const existingFbIdx = feedbacks.findIndex(f => f.requestId === reqId && f.status === 'PENDING');
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
          status: 'PENDING',
          requestedAt: new Date().toISOString()
        });
      }
      setDB('feedbacks', feedbacks);
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
        if (pIdx !== -1) projects[pIdx].status = 'COMPLETED';
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

      setDB('feedbackRequests', feedbackRequests);
      setDB('projects', projects);
      setDB('feedbacks', feedbacks);

      return respond200({ message: `Trạng thái yêu cầu đã cập nhật thành công: ${action}` });
    }

    return respond404(`Không tìm thấy endpoint giả lập cho: ${method} ${pathWithoutQuery}`);
  });
}
