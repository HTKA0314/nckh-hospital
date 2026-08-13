export type Role =
  | 'RESEARCHER'            // Nghiên cứu viên
  | 'RESEARCH_OFFICE'       // Chuyên viên phòng NCKH (nghiệp vụ)
  | 'COUNCIL_MEMBER'        // Thành viên hội đồng (global role, chi tiết phân vai bằng CouncilRole)
  | 'ETHICS_OFFICE'         // Văn phòng đạo đức
  | 'FINANCE_OFFICER'       // Tài vụ
  | 'DIRECTOR'              // Lãnh đạo / Ban Giám đốc phê duyệt
  | 'ADMIN';                // System Admin (quản trị kỹ thuật)

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId: string;
  phone: string;
  academicTitle: string; // GS, PGS, TS, ThS, BS.CKII, BS.CKI, BS, CN...
  degree: string;
  avatarUrl?: string;
};

export type Department = {
  id: string;
  code: string;
  name: string;
  type: 'CLINICAL' | 'SUB_CLINICAL' | 'ADMINISTRATIVE';
};


export type ProjectType =
  | 'NGHIÊN_CỨU_LÂM_SÀNG'
  | 'DỊCH_TỄ_HỌC'
  | 'QUẢN_LÝ_Y_TẾ'
  | 'CẢI_TIẾN_KỸ_THUẬT'
  | 'CAN_THIỆP_CỘNG_ĐỒNG';

export type FundingSource =
  | 'NGÂN_SÁCH_BỆNH_VIỆN'
  | 'TÀI_TRỢ_NGOÀI'
  | 'HỖN_HỢP'
  | 'TỰ_TÚC';

export type ResearchMemberRole =
  | 'CHỦ_NHIỆM'
  | 'THÀNH_VIÊN_CHÍNH'
  | 'THƯ_KÝ_KH'
  | 'KỸ_THUẬT_VIÊN'
  | 'CỘNG_TÁC_VIÊN';

export type RegistrationRoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export type RegistrationRound = {
  id: string;
  code: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  deadlineForAmendment?: string; // Hạn bổ sung hồ sơ
  targetAudience: string;
  priorityFields?: string[]; // Lĩnh vực ưu tiên (cấu hình được)
  requiredDocumentsByResearchType?: Record<string, string[]>; // Danh mục tài liệu bắt buộc theo loại NC
  status: RegistrationRoundStatus;
  description: string;
  maxBudget?: number;
  totalSubmissions?: number;
};

export type ProjectStatus =
  | 'DRAFT'                 // Bản nháp
  | 'SUBMITTED'             // Đã nộp hồ sơ (giai đoạn thẩm định, ra hội đồng do ProposalFlow quản lý)
  | 'WAITING_ASSIGNMENT'    // Chờ quyết định giao thực hiện (Proposal & Ethics đã duyệt)
  | 'IN_PROGRESS'           // Quyết định giao đã ban hành, đang triển khai nghiên cứu
  | 'WAITING_ACCEPTANCE'    // Đã nộp hồ sơ nghiệm thu
  | 'ACCEPTED'              // Hội đồng Nghiệm thu thông qua
  | 'RECOGNIZED'            // Quyết định công nhận kết quả đã ban hành
  | 'CLOSED'                // Hoàn tất các điều kiện đóng hồ sơ theo policy
  | 'ARCHIVED'              // Lưu trữ dài hạn
  | 'SUSPENDED'             // Tạm dừng (có thể tiếp tục)
  | 'TERMINATED'            // Chấm dứt có quyết định
  | 'REJECTED';             // Bị từ chối


export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_ADMIN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'RESUBMITTED'
  | 'ADMIN_VALIDATED'

  // Giai đoạn đề cương
  | 'OUTLINE_SUBMITTED'
  | 'UNDER_PROPOSAL_REVIEW'

  // Sau Hội đồng
  | 'PROPOSAL_REVISION_REQUIRED'
  | 'PROPOSAL_RESUBMITTED'
  | 'UNDER_PROPOSAL_REVISION_REVIEW'
  | 'PROPOSAL_APPROVED'
  | 'REJECTED';                       // Từ chối

export type EthicsStatus =
  | 'NOT_REQUIRED'                // Sàng lọc xác định không cần IRB
  | 'SCREENING_IN_PROGRESS'       // Đang sàng lọc phân loại
  | 'DOSSIER_SUBMITTED'           // Đã nộp hồ sơ đạo đức
  | 'UNDER_ETHICS_REVIEW'         // Hội đồng đang xem xét
  | 'ETHICS_REVISION_REQUIRED'    // Yêu cầu chỉnh sửa hồ sơ/đề cương
  | 'CONDITIONALLY_APPROVED'      // Chấp thuận có điều kiện
  | 'ETHICS_APPROVED'             // Phê duyệt đầy đủ
  | 'ETHICS_REJECTED'             // Từ chối
  | 'EXPIRED'                     // Hết hiệu lực – cần gia hạn
  | 'SUSPENDED'                   // Đình chỉ chấp thuận (dự phòng)
  | 'WITHDRAWN'                   // Rút hồ sơ
  | 'TERMINATED';                 // Thu hồi chấp thuận

/**
 * SM-4: CouncilStatus – Trạng thái Hội đồng
 * Council Flow là engine dùng chung cho Hội đồng xét duyệt đề cương và Hội đồng nghiệm thu. Hội đồng đạo đức được quản lý bằng Ethics Flow riêng.
 */
export type CouncilStatus =
  | 'DRAFT'
  | 'ESTABLISHED'
  | 'EVALUATING'
  | 'MINUTES_DRAFTED'
  | 'CONCLUDED'
  | 'DISSOLVED';

/**
 * SM-5: ProgressReportStatus – Trạng thái Báo cáo Tiến độ
 */
export type ProgressReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REVISION_REQUIRED'
  | 'REJECTED';

export type ChangeRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUIRED'   // Phòng NCKH yêu cầu bổ sung thông tin
  | 'RESUBMITTED'         // Chủ nhiệm nộp lại sau yêu cầu bổ sung
  | 'APPROVED'
  | 'REJECTED';

export type AcceptanceDossierStatus =
  | 'NOT_SUBMITTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_ADMIN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'RESUBMITTED'
  | 'ELIGIBLE_FOR_ACCEPTANCE'
  | 'FORWARDED_TO_COUNCIL';

/**
 * SM-8: DecisionStatus – Trạng thái Văn bản Quyết định pháp lý
 * Điều kiện mở khoá IN_PROGRESS: type='ASSIGNMENT' và status='ISSUED'
 */
export type DecisionStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'RETURNED'
  | 'SIGNED'
  | 'ISSUED';

export type FinanceStatus =
  | 'PENDING'               // Chờ cấp kinh phí
  | 'ACTIVE'                // Đang thực hiện chi tiêu
  | 'AWAITING_FINALIZATION' // Đang quyết toán
  | 'FINALIZED'             // Đã quyết toán xong
  | 'CLOSED';               // Đã đóng tài chính hoàn toàn

export type MilestoneStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'          // Chủ nhiệm đã nộp báo cáo mốc
  | 'REVISION_REQUIRED'  // Phòng NCKH yêu cầu chỉnh sửa
  | 'VERIFIED'           // Phòng NCKH đã xác nhận
  | 'COMPLETED'
  | 'OVERDUE';

/**
 * ContractStatus – Trạng thái Hợp đồng (tuỳ chọn, chỉ khi ResearchContract tồn tại)
 */
export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'SIGNED'
  | 'ACTIVE'
  | 'LIQUIDATED'
  | 'CLOSED';


export type ResearchMember = {
  id: string;
  userId?: string;
  projectId: string;
  fullName: string;
  academicRank: string;
  unit: string;
  roleInProject: ResearchMemberRole;
  contributionPercentage: number;
};

export type DocumentType =
  | 'PROPOSAL_FORM'
  | 'DETAILED_OUTLINE'
  | 'SCIENTIFIC_CV'
  | 'BUDGET_ESTIMATE'
  | 'ETHICS_DOSSIER'
  | 'ETHICS_ICF'          // Informed Consent Form
  | 'PROGRESS_REPORT_DOC'
  | 'ACCEPTANCE_DOSSIER'
  | 'MEETING_MINUTES'
  | 'DECISION_DOC'
  | 'EXPLANATION_LETTER'
  | 'PUBLICATION'         // Bài báo / Công trình công bố
  | 'OTHER';

export type DocumentVersion = {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  downloadUrl: string;
  notes?: string;
  isCurrent: boolean;
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  documentType: DocumentType;
  title: string;
  currentVersion: number;
  currentVersionId: string;
  versions: DocumentVersion[]; // Không ghi đè – lưu toàn bộ lịch sử
};

/**
 * Lịch sử xử lý Quyết định
 */
export type DecisionHistoryEntry = {
  id: string;
  decisionId: string;
  action:
    | 'DRAFT_CREATED'
    | 'SUBMITTED_FOR_SIGNATURE'
    | 'RETURNED'
    | 'RESUBMITTED_FOR_SIGNATURE'
    | 'SIGNED'
    | 'ISSUED';
  fromStatus?: DecisionStatus;
  toStatus: DecisionStatus;
  actorId: string;
  actorName: string;
  actorRole: Role;
  timestamp: string;
  notes?: string;
};

/**
 * Quyết định (Giao thực hiện / Công nhận kết quả)
 */
export type Decision = {
  id: string;
  type: 'ASSIGNMENT' | 'RECOGNITION';
  status: DecisionStatus;
  projectId: string;
  decisionNumber?: string;
  issuedDate?: string;
  signedBy?: string; // Tên người ký hiển thị; production nên lưu thêm signerUserId nếu cần đối soát
  signedDate?: string;
  draftFile?: string;
  signedFile?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  history: DecisionHistoryEntry[];
};

export type SubmissionVersion = {
  id: string;
  projectId: string;
  versionNo: number;
  submittedAt: string;
  submittedBy: string;
  submittedByName: string;
  changeSummary: string;
  isCurrent: boolean;                            // Phiên bản đang có hiệu lực
  status: 'ACTIVE' | 'SUPERSEDED' | 'REJECTED'; // Trạng thái phiên bản
  parentVersionId?: string;                      // Nguồn gốc phiên bản trước
  structuredDataSnapshot: Record<string, unknown>;
  documents: DocumentVersion[];
};

export type AuditLog = {
  id: string;
  timestamp: string;
  userId: string;
  userFullName: string;
  userRole: Role;
  entityType: 'PROJECT' | 'COUNCIL' | 'ETHICS' | 'DECISION' | 'FINANCE' | 'CHANGE_REQUEST' | 'ACCEPTANCE' | 'USER' | 'MILESTONE' | 'SUBMISSION_VERSION' | 'CLOSURE';
  entityId: string;
  actionCode: string;
  fromStatus?: string;
  toStatus?: string;
  notes?: string;
  correlationId?: string;                       // Nhóm các log thuộc cùng 1 business transaction
  metadata?: Record<string, unknown>;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  // ipAddress?: string;  // Để dành cho production
};

export type BusinessEventType =
  | 'PROJECT_SUBMITTED'
  | 'DOSSIER_REVISION_REQUIRED'
  | 'DOSSIER_VALIDATED'
  | 'COUNCIL_ASSIGNED'
  | 'EVALUATION_DUE'
  | 'DECISION_ISSUED'
  | 'PROGRESS_DUE'
  | 'PROGRESS_OVERDUE'
  | 'ETHICS_EXPIRING'
  | 'ACCEPTANCE_REVISION_REQUIRED'
  | 'PROJECT_RECOGNIZED'
  | 'MILESTONE_OVERDUE'
  | 'CHANGE_REQUEST_SUBMITTED'
  | 'FINANCE_CLOSING_REQUIRED'
  | 'DECISION_SIGNATURE_REQUIRED'
  | 'COUNCIL_MINUTES_SIGNATURE_REQUIRED'
  | 'ACCEPTANCE_DOSSIER_SUBMITTED'
  | 'CHANGE_REQUEST_REVISION_REQUIRED'
  | 'PROJECT_CLOSING_REQUIRED'
  | 'ETHICS_DOSSIER_SUBMITTED'
  | 'ETHICS_REVISION_REQUIRED'
  | 'ETHICS_APPROVED';

/**
 * WorkItem – Công việc cần xử lý (tập trung tại Dashboard / My Tasks)
 * Phát sinh từ BusinessEvent, tránh để Dashboard tự suy luận từ 10 SM.
 */
export type WorkItemPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type WorkItemStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export type WorkItem = {
  id: string;
  entityType: string;         // 'PROJECT' | 'COUNCIL' | 'ETHICS'...
  entityId: string;
  entityCode: string;         // Mã hiển thị (DT-2026-001, HĐ-2026-001)
  taskType: BusinessEventType;
  taskTitle: string;          // VD: "Kiểm tra hồ sơ DX-001"
  assignedRole: Role;         // Vai trò cần xử lý
  assignedUserId?: string;    // Người được phân công cụ thể (nếu có)
  dueDate?: string;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  createdAt: string;
  completedAt?: string;
};

/**
 * AcceptanceEvaluation – Kết quả đánh giá của Hội đồng Nghiệm thu
 * Tách biệt khỏi AcceptanceDossierStatus; SM-7 dừng ở FORWARDED_TO_COUNCIL.
 */
export type AcceptanceConclusion = 'ACCEPTED' | 'CONDITIONALLY_ACCEPTED' | 'REJECTED';

export type AcceptanceEvaluation = {
  id: string;
  projectId: string;
  councilId: string;
  conclusion: AcceptanceConclusion;
  ratingLabel?: string;         // Từ AcceptanceRatingLevel (cấu hình được)
  scoreTotal?: number;
  revisionItems?: PostAcceptanceRevision[];
  minutesUrl?: string;
  concludedAt: string;
  concludedBy: string;
};

export type ProjectStatusHistory = {
  id: string;
  projectId: string;
  fromStatus: ProjectStatus | 'NONE';
  toStatus: ProjectStatus;
  changedBy: string;
  changedByName: string;
  userRole: Role;
  changedAt: string;
  action: string;
  comment?: string;
  relatedDocUrl?: string;
};


export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string;
  actualDate?: string;
  weightPercentage: number;
  status: MilestoneStatus;
  deliverables: string;
  assignedTo?: string;      // Người phụ trách mốc
  completionPercentage?: number;
};

export type ProgressReport = {
  id: string;
  projectId: string;
  period: string;           // Tên kỳ báo cáo (theo cấu hình đợt, không hardcode chu kỳ)
  reportingDate: string;
  workCompleted: string;
  resultsAchieved: string;
  reportedCompletionPercentage: number;
  difficulties?: string;
  nextPlan: string;
  evidenceUrls: { name: string; url: string }[];
  status: ProgressReportStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

/**
 * ChangeRequestType – Các loại điều chỉnh đề tài
 */
export type ChangeRequestType =
  | 'EXTENSION'             // Gia hạn thời gian
  | 'CHANGE_PI'             // Thay đổi Chủ nhiệm đề tài
  | 'CHANGE_MEMBER'         // Thay đổi thành viên
  | 'CHANGE_CONTENT'        // Thay đổi nội dung nghiên cứu
  | 'CHANGE_OBJECTIVE'      // Thay đổi mục tiêu nghiên cứu
  | 'CHANGE_PRODUCT'        // Thay đổi sản phẩm cam kết
  | 'ADJUST_BUDGET'         // Điều chỉnh kinh phí
  | 'CHANGE_PARTNER'        // Thay đổi đơn vị phối hợp
  | 'SUSPENSION'            // Tạm dừng
  | 'RESUME'                // Tiếp tục sau tạm dừng
  | 'TERMINATION'           // Chấm dứt
  | 'OTHER';                // Khác

/**
 * ChangeRequestDiff – Bảng so sánh giá trị hiện tại vs đề nghị
 * Không cho sửa dữ liệu gốc; chỉ cập nhật khi ChangeRequestStatus = APPROVED.
 */
export type ChangeRequestDiff = {
  fieldName: string;
  currentValue: string;
  proposedValue: string;
  reason: string;
};

export type ChangeRequest = {
  id: string;
  projectId: string;
  type: ChangeRequestType;
  title: string;
  diffs: ChangeRequestDiff[];  // Bảng so sánh theo từng trường thay đổi
  reason: string;
  explanationDocUrl?: string;
  status: ChangeRequestStatus;
  submittedAt: string;
  submittedBy: string;
  submittedByName: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  responseComment?: string;
};

/**
 * EthicsReviewType – Loại xem xét đạo đức (không hardcode thời hạn)
 */
export type EthicsReviewType = 'EXEMPT' | 'EXPEDITED' | 'FULL_BOARD';

export type EthicsApproval = {
  id: string;
  projectId: string;
  screeningAnswers: {
    involvesHumanSubjects: boolean;
    involvesIdentifiableData: boolean;
    involvesBiologicalSamples: boolean;
    involvesNewInterventionsOrDrugs: boolean;
  };
  ethicsRequired: boolean;
  reviewType?: EthicsReviewType;
  dossierSubmittedDate?: string;
  status: EthicsStatus;
  decisionNumber?: string;
  approvalDate?: string;
  expiryDate?: string;       // Không tự động tính; nhập theo quyết định thực tế
  renewalRequired?: boolean;
  conditionalRequirements?: string[]; // Danh sách điều kiện nếu CONDITIONALLY_APPROVED
  certificateDocUrl?: string;
  notes?: string;
};

/**
 * AcceptanceDossier – Hồ sơ nghiệm thu đề tài
 * Điều kiện tạo Hội đồng: status = ELIGIBLE_FOR_ACCEPTANCE
 */
export type AcceptanceDossier = {
  id: string;
  projectId: string;
  submissionDate: string;
  finalReportUrl?: string;
  productsSummary: string;
  productsCommitted: string;   // Sản phẩm cam kết ban đầu (đối chiếu)
  productsActual: string;      // Sản phẩm thực tế bàn giao
  claimedOverallCompletionPercentage?: number;
  evidenceUrls: { name: string; url: string }[];
  ethicsSummaryUrl?: string;
  financialSummaryUrl?: string;
  publications?: string;
  checklistResults?: {
    finalReportSubmitted: boolean;
    productsCompleted: boolean;
    evidenceValid: boolean;
    progressReportsCompleted: boolean;
    noPendingChangeRequests: boolean;
    ethicsValid: boolean;
    financeConditionMet: boolean;
    publicationsIfRequired: boolean;
  };
  status: AcceptanceDossierStatus;
  postAcceptanceRevisions?: PostAcceptanceRevision[];
  notes?: string;
};

/**
 * PostAcceptanceRevision – Ý kiến hoàn thiện sau Nghiệm thu
 * Điều kiện lập Quyết định Công nhận: tất cả revision đã CONFIRMED
 */
export type PostAcceptanceRevision = {
  id: string;
  councilFeedback: string;     // Ý kiến của Hội đồng
  piResponse?: string;         // Phản hồi của Chủ nhiệm đề tài
  evidenceUrl?: string;
  status: 'PENDING' | 'RESPONDED' | 'CONFIRMED'; // Người có thẩm quyền theo cấu hình quy trình
};

/**
 * FinancialSummary – Tổng quan tài chính đề tài
 */
export type FinancialSummary = {
  id: string;
  projectId: string;
  fundingSource: FundingSource;
  estimatedBudget: number;
  approvedBudget: number;
  allocatedBudget: number;    // Đã cấp/Tạm ứng
  disbursedBudget: number;    // Đã thực chi
  settledBudget: number;      // Đã quyết toán
  refundableBudget: number;   // Hoàn nhập/Thu hồi
  status: FinanceStatus;
  hasContract: boolean;       // Có hợp đồng nghiên cứu hay không (ResearchContract là tuỳ chọn)
  contractLiquidationDate?: string; // Chỉ hiển thị nếu hasContract = true
  notes?: string;
};

// ==========================================
// HỘI ĐỒNG – CẤU HÌNH LINH HOẠT
// ==========================================

export type CouncilType = 'PROPOSAL_REVIEW' | 'ACCEPTANCE';

export type CouncilRole = 'CHỦ_TỊCH' | 'THƯ_KÝ' | 'PHẢN_BIỆN' | 'ỦY_VIÊN';

/**
 * ScoringCriteria – Tiêu chí đánh giá (dynamic, không hardcode 5 tiêu chí)
 */
export type ScoringCriteria = {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  weight: number;         // Trọng số (0–1)
  isRequired: boolean;
};

/**
 * CriteriaSet – Bộ tiêu chí liên kết theo loại hội đồng và loại nghiên cứu
 */
export type CriteriaSet = {
  id: string;
  name: string;
  councilType: CouncilType;
  applicableResearchTypes?: string[];
  criteria: ScoringCriteria[];
};

/**
 * AcceptanceRatingLevel – Mức xếp loại nghiệm thu (cấu hình được, không hardcode)
 */
export type AcceptanceRatingLevel = {
  id: string;
  label: string;          // VD: "Xuất sắc", "Khá", "Đạt", "Không đạt"
  minScore: number;       // Ngưỡng điểm tối thiểu
  maxScore: number;
  isPassingGrade: boolean;
};

export type CouncilMember = {
  id: string;
  councilId: string;
  userId: string;
  userFullName: string;
  academicTitle: string;
  departmentName: string;
  roleInCouncil: CouncilRole;
  hasConflictOfInterest: boolean;
};

export type EvaluationScoreItem = {
  criteriaId: string;
  criteriaName: string;
  maxScore: number;
  weight: number;
  score: number;
  comment?: string;
};

export type EvaluationResult = {
  id: string;
  councilId: string;
  projectId: string;
  councilMemberId: string;
  councilMemberName: string;
  roleInCouncil: CouncilRole;
  scores: EvaluationScoreItem[];
  totalScore: number;
  voteResult: 'APPROVE' | 'APPROVE_WITH_REVISION' | 'REJECT';
  comments: string;
  recommendations?: string;
  submittedAt: string;
  status: 'DRAFT' | 'SUBMITTED' | 'SIGNED';
  signedBy?: string; // Tên người ký hiển thị; production nên lưu thêm signerUserId nếu cần đối soát
  signedAt?: string;
};

export type MeetingMinutes = {
  id: string;
  councilId: string;
  projectId: string;
  meetingDate: string;
  location: string;
  secretaryId: string;
  secretaryName: string;
  chairId: string;
  chairName: string;
  attendeesCount: number;
  summaryOpinions: string;
  conclusion: 'APPROVED' | 'APPROVED_WITH_REVISION' | 'REJECTED' | 'RE_EVALUATE';
  averageScore: number;
  passVoteCount: number;
  totalVoteCount: number;
  ratingLabel?: string;     // Lấy từ AcceptanceRatingLevel (cho Hội đồng Nghiệm thu)
  revisionRequirements?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'SIGNED';
  secretarySignedAt?: string;
  chairSignedAt?: string;
};

export type CouncilProjectAssignment = {
  projectId: string;
  reviewerAssignments?: {  // Số lượng phản biện theo cấu hình, không hardcode PB1/PB2
    reviewerId: string;
    reviewerName: string;
    reviewerOrder: number;
  }[];
  notes?: string;
};

export type Council = {
  id: string;
  code: string;
  name: string;
  type: CouncilType;
  specialtyCluster?: string;
  projectIds: string[];
  projectAssignments?: CouncilProjectAssignment[];
  criteriaSetId?: string;         // Liên kết bộ tiêu chí theo cấu hình
  scoringCriteriaSnapshot?: { id: string; name: string; maxScore: number; weight: number; isRequired: boolean }[];
  ratingScheme?: AcceptanceRatingLevel[]; // Cho Hội đồng Nghiệm thu
  minMembers?: number;            // Số thành viên tối thiểu (cấu hình)
  maxMembers?: number;            // Số thành viên tối đa (cấu hình)
  requiredReviewerCount?: number; // Số phản biện bắt buộc (cấu hình)
  establishmentDecisionNumber?: string;
  decisionDate?: string;
  decisionStatus?: 'DRAFT' | 'SUBMITTED' | 'ISSUED';
  signatoryName?: string;
  signatoryRole?: string;
  meetingDate: string;
  meetingTime?: string;
  meetingFormat?: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  location: string;
  onlineMeetingUrl?: string;
  sendInvitationNotification?: boolean;
  minPassRatio: number;
  status: CouncilStatus;
  members: CouncilMember[];
  minutes?: MeetingMinutes[];
  evaluationResults?: EvaluationResult[];
};

// ==========================================
// QUYẾT ĐỊNH PHÁP LÝ – Tách Decision & Contract
// ==========================================



/**
 * ResearchContract – Hợp đồng nghiên cứu (tuỳ chọn, entity riêng biệt)
 * Không phải bước bắt buộc trong state machine.
 */
export type ResearchContract = {
  id: string;
  projectId: string;
  contractNumber: string;
  signedDate: string;
  expiryDate: string;
  value: number;
  status?: ContractStatus;
  fileUrl?: string;
  liquidationDate?: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  link?: string;
  isRead: boolean;
  createdAt: string;
};

export type ProjectClosureStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type ProjectClosureItem = {
  code: string;
  label: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
};

export type ProjectClosure = {
  id: string;
  projectId: string;
  status: ProjectClosureStatus;
  items: ProjectClosureItem[];
  confirmedBy?: string;
  confirmedByName?: string;
  confirmedAt?: string;
  notes?: string;
};

export interface WorkflowPolicy {
  id: string;
  code: string;
  name: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  registrationMode?: 'ROUND' | 'CONTINUOUS';
  reportingIntervalMonths?: number;  // 1, 3, 6 tháng
  minDurationMonths?: number;
  maxDurationMonths?: number;
  maxExtensionsAllowed?: number;
  extensionDurationMonths?: number;
  requiresScientificReview: boolean;
  requiresEthicsReview: boolean;
  financeEnabled?: boolean;
  contractEnabled?: boolean;
  ethicsReviewMode?: 'SEPARATE' | 'INTEGRATED';
  acceptanceMode?: 'INTERNAL' | 'EXTERNAL';
  councilPolicy?: {
    minMembers?: number;
    maxMembers?: number;
    requiredRoles?: CouncilRole[];
    requiredReviewerCount?: number;
    minSignedEvaluationsBeforeMinutes?: number;
    minPassRatio?: number;
  };
  decisionPolicy?: {
    allowReturnForRevision?: boolean;
  };
  closingPolicy?: {
    requiredItems?: string[];
  };
  requiredDocumentsByStep: Record<number, { type: DocumentType; label: string; required: boolean }[]>;
  customProjectTypes?: { code: string; label: string }[];
  customFundingSources?: { code: string; label: string }[];
}

export type ProposalContent = {
  projectId: string;
  schemaVersion: string;
  data: Record<string, unknown>;
};

// ==========================================
// THỰC THỂ TRUNG TÂM: RESEARCH PROJECT
// ==========================================

export type ResearchProject = {
  id: string;
  workflowPolicyId: string;
  workflowPolicyVersionId?: string;
  projectCategory: string; // Master data/configuration theo từng bệnh viện
  acceptanceAuthority: 'BENH_VIEN' | 'CO_SO_DAO_TAO';
  scientificReviewStatus: 'REQUIRED' | 'OPTIONAL' | 'SKIPPED';
  scientificReviewSkipReason?: string;
  scientificReviewApprovalDocId?: string;
  projectCode?: string;       // DT-2026-001 (sau khi được duyệt)
  proposalCode: string;       // DX-2026-001 (từ lúc tạo đề xuất)
  title: string;
  summary: string;
  researchField: string;
  managementLevel: 'CẤP_CƠ_SỞ' | 'CẤP_TỈNH' | 'CẤP_BỘ' | 'CẤP_QUỐC_GIA';
  projectType: ProjectType;
  principalInvestigatorId: string;
  principalInvestigatorName: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  durationMonths?: number;
  estimatedBudget: number;
  approvedBudget: number;
  fundingSource: FundingSource;
  reportedProgressPercentage?: number;

  proposalContent?: ProposalContent; // Cấu trúc động ưu tiên cho triển khai đa bệnh viện

  // Legacy fields của Phiếu đề xuất hiện tại - giữ tương thích, không nên mở rộng thêm
  urgencyExplanation?: string; // 1. Giải trình về tính cấp thiết của đề tài
  expectedObjectives?: string; // 2. Mục tiêu dự kiến
  researchDesign?: string; // 3.1. Thiết kế nghiên cứu
  researchSubjects?: string; // 3.2. Đối tượng nghiên cứu
  researchLocation?: string; // 3.3. Địa điểm nghiên cứu
  selectionCriteria?: string; // 3.4. Tiêu chuẩn lựa chọn
  exclusionCriteria?: string; // 3.5. Tiêu chuẩn loại trừ
  recruitmentAndSampleCollection?: string; // 4. Quá trình tuyển chọn, điều trị, nghiên cứu và thu thập mẫu
  researchVariables?: string; // 5. Các biến số nghiên cứu
  sampleSizeEstimation?: string; // 6. Ước tính cỡ mẫu
  studyTimeEstimation?: string; // 7. Ước tính thời gian nghiên cứu
  expectedProducts?: string; // 8. Dự kiến sản phẩm
  hospitalApplication?: string; // 9. Khả năng ứng dụng vào khoa phòng/bệnh viện
  otherInfo?: string; // 10. Thông tin khác (nếu có)

  // Các state machine nghiệp vụ tách biệt
  status: ProjectStatus;                          // SM-1: Vòng đời cốt lõi
  proposalStatus: ProposalStatus;                 // SM-2: Trạng thái hồ sơ đề xuất
  ethicsRequired: boolean;
  ethicsStatus: EthicsStatus;                     // SM-3: Trạng thái đạo đức y sinh
  // SM-4 (CouncilStatus) thuộc entity Council, không trên Project
  // SM-5 (ProgressReportStatus) thuộc entity ProgressReport
  // SM-6 (ChangeRequestStatus) thuộc entity ChangeRequest
  // SM-7 (AcceptanceDossierStatus) thuộc entity AcceptanceDossier
  // SM-8 (DecisionStatus) thuộc entity Decision
  financeStatus?: FinanceStatus;                  // Tuỳ chọn khi policy bật mô-đun tài chính

  registrationRoundId: string;
  registrationRoundName: string;

  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  completedAt?: string;

  // Quan hệ
  members: ResearchMember[];
  documents: ProjectDocument[];
  submissionVersions?: SubmissionVersion[];   // Lịch sử toàn bộ hồ sơ nộp
  milestones: ProjectMilestone[];
  progressReports: ProgressReport[];
  changeRequests: ChangeRequest[];
  ethicsApproval?: EthicsApproval;
  acceptanceDossier?: AcceptanceDossier;
  financialSummary?: FinancialSummary;
  decisions: Decision[];
  contract?: ResearchContract;               // Tuỳ chọn
  closure?: ProjectClosure;
  statusHistory: ProjectStatusHistory[];
  auditLogs?: AuditLog[];
};