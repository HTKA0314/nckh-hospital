// ==========================================
// HỆ THỐNG QUẢN LÝ NCKH BỆNH VIỆN - DATA TYPES
// ==========================================

export type Role =
  | 'RESEARCHER'
  | 'RESEARCH_OFFICE'
  | 'COUNCIL_MEMBER'
  | 'COUNCIL_SECRETARY'
  | 'ETHICS_OFFICE'
  | 'FINANCE_OFFICER'
  | 'DIRECTOR'
  | 'ADMIN';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId: string;
  phone: string;
  academicTitle: string; // GS, PGS, TS, ThS, BS.CKII, BS.CKI, BS, CN, v.v.
  degree: string;
  avatarUrl?: string;
};

export type Department = {
  id: string;
  code: string;
  name: string;
  type: 'CLINICAL' | 'SUB_CLINICAL' | 'ADMINISTRATIVE'; // Lâm sàng, Cận lâm sàng, Phòng chức năng
};

export type RegistrationRoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export type RegistrationRound = {
  id: string;
  code: string;
  name: string;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetAudience: string;
  status: RegistrationRoundStatus;
  description: string;
  maxBudget?: number;
  totalSubmissions?: number;
};

// ==========================================
// 8 STATE MACHINES ĐỘC LẬP THEO THIẾT KẾ
// ==========================================

// 1. Vòng đời đề tài cốt lõi
export type ProjectStatus =
  | 'DRAFT'
  | 'PROPOSAL_APPROVED'
  | 'IN_PROGRESS'
  | 'ACCEPTED'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'REJECTED'
  | 'TERMINATED'
  | 'SUSPENDED';

// 2. Trạng thái hồ sơ đăng ký đề xuất
export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_ADMIN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'RESUBMITTED'
  | 'VALID'
  | 'REJECTED';

// 3. Trạng thái Hội đồng
export type CouncilStatus =
  | 'DRAFT'
  | 'ESTABLISHED'
  | 'EVALUATING'
  | 'MINUTES_DRAFTED'
  | 'CONCLUDED'
  | 'DISSOLVED';

// 4. Trạng thái hồ sơ Đạo đức y sinh
export type EthicsStatus =
  | 'NOT_REQUIRED'
  | 'DOSSIER_SUBMITTED'
  | 'UNDER_ETHICS_REVIEW'
  | 'ETHICS_REVISION_REQUIRED'
  | 'ETHICS_APPROVED'
  | 'ETHICS_EXPIRED'
  | 'ETHICS_REJECTED';

// 5. Trạng thái Báo cáo tiến độ
export type ProgressReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REVISION_REQUIRED';

// 6. Trạng thái Yêu cầu điều chỉnh
export type ChangeRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

// 7. Trạng thái Hồ sơ nghiệm thu
export type AcceptanceDossierStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_ADMIN_REVIEW'
  | 'QUALIFIED_FOR_COUNCIL'
  | 'REVISION_REQUIRED';

// 8. Trạng thái Tài chính & Quyết toán
export type FinancialStatus =
  | 'NOT_SETTLED'
  | 'SETTLEMENT_SUBMITTED'
  | 'SETTLING'
  | 'SETTLED'
  | 'FUNDS_RECOVERED'
  | 'FINANCIAL_COMPLETED';

// ==========================================
// CÁC ENTITIES CHI TIẾT
// ==========================================

export type ResearchMember = {
  id: string;
  projectId: string;
  fullName: string;
  academicRank: string;
  unit: string;
  roleInProject: 'CHỦ_NHIỆM' | 'THƯ_KÝ_KH' | 'THÀNH_VIÊN_CHÍNH' | 'KỸ_THUẬT_VIÊN' | 'CỘNG_TÁC_VIÊN';
  contributionPercentage: number;
};

export type DocumentType =
  | 'PROPOSAL_FORM'
  | 'DETAILED_OUTLINE'
  | 'SCIENTIFIC_CV'
  | 'BUDGET_ESTIMATE'
  | 'ETHICS_DOSSIER'
  | 'PROGRESS_REPORT_DOC'
  | 'ACCEPTANCE_DOSSIER'
  | 'MEETING_MINUTES'
  | 'DECISION_DOC'
  | 'EXPLANATION_LETTER'
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
  versions: DocumentVersion[];
};

export type ProjectStatusHistory = {
  id: string;
  projectId: string;
  fromStatus: string;
  toStatus: string;
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
  targetDate: string; // DD/MM/YYYY
  actualDate?: string;
  weightPercentage: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  deliverables: string;
};

export type ProgressReport = {
  id: string;
  projectId: string;
  period: string; // Ví dụ: Báo cáo định kỳ 6 tháng (Kỳ 1)
  reportingDate: string;
  workCompleted: string;
  resultsAchieved: string;
  completedPercentage: number;
  difficulties?: string;
  nextPlan: string;
  evidenceUrls: { name: string; url: string }[];
  status: ProgressReportStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type ChangeRequestType =
  | 'EXTENSION'
  | 'CHANGE_PI'
  | 'CHANGE_MEMBER'
  | 'CHANGE_CONTENT'
  | 'CHANGE_PRODUCT'
  | 'ADJUST_BUDGET'
  | 'SUSPEND'
  | 'TERMINATE';

export type ChangeRequest = {
  id: string;
  projectId: string;
  type: ChangeRequestType;
  title: string;
  currentInfo: string;
  proposedInfo: string;
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

export type EthicsReview = {
  id: string;
  projectId: string;
  screeningAnswers: {
    involvesHumanSubjects: boolean;
    involvesIdentifiableData: boolean;
    involvesBiologicalSamples: boolean;
    involvesNewInterventionsOrDrugs: boolean;
  };
  ethicsRequired: boolean;
  dossierSubmittedDate?: string;
  status: EthicsStatus;
  decisionNumber?: string;
  approvalDate?: string;
  expiryDate?: string;
  certificateDocUrl?: string;
  notes?: string;
};

export type AcceptanceDossier = {
  id: string;
  projectId: string;
  submissionDate: string;
  finalReportUrl?: string;
  productsSummary: string;
  evidenceUrls: { name: string; url: string }[];
  ethicsSummaryUrl?: string;
  financialSummaryUrl?: string;
  publications?: string;
  checklistResults?: {
    fullDossier: boolean;
    productsCompleted: boolean;
    evidenceValid: boolean;
    progressReportsCompleted: boolean;
    noPendingChangeRequests: boolean;
  };
  status: AcceptanceDossierStatus;
  notes?: string;
};

export type FinancialSummary = {
  id: string;
  projectId: string;
  fundingSource: 'NGÂN_SÁCH_BỆNH_VIỆN' | 'TỰ_TÚC' | 'TÀI_TRỢ_NGOÀI' | 'HỖN_HỢP';
  estimatedBudget: number; // VND
  approvedBudget: number; // VND
  allocatedBudget: number; // Đã cấp / Đã tạm ứng
  disbursedBudget: number; // Đã thực chi
  settledBudget: number; // Đã quyết toán
  refundableBudget: number; // Số cần thu hồi nếu có
  status: FinancialStatus;
  contractLiquidationDate?: string;
  notes?: string;
};

export type CouncilRole = 'CHỦ_TỊCH' | 'THƯ_KÝ' | 'PHẢN_BIỆN_1' | 'PHẢN_BIỆN_2' | 'ỦY_VIÊN';

export type CouncilMember = {
  id: string;
  councilId: string;
  userId: string;
  userFullName: string;
  academicTitle: string;
  departmentName: string;
  roleInCouncil: CouncilRole;
  hasConflictOfInterest: boolean; // Có xung đột lợi ích không
  evaluationSubmitted: boolean;
};

export type EvaluationScoreItem = {
  criteriaId: string;
  criteriaName: string;
  maxScore: number;
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
  status: 'DRAFT' | 'SUBMITTED';
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
  revisionRequirements?: string;
  status: 'DRAFT' | 'CONFIRMED';
  signedDate?: string;
};

export type CouncilProjectAssignment = {
  projectId: string;
  reviewer1Id?: string;
  reviewer1Name: string;
  reviewer2Id?: string;
  reviewer2Name?: string;
  notes?: string;
};

export type Council = {
  id: string;
  code: string;
  name: string;
  type: 'PROPOSAL_REVIEW' | 'ACCEPTANCE_REVIEW';
  specialtyCluster?: string; // Khối chuyên môn (VD: Khối Nội, Khối Ngoại, Đa chuyên khoa)
  projectIds: string[];
  projectAssignments?: CouncilProjectAssignment[]; // Phân công phản biện 1 & 2 riêng cho từng đề tài
  establishmentDecisionNumber?: string;
  decisionDate?: string;
  decisionStatus?: 'DRAFT' | 'SUBMITTED' | 'ISSUED'; // Dự thảo / Trình duyệt / Đã ban hành
  signatoryName?: string; // Người ký ban hành
  signatoryRole?: string;
  meetingDate: string;
  meetingTime?: string;
  meetingFormat?: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  location: string;
  onlineMeetingUrl?: string;
  sendInvitationNotification?: boolean;
  minPassRatio: number; // Ví dụ 0.6 = 60%, 0.75 = 75%
  status: CouncilStatus;
  members: CouncilMember[];
  minutes?: MeetingMinutes[];
  scoringCriteriaSet?: { id: string; name: string; maxScore: number }[];
  evaluationResults?: EvaluationResult[];
};

export type Decision = {
  id: string;
  projectId: string;
  decisionNumber: string;
  decisionDate: string;
  type: 'ASSIGNMENT' | 'RECOGNITION'; // Giao thực hiện hoặc Công nhận kết quả
  effectiveDate: string;
  durationMonths?: number;
  approvedBudget?: number;
  signatoryName: string;
  signatoryRole: string;
  fileUrl?: string;
  status: 'DRAFT' | 'SUBMITTED_FOR_APPROVAL' | 'APPROVED';
  approvedAt?: string;
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

export type AuditLog = {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
};

// ==========================================
// THỰC THỂ TRUNG TÂM: RESEARCH PROJECT
// ==========================================

export type ResearchProject = {
  id: string;
  projectCode?: string; // DT-2026-001 (sau khi duyệt)
  proposalCode: string; // DX-2026-001 (từ lúc tạo đề xuất)
  title: string;
  summary: string;
  researchField: string; // Tim mạch, Ung bướu, Ngoại khoa, Dược lâm sàng, Điều dưỡng, v.v.
  managementLevel: 'CẤP_CƠ_SỞ' | 'CẤP_TỈNH' | 'CẤP_BỘ' | 'CẤP_QUỐC_GIA'; // Mặc định Cấp cơ sở
  projectType: 'NGHIÊN_CỨU_LÂM_SÀNG' | 'CAN_THIỆP_CỘNG_ĐỒNG' | 'DỊCH_TỄ_HỌC' | 'QUẢN_LÝ_Y_TẾ' | 'CẢI_TIẾN_KỸ_THUẬT';
  principalInvestigatorId: string;
  principalInvestigatorName: string;
  departmentId: string;
  departmentName: string;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  estimatedBudget: number; // VND
  approvedBudget: number; // VND
  fundingSource: 'NGÂN_SÁCH_BỆNH_VIỆN' | 'TỰ_TÚC' | 'TÀI_TRỢ_NGOÀI' | 'HỖN_HỢP';
  progressPercentage: number; // 0 -> 100%

  // Các trạng thái quy trình con độc lập
  status: ProjectStatus; // Trạng thái cốt lõi của đề tài
  proposalStatus: ProposalStatus; // Trạng thái hồ sơ đề xuất ban đầu
  ethicsRequired: boolean;
  ethicsStatus: EthicsStatus;

  registrationRoundId: string;
  registrationRoundName: string;

  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  completedAt?: string;

  // Dữ liệu quan hệ
  members: ResearchMember[];
  documents: ProjectDocument[];
  milestones: ProjectMilestone[];
  progressReports: ProgressReport[];
  changeRequests: ChangeRequest[];
  ethicsReview?: EthicsReview;
  acceptanceDossier?: AcceptanceDossier;
  financialSummary?: FinancialSummary;
  decisions: Decision[];
  statusHistory: ProjectStatusHistory[];
};
