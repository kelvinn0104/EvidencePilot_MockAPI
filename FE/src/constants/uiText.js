export const UI_TEXT = {
  vi: {
    // Left Activity Bar
    fileTree: "Danh sách tệp tin",
    versionHistory: "Lịch sử",
    aiAssistant: "Đối chiếu AI",
    settings: "Cài đặt",
    signOut: "Đăng xuất",
    addClaimPlaceholder: "Nhập luận điểm cần đối chiếu...",
    addClaimBtn: "+ Thêm Luận điểm",
    deleteClaimConfirm: "Bạn có chắc chắn muốn xóa luận điểm này?",
    empty: "Trống",
    deleteFile: "Xóa tệp",
    
    // Left Sidebar headers
    projectFiles: "TẬP TIN DỰ ÁN",
    sectionOutline: "Cấu trúc đề mục",
    returnedWithFeedback: "Đã trả về với phản hồi",
    feedbacks: "phản hồi",
    history: "Lịch sử",
    
    // Left Sidebar tree folder labels
    paperDrafts: "Bản thảo",
    sources: "Tài liệu nguồn",
    noDrafts: "Chưa có bản thảo nào",
    noSources: "Chưa có tài liệu nguồn nào",
    
    // Main Headers
    editorHeader: "Bản thảo / ",
    pdfHeader: "Tài liệu PDF",
    aiReview: "AI Review",
    syntaxErrors: "lỗi cú pháp",
    recompile: "Biên dịch",
    
    // Review Mode banner
    reviewModeActive: "Đang xem lại bản ghi:",
    readOnlyText: "(Chế độ đọc)",
    restoreThisVersion: "Khôi phục bản này",
    exitReviewMode: "Thoát",

    // Right Sidebar Drawer tabs
    tabSource: "Tài liệu nguồn",
    tabClaims: "Luận điểm",
    tabFeedback: "Phản hồi",
    tabGraph: "Mạng lưới liên kết",
    
    // Right Sidebar - Source tab
    uploadBtn: "Upload PDF / DOCX",
    uploadingText: "Uploading...",
    sharedResources: "Tài liệu chia sẻ",
    uploadedSources: "Tài liệu tải lên",
    noUploadedSources: "Chưa có tài liệu tải lên.",
    showMore: "Show 2 more...",
    showLess: "Show less",

    // Right Sidebar - Claims tab
    noClaims: "Dự án này chưa có luận điểm nào. Hãy thêm ở trên.",
    claimId: "ID:",
    aiConfidence: "Độ tin cậy:",
    pendingAnalysis: "Chưa phân tích",
    aiAnalyzeBtn: "AI phân tích",
    editBtn: "Sửa",
    deleteBtn: "Xóa",
    bestMatchEvidence: "Chứng cứ khớp nhất (AI gợi ý)",
    searchingMatches: "Đang tìm tài liệu đối chiếu...",
    noMatches: "Không tìm thấy tài liệu nào khớp.",
    matchPercent: "khớp",
    
    // Right Sidebar - Feedback tab
    projectStatus: "Trạng thái dự án",
    statusDraft: "Bản nháp (Draft)",
    statusActive: "Đang hoạt động (Active)",
    statusInReview: "Đang được duyệt (In Review)",
    statusReviewed: "Đã duyệt (Reviewed)",
    submitReviewBtn: "Gửi duyệt cho Giảng viên",
    noFeedbacks: "Dự án chưa có nhận xét nào từ giảng viên.",
    writtenFeedback: "Nhận xét viết tay",
    gradeScore: "Điểm số đánh giá",
    notGraded: "Chưa chấm điểm",
    
    // Right Sidebar - Graph tab
    noGraphData: 'Chưa có dữ liệu đồ thị. Vui lòng bấm nút "AI phân tích" ở Tab Luận điểm cho các luận điểm của bạn.',
    claimsTitle: "Luận điểm",
    sourcesTitle: "Tài liệu đối chiếu",
    citationsCount: "Trích dẫn",
    
    // History Modal
    historyModalTitle: "Lịch sử phiên bản",
    savePlaceholder: "Nhập tên phiên bản (vd: Trước khi sửa lỗi)...",
    saveBtn: "Lưu",
    currentDraftLabel: "Phiên bản hiện tại (Đang soạn thảo)",
    realtimeText: "Thời gian thực",
    activeLabel: "Đang soạn thảo",
    noHistory: "Chưa có phiên bản lịch sử nào được ghi lại.",
    badgeManual: "Thủ công",
    badgeAuto: "Tự động",
    badgeSystem: "Hệ thống",
    restoreBtn: "Khôi phục",
    reviewBtn: "Xem lại",
    
    // Revise Modal
    reviseModalTitle: "Tự động sửa tài liệu",
    reviseModalDesc: "Chọn các phần bạn muốn trợ lý AI hỗ trợ sửa đổi dựa trên nhận xét của giảng viên và các luận điểm đối chiếu.",
    reviseCheckboxLabel: "Sửa đổi các lập luận chưa khớp (Phần 3)",
    cancelBtn: "Hủy",
    startRevisionBtn: "Bắt đầu sửa đổi",
    
    // Submit Review Modal
    submitReviewModalTitle: "Gửi duyệt cho giảng viên",
    submitReviewModalDesc: "Chọn giảng viên hướng dẫn của dự án này để gửi bản nháp LaTeX và danh sách minh chứng đối sánh.",
    selectInstructorPlaceholder: "Chọn giảng viên hướng dẫn...",
    noInstructors: "Không tìm thấy giảng viên nào",
    submitBtn: "Gửi duyệt",
    
    // AI Review Report Modal
    aiReviewModalTitle: "Báo cáo Đánh giá của AI (AI Structural & Style Review)",
    scanningText: "Trợ lý AI đang quét bài viết...",
    scanningDesc: "Đánh giá cấu trúc học thuật, chất lượng chứng cứ và văn phong khoa học...",
    aiStyleTitle: "1. Đánh giá văn phong học thuật",
    aiStylePass: "Văn phong: Đạt yêu cầu",
    aiStyleDesc: "Đề xuất từ chuyên gia AI:",
    aiStyleBullet1: 'Hãy sửa đổi các khẳng định như "Chúng tôi cho rằng..." hoặc "Tôi đề xuất..." thành thể bị động khách quan như "Đề xuất này hướng đến...", "Phân tích chỉ ra rằng...".',
    aiStyleBullet2: "Duy trì văn phong tường thuật khoa học xuyên suốt các chương mục.",
    aiStructureTitle: "2. Đồ thị đối sánh chứng cứ (Evidence Mapping)",
    aiStructureWarn: "Phát hiện khoảng trống chứng cứ",
    aiStructureDesc: "Đề xuất giải quyết:",
    aiStructureBullet1: "Truy cập tab Luận điểm ở thanh bên phải, đối chiếu xem luận điểm nào chưa có nhãn chứng cứ xanh lá (Độ tin cậy).",
    aiStructureBullet2: "Tải lên thêm tài liệu nghiên cứu thực nghiệm để liên kết cơ sở dữ liệu.",
    closeBtn: "Đóng"
  },
  en: {
    // Left Activity Bar
    fileTree: "Project Files",
    versionHistory: "History",
    aiAssistant: "AI Evidence",
    settings: "Settings",
    signOut: "Sign Out",
    addClaimPlaceholder: "Enter claim to align...",
    addClaimBtn: "+ Add Claim",
    deleteClaimConfirm: "Are you sure you want to delete this claim?",
    empty: "Empty",
    deleteFile: "Delete file",
    
    // Left Sidebar headers
    projectFiles: "PROJECT FILES",
    sectionOutline: "Document Outline",
    returnedWithFeedback: "Returned with Feedback",
    feedbacks: "feedbacks",
    history: "History",
    
    // Left Sidebar tree folder labels
    paperDrafts: "Drafts",
    sources: "Sources",
    noDrafts: "No drafts available",
    noSources: "No source files available",
    
    // Main Headers
    editorHeader: "Drafts / ",
    pdfHeader: "PDF Document",
    aiReview: "AI Review",
    syntaxErrors: "syntax errors",
    recompile: "Recompile",
    
    // Review Mode banner
    reviewModeActive: "Reviewing version:",
    readOnlyText: "(Read-only)",
    restoreThisVersion: "Restore this version",
    exitReviewMode: "Exit",

    // Right Sidebar Drawer tabs
    tabSource: "Sources",
    tabClaims: "Claims",
    tabFeedback: "Feedback",
    tabGraph: "Paper Network",
    
    // Right Sidebar - Source tab
    uploadBtn: "Upload PDF / DOCX",
    uploadingText: "Uploading...",
    sharedResources: "Shared Resources",
    uploadedSources: "Uploaded Sources",
    noUploadedSources: "No uploaded sources yet.",
    showMore: "Show 2 more...",
    showLess: "Show less",

    // Right Sidebar - Claims tab
    noClaims: "No claims in this project. Please add a claim above.",
    claimId: "ID:",
    aiConfidence: "AI Confidence:",
    pendingAnalysis: "Not Analyzed",
    aiAnalyzeBtn: "AI Analyze",
    editBtn: "Edit",
    deleteBtn: "Delete",
    bestMatchEvidence: "Best Match Evidence (AI Suggestion)",
    searchingMatches: "Searching evidence matches...",
    noMatches: "No matching evidence found.",
    matchPercent: "match",
    
    // Right Sidebar - Feedback tab
    projectStatus: "Project Status",
    statusDraft: "Draft",
    statusActive: "Active",
    statusInReview: "In Review",
    statusReviewed: "Reviewed",
    submitReviewBtn: "Submit for Instructor Review",
    noFeedbacks: "No feedbacks from instructor yet.",
    writtenFeedback: "Written Feedback",
    gradeScore: "Grade Score",
    notGraded: "Not graded yet",
    
    // Right Sidebar - Graph tab
    noGraphData: 'No graph data. Please click "AI Analyze" in the Claims Tab first.',
    claimsTitle: "Claims",
    sourcesTitle: "Sources",
    citationsCount: "Citations",
    
    // History Modal
    historyModalTitle: "Version History",
    savePlaceholder: "Enter version label (e.g., Before fixing)...",
    saveBtn: "Save",
    currentDraftLabel: "Current Draft (Unsaved Changes)",
    realtimeText: "Real-time",
    activeLabel: "Drafting",
    noHistory: "No history checkpoints recorded yet.",
    badgeManual: "Manual",
    badgeAuto: "Auto",
    badgeSystem: "System",
    restoreBtn: "Restore",
    reviewBtn: "Review",
    
    // Revise Modal
    reviseModalTitle: "Auto-Revise Document",
    reviseModalDesc: "Select sections you want the AI assistant to optimize based on instructor feedback and citations.",
    reviseCheckboxLabel: "Revise unverified claims (Section 3)",
    cancelBtn: "Cancel",
    startRevisionBtn: "Start Revision",
    
    // Submit Review Modal
    submitReviewModalTitle: "Submit for Instructor Review",
    submitReviewModalDesc: "Select the instructor of this project to submit your LaTeX draft and matched evidence graph.",
    selectInstructorPlaceholder: "Select instructor...",
    noInstructors: "No instructors found",
    submitBtn: "Submit",
    
    // AI Review Report Modal
    aiReviewModalTitle: "AI Structural & Style Review Report",
    scanningText: "AI Assistant is scanning document...",
    scanningDesc: "Analyzing academic structure, evidence coverage, and scientific tone...",
    aiStyleTitle: "1. Academic Tone & Style Review",
    aiStylePass: "Tone: Pass",
    aiStyleDesc: "AI Suggestions:",
    aiStyleBullet1: 'Replace active first-person pronouns like "We assume..." or "I propose..." with passive or objective voice like "It is proposed..." or "The analysis indicates...".',
    aiStyleBullet2: "Maintain objective scientific narrative throughout all sections.",
    aiStructureTitle: "2. Evidence Graph (Evidence Mapping)",
    aiStructureWarn: "Evidence Gap Identified",
    aiStructureDesc: "Suggestions:",
    aiStructureBullet1: "Go to the Claims tab on the right sidebar and look for claims that do not have a green confidence label.",
    aiStructureBullet2: "Upload more empirical source files to bridge the citation gap.",
    closeBtn: "Close"
  }
};
