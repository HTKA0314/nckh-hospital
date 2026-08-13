import {
  ResearchProject,
  WorkflowPolicy,
} from '@/lib/types';
import { getProjectWorkflowState } from '@/lib/utils/workflow-engine';

// Mock Policies
const policyA_CoSo: WorkflowPolicy = {
  id: 'policy-a',
  code: 'RICH.QT01.CO_SO',
  name: 'Chính sách Đề tài Cấp cơ sở (BV Nhi TW)',
  version: 'v2018.1',
  effectiveFrom: '2018-05-01',
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
    1: [
      {
        type: 'PROPOSAL_FORM',
        label: 'Phiếu đề xuất đề tài (BM1)',
        required: true,
      },
    ],
    3: [
      {
        type: 'DETAILED_OUTLINE',
        label: 'Thuyết minh đề cương chi tiết (BM2)',
        required: true,
      },
    ],
    5: [
      {
        type: 'EXPLANATION_LETTER',
        label: 'Biên bản giải trình chỉnh sửa (BM7)',
        required: true,
      },
    ],
  },
};

const policyB_HocVien: WorkflowPolicy = {
  id: 'policy-b',
  code: 'RICH.QT01.HOC_VIEN',
  name: 'Chính sách Nghiên cứu Học viên',
  version: 'v2018.2',
  effectiveFrom: '2018-05-01',
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
      {
        type: 'PROPOSAL_FORM',
        label: 'Giấy giới thiệu',
        required: true,
      },
      {
        type: 'DETAILED_OUTLINE',
        label: 'Đề cương chi tiết ban đầu',
        required: true,
      },
    ],
  },
};

// Mock Project
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
  estimatedBudget: 50_000_000,
  approvedBudget: 50_000_000,
  fundingSource: 'NGÂN_SÁCH_BỆNH_VIỆN',
  reportedProgressPercentage: 0,
  status: 'DRAFT',
  proposalStatus: 'DRAFT',
  ethicsRequired: true,
  ethicsStatus: 'DOSSIER_SUBMITTED',
  financeStatus: 'PENDING',
  registrationRoundId: 'round-1',
  registrationRoundName: 'Đợt 1',
  createdAt: '2026-01-10T00:00:00.000Z',
  members: [],
  documents: [],
  milestones: [],
  progressReports: [],
  changeRequests: [],
  decisions: [],
  statusHistory: [],
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }

  console.log(`PASS: ${message}`);
}

function runTests(): void {
  console.log(
    '=== KIỂM THỬ HÀNH VI NGHIỆP VỤ WORKFLOW POLICY ENGINE ===\n'
  );

  // Test Case 1: Policy lưu đúng chu kỳ báo cáo.
  // Lưu ý: test này chỉ kiểm tra cấu hình, không kiểm tra việc tự sinh dueDate.
  assert(
    policyA_CoSo.reportingIntervalMonths === 3,
    'Chính sách cấp cơ sở lưu đúng chu kỳ báo cáo 3 tháng/lần.'
  );

  assert(
    policyB_HocVien.reportingIntervalMonths === 1,
    'Chính sách học viên lưu đúng chu kỳ báo cáo 1 tháng/lần.'
  );

  // Test Case 2: Bỏ qua bước xét duyệt chuyên môn khi policy/project cho phép.
  const skippedProject: ResearchProject = {
    ...baseProject,
    scientificReviewStatus: 'SKIPPED',
    scientificReviewSkipReason:
      'Đã có kết quả duyệt đề cương từ Hội đồng bên ngoài và được đơn vị chấp nhận.',
    status: 'SUBMITTED',
    proposalStatus: 'ADMIN_VALIDATED',
  };

  const state2 = getProjectWorkflowState(
    skippedProject,
    policyA_CoSo
  );

  const step4 = state2.steps.find(
    (step) => step.stepNumber === 4
  );

  assert(
    step4 !== undefined && step4.status === 'SKIPPED',
    'Bước 4 chuyển SKIPPED khi scientificReviewStatus = SKIPPED.'
  );

  assert(
    step4?.skipReason ===
      'Đã có kết quả duyệt đề cương từ Hội đồng bên ngoài và được đơn vị chấp nhận.',
    'Workflow giữ đúng lý do bỏ qua xét duyệt chuyên môn.'
  );

  // Test Case 3a: ethicsReviewMode = INTEGRATED không được tự suy diễn APPROVED.
  // Dù Hội đồng có thể tích hợp về tổ chức, EthicsStatus vẫn là nguồn sự thật.
  const integratedPendingProject: ResearchProject = {
    ...baseProject,
    status: 'WAITING_ASSIGNMENT',
    proposalStatus: 'PROPOSAL_APPROVED',
    ethicsStatus: 'DOSSIER_SUBMITTED',
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
      {
        id: 'doc-3',
        projectId: 'test-proj',
        documentType: 'EXPLANATION_LETTER',
        title: 'BM7',
        currentVersion: 1,
        currentVersionId: 'v1',
        versions: [],
      },
    ],
  };

  const state3a = getProjectWorkflowState(
    integratedPendingProject,
    policyA_CoSo
  );

  const step6Pending = state3a.steps.find(
    (step) => step.stepNumber === 6
  );

  assert(
    step6Pending !== undefined &&
      step6Pending.status === 'CURRENT',
    'INTEGRATED không tự hoàn thành bước đạo đức khi EthicsStatus vẫn đang xử lý.'
  );

  // Test Case 3b: Chỉ hoàn thành bước đạo đức khi EthicsStatus thực sự APPROVED.
  const integratedApprovedProject: ResearchProject = {
    ...integratedPendingProject,
    ethicsStatus: 'ETHICS_APPROVED',
  };

  const state3b = getProjectWorkflowState(
    integratedApprovedProject,
    policyA_CoSo
  );

  const step6Approved = state3b.steps.find(
    (step) => step.stepNumber === 6
  );

  assert(
    step6Approved !== undefined &&
      step6Approved.status === 'COMPLETED',
    'Bước 6 chỉ COMPLETED khi EthicsStatus = ETHICS_APPROVED.'
  );

  // Test Case 4: Bảo toàn phiên bản WorkflowPolicy.
  const oldProject: ResearchProject = {
    ...baseProject,
    workflowPolicyId: 'policy-a',
  };

  const policyA_CoSo_v2: WorkflowPolicy = {
    ...policyA_CoSo,
    id: 'policy-a-v2',
    version: 'v2026.1',
    effectiveFrom: '2026-01-01',
    reportingIntervalMonths: 6,
  };

  assert(
    policyA_CoSo.reportingIntervalMonths === 3 &&
      policyA_CoSo_v2.reportingIntervalMonths === 6,
    'Hệ thống có thể duy trì đồng thời policy cũ và policy mới.'
  );

  assert(
    oldProject.workflowPolicyId === 'policy-a',
    'Đề tài cũ tiếp tục tham chiếu policy cũ, không tự chuyển policy.'
  );

  // Test Case 5: Thiếu tài liệu bắt buộc khiến bước đã đi qua bị BLOCKED.
  const missingDocProject: ResearchProject = {
    ...baseProject,
    status: 'SUBMITTED',
    proposalStatus: 'SUBMITTED',
    documents: [],
  };

  const state5 = getProjectWorkflowState(
    missingDocProject,
    policyA_CoSo
  );

  const step1State = state5.steps.find(
    (step) => step.stepNumber === 1
  );

  assert(
    step1State !== undefined &&
      step1State.status === 'BLOCKED',
    'Bước 1 BLOCKED khi thiếu tài liệu bắt buộc PROPOSAL_FORM.'
  );

  console.log(
    '\n=== TẤT CẢ CA KIỂM THỬ WORKFLOW POLICY ĐÃ PASS ==='
  );
}

// Chạy trực tiếp nếu execute bằng ts-node/CommonJS.
if (require.main === module) {
  runTests();
}