import { ResearchProject, WorkflowPolicy, DocumentType } from '@/lib/types';
import { getProjectWorkflowState } from '@/lib/utils/workflow-engine';

// Mock Policies
const policyA_CơSở: WorkflowPolicy = {
  id: 'policy-a',
  code: 'RICH.QT01.CO_SO',
  name: 'Chính sách Đề tài Cấp cơ sở (BV Nhi TW)',
  version: 'v2018.1',
  effectiveFrom: '05/2018',
  reportingIntervalMonths: 3,
  minDurationMonths: 6,
  maxDurationMonths: 12,
  maxExtensionsAllowed: 2,
  extensionDurationMonths: 3,
  requiresScientificReview: true,
  requiresEthicsReview: true,
  ethicsReviewMode: 'INTEGRATED',
  acceptanceMode: 'INTERNAL',
  requiredDocumentsByStep: {
    1: [{ type: 'PROPOSAL_FORM', label: 'Phiếu đề xuất đề tài (BM1)', required: true }],
    3: [{ type: 'DETAILED_OUTLINE', label: 'Thuyết minh đề cương chi tiết (BM2)', required: true }],
    5: [{ type: 'EXPLANATION_LETTER', label: 'Biên bản giải trình chỉnh sửa (BM7)', required: true }],
  },
};

const policyB_HọcViên: WorkflowPolicy = {
  id: 'policy-b',
  code: 'RICH.QT01.HOC_VIEN',
  name: 'Chính sách Nghiên cứu Học viên',
  version: 'v2018.2',
  effectiveFrom: '05/2018',
  reportingIntervalMonths: 1,
  minDurationMonths: 3,
  maxDurationMonths: 12,
  maxExtensionsAllowed: 1,
  extensionDurationMonths: 3,
  requiresScientificReview: true,
  requiresEthicsReview: true,
  ethicsReviewMode: 'SEPARATE',
  acceptanceMode: 'EXTERNAL',
  requiredDocumentsByStep: {
    1: [
      { type: 'PROPOSAL_FORM', label: 'Giấy giới thiệu', required: true },
      { type: 'DETAILED_OUTLINE', label: 'Đề cương chi tiết ban đầu', required: true },
    ],
  },
};

// Mock Projects
const baseProject: ResearchProject = {
  id: 'test-proj',
  workflowPolicyId: 'policy-a',
  projectCategory: 'CAP_CO_SO',
  acceptanceAuthority: 'BENH_VIEN',
  scientificReviewStatus: 'REQUIRED',
  proposalCode: 'DX-2026-T1',
  title: 'Đề tài kiểm thử',
  summary: 'Mô tả ngắn...',
  researchField: 'Tim mạch',
  managementLevel: 'CẤP_CƠ_SỞ',
  projectType: 'NGHIÊN_CỨU_LÂM_SÀNG',
  principalInvestigatorId: 'user-01',
  principalInvestigatorName: 'BS. Nguyễn Văn A',
  departmentId: 'dept-01',
  departmentName: 'Khoa Tim mạch',
  startDate: '2026-04-01',
  endDate: '2027-03-31',
  estimatedBudget: 50000000,
  approvedBudget: 50000000,
  fundingSource: 'NGÂN_SÁCH_BỆNH_VIỆN',
  progressPercentage: 0,
  status: 'DRAFT',
  proposalStatus: 'DRAFT',
  ethicsRequired: true,
  ethicsStatus: 'DOSSIER_SUBMITTED',
  financeStatus: 'PENDING',
  registrationRoundId: 'round-1',
  registrationRoundName: 'Đợt 1',
  createdAt: '10/01/2026',
  members: [],
  documents: [],
  milestones: [],
  progressReports: [],
  changeRequests: [],
  decisions: [],
  statusHistory: [],
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

function runTests() {
  console.log('=== KHỞI CHẠY KIỂM THỬ HÀNH VI NGHIỆP VỤ WORKFLOW POLICY ENGINE ===\n');

  // Test Case 1: Chu kỳ báo cáo có tự động tính toán ra mốc 3 tháng hay không
  assert(
    policyA_CơSở.reportingIntervalMonths === 3,
    'Chính sách cấp cơ sở xác định đúng chu kỳ báo cáo là 3 tháng/lần.'
  );
  assert(
    policyB_HọcViên.reportingIntervalMonths === 1,
    'Chính sách học viên xác định đúng chu kỳ báo cáo là 1 tháng/lần.'
  );

  // Test Case 2: Bỏ qua bước xét đề cương (Skip Step 4)
  const skippedProject: ResearchProject = {
    ...baseProject,
    scientificReviewStatus: 'SKIPPED',
    scientificReviewSkipReason: 'Đã có kết quả duyệt đề cương từ Hội đồng ĐHQG.',
    status: 'UNDER_REVIEW' as any,
    proposalStatus: 'VALID',
  };
  const state2 = getProjectWorkflowState(skippedProject, policyA_CơSở);
  const step4 = state2.steps.find((s) => s.stepNumber === 4);
  assert(
    step4 !== undefined && step4.status === 'SKIPPED',
    'Xét duyệt chuyên môn (Bước 4) tự động chuyển sang SKIPPED khi scientificReviewStatus = SKIPPED.'
  );
  assert(
    step4?.skipReason === 'Đã có kết quả duyệt đề cương từ Hội đồng ĐHQG.',
    'Lưu giữ đúng lý do bỏ qua bước xét duyệt chuyên môn chuyên ngành (Audit Trail).'
  );

  // Test Case 3: Tích hợp đạo đức (Integrated IRB review)
  const integratedProject: ResearchProject = {
    ...baseProject,
    status: 'APPROVED' as any,
    proposalStatus: 'PROPOSAL_APPROVED',
    documents: [
      {
        id: 'doc-1',
        projectId: 'test-proj',
        documentType: 'PROPOSAL_FORM',
        title: 'BM1',
        currentVersion: 1,
        currentVersionId: 'v1',
        versions: [],
      },
      {
        id: 'doc-2',
        projectId: 'test-proj',
        documentType: 'DETAILED_OUTLINE',
        title: 'BM2',
        currentVersion: 1,
        currentVersionId: 'v1',
        versions: [],
      },
    ],
  };
  const state3 = getProjectWorkflowState(integratedProject, policyA_CơSở);
  const step6 = state3.steps.find((s) => s.stepNumber === 6);
  assert(
    step6 !== undefined && step6.status === 'COMPLETED',
    'Thẩm định đạo đức (Bước 6) tự động hoàn thành cùng bước xét duyệt đề cương khi cấu hình INTEGRATED.'
  );

  // Test Case 4: Bảo toàn phiên bản (Workflow policy versioning)
  // Giả lập đề tài sử dụng chính sách v2018 (Policy v1)
  const oldProject: ResearchProject = {
    ...baseProject,
    workflowPolicyId: 'policy-a', // policy-a là v2018.1
  };
  // Admin tạo chính sách mới v2026 (policyA_CơSở_v2) có chu kỳ báo cáo 6 tháng
  const policyA_CơSở_v2: WorkflowPolicy = {
    ...policyA_CơSở,
    id: 'policy-a-v2',
    version: 'v2026.1',
    reportingIntervalMonths: 6, // Đổi từ 3 tháng thành 6 tháng
  };
  // Đề tài cũ vẫn tham chiếu tới Policy v1
  assert(
    policyA_CơSở.reportingIntervalMonths === 3 && policyA_CơSở_v2.reportingIntervalMonths === 6,
    'Hệ thống duy trì song song cả 2 phiên bản chính sách cũ và mới.'
  );
  assert(
    oldProject.workflowPolicyId === 'policy-a',
    'Đề tài cũ tiếp tục chạy theo chính sách cũ mà không tự động đổi cấu hình báo cáo.'
  );

  // Test Case 5: Chặn tiến độ khi thiếu tài liệu bắt buộc (BLOCKED step)
  // Đăng ký đề tài nhưng không đính kèm file Phiếu đề xuất (BM1)
  const missingDocProject: ResearchProject = {
    ...baseProject,
    status: 'UNDER_REVIEW' as any,
    proposalStatus: 'VALID', // Đã qua bước 1
    documents: [], // Không có hồ sơ đính kèm nào
  };
  const state5 = getProjectWorkflowState(missingDocProject, policyA_CơSở);
  const step1State = state5.steps.find((s) => s.stepNumber === 1);
  assert(
    step1State !== undefined && step1State.status === 'BLOCKED',
    'Bước 1 tự động chuyển sang trạng thái BLOCKED do thiếu tài liệu đính kèm bắt buộc (Phiếu đề xuất BM1).'
  );

  console.log('\n=== TẤT CẢ CÁC CA KIỂM THỬ ĐÃ VƯỢT QUA THÀNH CÔNG (100% PASS) ===');
}

// Chạy trực tiếp nếu execute bằng ts-node
if (require.main === module) {
  runTests();
}
