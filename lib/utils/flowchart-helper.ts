import {
  AcceptanceDossierStatus,
  EthicsStatus,
  ProjectStatus,
  ProposalStatus,
} from '@/lib/types';

export interface FlowchartStepInfo {
  stepNumber: number;
  stepTitle: string;
  responsibleRoles: string;
  researcherTasks: string[];
  officeTasks: string[];
  templates: { code: string; name: string }[];
}

/**
 * Bối cảnh bổ sung để ánh xạ chính xác hơn các bước workflow.
 *
 * ProjectStatus là macro-state nên riêng nó không đủ phân biệt:
 * - WAITING_ASSIGNMENT đang chờ Ethics hay đang chờ Decision;
 * - WAITING_ACCEPTANCE đang kiểm tra dossier hay đã chuyển Hội đồng;
 * - ACCEPTED có đang phải hoàn thiện sau nghiệm thu hay đang chờ QĐ công nhận.
 */
export interface FlowchartContext {
  proposalStatus?: ProposalStatus;
  ethicsRequired?: boolean;
  ethicsStatus?: EthicsStatus;
  acceptanceDossierStatus?: AcceptanceDossierStatus;
  hasPendingPostAcceptanceRevision?: boolean;
}

/**
 * Backward-compatible:
 * - Có thể gọi mới: getFlowchartStepInfo(project.status, { ...context })
 * - Vẫn hỗ trợ kiểu cũ:
 *   getFlowchartStepInfo(project.status, proposalStatus, ethicsRequired)
 */
export function getFlowchartStepInfo(
  stepOrStatus: number | ProjectStatus,
  contextOrProposalStatus?: FlowchartContext | ProposalStatus,
  legacyEthicsRequired?: boolean
): FlowchartStepInfo {
  if (typeof stepOrStatus === 'number') {
    return getStepInfo(normalizeStep(stepOrStatus));
  }

  const context: FlowchartContext =
    typeof contextOrProposalStatus === 'object'
      ? contextOrProposalStatus
      : {
          proposalStatus: contextOrProposalStatus,
          ethicsRequired: legacyEthicsRequired,
        };

  return getStepInfo(resolveWorkflowStep(stepOrStatus, context));
}

function resolveWorkflowStep(
  projectStatus: ProjectStatus,
  context: FlowchartContext
): number {
  const {
    proposalStatus,
    ethicsRequired = false,
    ethicsStatus,
    acceptanceDossierStatus,
    hasPendingPostAcceptanceRevision = false,
  } = context;

  /*
   * Ưu tiên ProposalStatus trong giai đoạn tiền thực hiện.
   * Không dùng lại các legacy state:
   * UNDER_REVIEW, APPROVED, ASSIGNED, VALID.
   */
  if (
    proposalStatus === 'SUBMITTED' ||
    proposalStatus === 'UNDER_ADMIN_REVIEW' ||
    proposalStatus === 'REVISION_REQUIRED' ||
    proposalStatus === 'RESUBMITTED'
  ) {
    return 2;
  }

  if (proposalStatus === 'ADMIN_VALIDATED') {
    return 3;
  }

  if (
    proposalStatus === 'OUTLINE_SUBMITTED' ||
    proposalStatus === 'UNDER_PROPOSAL_REVIEW'
  ) {
    return 4;
  }

  if (
    proposalStatus === 'PROPOSAL_REVISION_REQUIRED' ||
    proposalStatus === 'PROPOSAL_RESUBMITTED' ||
    proposalStatus === 'UNDER_PROPOSAL_REVISION_REVIEW'
  ) {
    return 5;
  }

  if (
    projectStatus === 'APPROVED_PENDING_CONTRACT' ||
    proposalStatus === 'PROPOSAL_APPROVED'
  ) {
    const ethicsGateCompleted =
      !ethicsRequired ||
      ethicsStatus === 'NOT_REQUIRED' ||
      ethicsStatus === 'ETHICS_APPROVED';

    return ethicsGateCompleted ? 7 : 6;
  }

  switch (projectStatus) {
    case 'DRAFT':
      return 1;

    case 'SUBMITTED':
      /*
       * Nếu thiếu ProposalStatus cụ thể, SUBMITTED vẫn thuộc vùng
       * tiếp nhận/thẩm định hồ sơ đăng ký.
       */
      return 2;

    case 'IN_PROGRESS':
    case 'EXTENSION_REQUESTED':
      /*
       * ProjectStatus hiện không có macro-state riêng cho "triển khai"
       * và "theo dõi tiến độ". Với một đề tài đã IN_PROGRESS,
       * workspace vận hành chính là bước 9.
       */
      return 9;

    case 'CLOSING_SUBMITTED':
      return acceptanceDossierStatus === 'FORWARDED_TO_COUNCIL'
        ? 11
        : 10;

    case 'COMPLETED':
      return hasPendingPostAcceptanceRevision ? 12 : 13;

    case 'COMPLETED':
      return 13;

    case 'COMPLETED':
    case 'COMPLETED':
      return 14;

    case 'TERMINATED':
      // Chấm dứt là kết quả của giai đoạn triển khai/điều chỉnh.
      return 9;

    case 'SCREENING_FAILED':
      /*
       * Không đủ dữ liệu để xác định bị từ chối ở kiểm tra hành chính
       * hay Hội đồng. Nếu ProposalStatus đã REJECTED, coi đây là
       * kết thúc giai đoạn xét duyệt chuyên môn.
       */
      return proposalStatus === 'SCREENING_FAILED' ? 4 : 2;

    default:
      return 1;
  }
}

function normalizeStep(step: number): number {
  if (step < 1) return 1;
  if (step > 14) return 14;
  return step;
}

function getStepInfo(stepNumber: number): FlowchartStepInfo {
  switch (stepNumber) {
    case 1:
      return {
        stepNumber: 1,
        stepTitle: 'Khởi tạo hồ sơ đăng ký',
        responsibleRoles: 'Chủ nhiệm đề tài',
        researcherTasks: [
          'Tạo bản nháp hồ sơ đăng ký/đề xuất đề tài.',
          'Khai báo thông tin tổng quan, nhân sự, thời gian và kinh phí đề xuất.',
          'Đính kèm các tài liệu bắt buộc theo WorkflowPolicy áp dụng.',
        ],
        officeTasks: [
          'Công bố đợt đăng ký, chính sách áp dụng và biểu mẫu.',
          'Hướng dẫn Chủ nhiệm hoàn thiện hồ sơ trước khi nộp.',
        ],
        templates: [
          { code: 'BM1/NCKH', name: 'Phiếu đăng ký/đề xuất đề tài' },
        ],
      };

    case 2:
      return {
        stepNumber: 2,
        stepTitle: 'Tiếp nhận & kiểm tra hành chính hồ sơ',
        responsibleRoles: 'Phòng Quản lý NCKH',
        researcherTasks: [
          'Theo dõi kết quả kiểm tra hành chính.',
          'Bổ sung và nộp lại hồ sơ khi nhận trạng thái REVISION_REQUIRED.',
        ],
        officeTasks: [
          'Tiếp nhận hồ sơ SUBMITTED/RESUBMITTED và chuyển UNDER_ADMIN_REVIEW.',
          'Kiểm tra thành phần hồ sơ, điều kiện đăng ký và thông tin bắt buộc.',
          'Kết luận ADMIN_VALIDATED, REVISION_REQUIRED hoặc REJECTED.',
        ],
        templates: [],
      };

    case 3:
      return {
        stepNumber: 3,
        stepTitle: 'Nộp & hoàn thiện đề cương chi tiết',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Hoàn thiện thuyết minh đề cương chi tiết sau khi hồ sơ đăng ký được ADMIN_VALIDATED.',
          'Nộp đề cương và các tài liệu kỹ thuật theo policy.',
        ],
        officeTasks: [
          'Tiếp nhận đề cương OUTLINE_SUBMITTED.',
          'Chuẩn bị hồ sơ đủ điều kiện để bố trí Hội đồng xét duyệt chuyên môn.',
        ],
        templates: [
          { code: 'BM2/NCKH', name: 'Thuyết minh đề cương nghiên cứu chi tiết' },
        ],
      };

    case 4:
      return {
        stepNumber: 4,
        stepTitle: 'Hội đồng xét duyệt đề cương',
        responsibleRoles:
          'Hội đồng KH&CN, Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Trình bày đề cương và giải trình các nội dung chuyên môn trước Hội đồng.',
          'Tiếp nhận kết luận và yêu cầu chỉnh sửa của Hội đồng.',
        ],
        officeTasks: [
          'Quản lý việc thành lập Hội đồng và phiên họp xét duyệt.',
          'Theo dõi phiếu đánh giá, biên bản và việc ký xác nhận theo CouncilRole.',
        ],
        templates: [
          { code: 'BM6/NCKH', name: 'Biên bản Hội đồng xét duyệt đề cương' },
        ],
      };

    case 5:
      return {
        stepNumber: 5,
        stepTitle: 'Hoàn thiện sau xét duyệt đề cương',
        responsibleRoles:
          'Chủ nhiệm đề tài, Chủ tịch Hội đồng & Phòng Quản lý NCKH',
        researcherTasks: [
          'Chỉnh sửa đề cương theo kết luận của Hội đồng.',
          'Nộp lại hồ sơ giải trình/chỉnh sửa theo yêu cầu.',
        ],
        officeTasks: [
          'Theo dõi hồ sơ PROPOSAL_RESUBMITTED và việc rà soát nội dung chỉnh sửa.',
          'Ghi nhận kết quả xác nhận hoàn tất chỉnh sửa theo quy trình Hội đồng.',
        ],
        templates: [
          {
            code: 'BM7/NCKH',
            name: 'Biên bản/giải trình chỉnh sửa đề cương',
          },
        ],
      };

    case 6:
      return {
        stepNumber: 6,
        stepTitle: 'Thẩm định đạo đức nghiên cứu',
        responsibleRoles:
          'Chủ nhiệm đề tài & Bộ phận/Hội đồng Đạo đức nghiên cứu',
        researcherTasks: [
          'Nộp hồ sơ đạo đức khi nghiên cứu thuộc diện phải thẩm định.',
          'Bổ sung hoặc giải trình hồ sơ theo yêu cầu của bộ phận đạo đức.',
        ],
        officeTasks: [
          'Thực hiện sàng lọc, tiếp nhận và thẩm định hồ sơ đạo đức.',
          'Ghi nhận NOT_REQUIRED, ETHICS_APPROVED hoặc các trạng thái xử lý tương ứng.',
        ],
        templates: [
          {
            code: 'ETHICS',
            name: 'Hồ sơ/chứng nhận đạo đức theo policy áp dụng',
          },
        ],
      };

    case 7:
      return {
        stepNumber: 7,
        stepTitle: 'Lập, ký & ban hành Quyết định giao thực hiện',
        responsibleRoles: 'Phòng Quản lý NCKH & Giám đốc',
        researcherTasks: [
          'Theo dõi Quyết định giao thực hiện.',
          'Bắt đầu triển khai sau khi Quyết định được ban hành (ISSUED).',
        ],
        officeTasks: [
          'Phòng NCKH lập dự thảo Quyết định khi các gate chuyên môn/đạo đức đã hoàn tất.',
          'Giám đốc ký hoặc trả lại Quyết định.',
          'Phòng NCKH ban hành Quyết định; khi ISSUED, đề tài chuyển IN_PROGRESS.',
        ],
        templates: [
          {
            code: 'ASSIGNMENT_DECISION',
            name: 'Quyết định giao thực hiện đề tài',
          },
        ],
      };

    case 8:
      return {
        stepNumber: 8,
        stepTitle: 'Triển khai nghiên cứu',
        responsibleRoles: 'Chủ nhiệm đề tài & Nhóm nghiên cứu',
        researcherTasks: [
          'Triển khai các hoạt động nghiên cứu theo đề cương đã được chấp thuận.',
          'Tuân thủ các điều kiện chuyên môn, đạo đức và tài chính có liên quan.',
        ],
        officeTasks: [
          'Theo dõi việc khởi động và triển khai đề tài theo phạm vi quản lý.',
        ],
        templates: [],
      };

    case 9:
      return {
        stepNumber: 9,
        stepTitle: 'Theo dõi tiến độ / Báo cáo / Gia hạn & Điều chỉnh',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Nộp báo cáo tiến độ theo tần suất được cấu hình trong WorkflowPolicy.',
          'Tạo yêu cầu gia hạn/điều chỉnh khi phát sinh nhu cầu hợp lệ.',
        ],
        officeTasks: [
          'Tiếp nhận và đánh giá báo cáo tiến độ.',
          'Thẩm định/xử lý yêu cầu gia hạn, điều chỉnh theo thẩm quyền và policy.',
        ],
        templates: [
          { code: 'BM9/NCKH', name: 'Báo cáo tiến độ định kỳ' },
        ],
      };

    case 10:
      return {
        stepNumber: 10,
        stepTitle: 'Nộp & kiểm tra hồ sơ nghiệm thu',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Nộp hồ sơ nghiệm thu và minh chứng kết quả.',
          'Bổ sung/nộp lại hồ sơ khi nhận REVISION_REQUIRED.',
        ],
        officeTasks: [
          'Tiếp nhận hồ sơ nghiệm thu và chuyển UNDER_ADMIN_REVIEW.',
          'Kiểm tra checklist điều kiện nghiệm thu.',
          'Xác nhận ELIGIBLE_FOR_ACCEPTANCE hoặc yêu cầu bổ sung.',
          'Chuyển hồ sơ đủ điều kiện sang Hội đồng nghiệm thu.',
        ],
        templates: [
          { code: 'BM11/NCKH', name: 'Hồ sơ/Báo cáo tổng kết nghiệm thu' },
        ],
      };

    case 11:
      return {
        stepNumber: 11,
        stepTitle: 'Hội đồng đánh giá nghiệm thu',
        responsibleRoles:
          'Hội đồng Nghiệm thu, Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Báo cáo kết quả nghiên cứu trước Hội đồng nghiệm thu.',
          'Giải trình các câu hỏi và tiếp nhận kết luận của Hội đồng.',
        ],
        officeTasks: [
          'Tổ chức phiên họp Hội đồng nghiệm thu.',
          'Theo dõi EvaluationResult và MeetingMinutes.',
          'Hoàn tất chữ ký Chủ tịch/Thư ký trước khi kết luận có hiệu lực trong workflow.',
        ],
        templates: [
          { code: 'BM15/NCKH', name: 'Biên bản Hội đồng nghiệm thu' },
        ],
      };

    case 12:
      return {
        stepNumber: 12,
        stepTitle: 'Hoàn thiện sau nghiệm thu',
        responsibleRoles:
          'Chủ nhiệm đề tài, Chủ tịch Hội đồng & Phòng Quản lý NCKH',
        researcherTasks: [
          'Thực hiện các chỉnh sửa sau nghiệm thu theo kết luận Hội đồng.',
          'Nộp hồ sơ giải trình/chỉnh sửa sau nghiệm thu.',
        ],
        officeTasks: [
          'Theo dõi postAcceptanceRevisions.',
          'Ghi nhận việc hoàn tất chỉnh sửa theo xác nhận có thẩm quyền.',
        ],
        templates: [
          {
            code: 'BM16/NCKH',
            name: 'Giải trình/chỉnh sửa sau nghiệm thu',
          },
        ],
      };

    case 13:
      return {
        stepNumber: 13,
        stepTitle: 'Lập, ký & ban hành Quyết định công nhận kết quả',
        responsibleRoles: 'Phòng Quản lý NCKH & Giám đốc',
        researcherTasks: [
          'Theo dõi và nhận Quyết định công nhận kết quả khi được ban hành.',
        ],
        officeTasks: [
          'Phòng NCKH lập dự thảo Quyết định công nhận khi đủ gate.',
          'Giám đốc ký hoặc trả lại Quyết định.',
          'Phòng NCKH ban hành; khi ISSUED, đề tài chuyển RECOGNIZED.',
        ],
        templates: [
          {
            code: 'RECOGNITION_DECISION',
            name: 'Quyết định công nhận kết quả nghiệm thu',
          },
        ],
      };

    case 14:
      return {
        stepNumber: 14,
        stepTitle: 'Nộp lưu & đóng hồ sơ',
        responsibleRoles:
          'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Hoàn tất các yêu cầu nộp lưu/tài liệu cuối kỳ theo policy của đơn vị.',
          'Hoàn tất nghĩa vụ tài chính và các thủ tục kết thúc có liên quan.',
        ],
        officeTasks: [
          'Kiểm tra điều kiện đóng hồ sơ.',
          'Chuyển đề tài sang CLOSED/ARCHIVED khi các điều kiện lưu trữ đã hoàn tất.',
        ],
        templates: [],
      };

    default:
      return getStepInfo(1);
  }
}