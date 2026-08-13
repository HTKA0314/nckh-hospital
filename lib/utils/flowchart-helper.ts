import { ProjectStatus, ProposalStatus } from '@/lib/types';

export interface FlowchartStepInfo {
  stepNumber: number;
  stepTitle: string;
  responsibleRoles: string;
  researcherTasks: string[];
  officeTasks: string[];
  templates: { code: string; name: string }[];
}



export function getFlowchartStepInfo(
  stepOrStatus: number | ProjectStatus,
  proposalStatus?: ProposalStatus,
  ethicsRequired?: boolean
): FlowchartStepInfo {
  let stepNumber = 1;

  if (typeof stepOrStatus === 'number') {
    stepNumber = stepOrStatus;
  } else {
    // Map từ ProjectStatus và ProposalStatus sang Step Number xương sống
    switch (stepOrStatus) {
      case 'DRAFT':
        stepNumber = 1;
        break;
      case 'UNDER_REVIEW' as any:
        if (proposalStatus === 'SUBMITTED' || proposalStatus === 'UNDER_ADMIN_REVIEW') {
          stepNumber = 2;
        } else if (proposalStatus === 'REVISION_REQUIRED') {
          stepNumber = 2;
        } else if (proposalStatus === 'VALID' || proposalStatus === 'RESUBMITTED') {
          stepNumber = 3;
        } else if (proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
          stepNumber = 5;
        } else {
          stepNumber = 3;
        }
        break;
      case 'APPROVED' as any:
        if (proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
          stepNumber = 5;
        } else {
          stepNumber = 4;
        }
        break;
      case 'WAITING_ASSIGNMENT':
        stepNumber = 6;
        break;
      case 'ASSIGNED' as any:
        stepNumber = 7;
        break;
      case 'IN_PROGRESS':
      case 'SUSPENDED':
        stepNumber = 9;
        break;
      case 'WAITING_ACCEPTANCE':
        stepNumber = 10;
        break;
      case 'ACCEPTED':
        stepNumber = 11;
        break;
      case 'RECOGNIZED':
        stepNumber = 13;
        break;
      case 'CLOSED':
      case 'ARCHIVED':
        stepNumber = 14;
        break;
      default:
        stepNumber = 1;
    }
  }

  // Khai báo thông tin chi tiết cho 14 bước
  switch (stepNumber) {
    case 1:
      return {
        stepNumber: 1,
        stepTitle: 'Khởi tạo & Tiếp nhận đề xuất',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Tạo bản nháp đề xuất đề tài trên hệ thống.',
          'Khai báo thông tin tổng quan nghiên cứu (nội dung Phiếu đề xuất).',
          'Tải lên các tài liệu ban đầu được yêu cầu bởi chính sách bệnh viện.'
        ],
        officeTasks: [
          'Hỗ trợ, hướng dẫn chủ nhiệm đề tài về chính sách và biểu mẫu đăng ký.',
          'Tiếp nhận bản nháp hồ sơ ban đầu trên hệ thống.'
        ],
        templates: [
          { code: 'BM1/NCKH', name: 'Mẫu Phiếu đề xuất đề tài' }
        ]
      };
    case 2:
      return {
        stepNumber: 2,
        stepTitle: 'Kiểm tra hồ sơ ban đầu',
        responsibleRoles: 'Phòng Quản lý NCKH',
        researcherTasks: [
          'Bổ sung hoặc sửa đổi hồ sơ đăng ký nếu phòng NCKH yêu cầu sửa đổi (trạng thái REVISION_REQUIRED).',
          'Theo dõi kết quả thẩm định hành chính trên hệ thống.'
        ],
        officeTasks: [
          'Rà soát tính đầy đủ, hợp lệ của hồ sơ (đối tượng nghiên cứu, giấy giới thiệu...).',
          'Đánh giá hồ sơ đạt yêu cầu hoặc gửi yêu cầu bổ sung/chỉnh sửa về cho chủ nhiệm.'
        ],
        templates: []
      };
    case 3:
      return {
        stepNumber: 3,
        stepTitle: 'Xây dựng & Hoàn thiện đề cương',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Xây dựng Thuyết minh đề cương nghiên cứu chi tiết và bản kế hoạch thực hiện.',
          'Tải lên thuyết minh đề cương hoàn chỉnh kèm hồ sơ kỹ thuật bổ sung.'
        ],
        officeTasks: [
          'Tiếp nhận thuyết minh đề cương nghiên cứu từ hệ thống.',
          'Chuẩn bị danh sách đề cương hợp lệ trình lập Hội đồng xét duyệt.'
        ],
        templates: [
          { code: 'BM2/NCKH', name: 'Mẫu Thuyết minh đề cương nghiên cứu chi tiết' }
        ]
      };
    case 4:
      return {
        stepNumber: 4,
        stepTitle: 'Xét duyệt chuyên môn',
        responsibleRoles: 'Hội đồng Khoa học Kỹ thuật & Chủ nhiệm',
        researcherTasks: [
          'Chuẩn bị slide báo cáo thuyết minh đề cương.',
          'Trình bày và giải trình trước Hội đồng xét duyệt chuyên môn bệnh viện.',
          'Tiếp nhận ý kiến góp ý, nhận xét từ các thành viên Hội đồng.'
        ],
        officeTasks: [
          'Thành lập Hội đồng Khoa học xét duyệt đề cương.',
          'Tổ chức họp Hội đồng, ghi biên bản cuộc họp và tổng hợp phiếu đánh giá.'
        ],
        templates: [
          { code: 'BM6/NCKH', name: 'Biên bản họp Hội đồng xét duyệt đề cương' }
        ]
      };
    case 5:
      return {
        stepNumber: 5,
        stepTitle: 'Hoàn thiện sau xét duyệt',
        responsibleRoles: 'Chủ nhiệm đề tài & Chủ tịch Hội đồng',
        researcherTasks: [
          'Chỉnh sửa lại đề cương chi tiết theo đúng kết luận của Hội đồng.',
          'Lập biên bản giải trình chỉnh sửa đề cương, xin xác nhận duyệt của Chủ tịch Hội đồng.'
        ],
        officeTasks: [
          'Kiểm tra tính đầy đủ của hồ sơ đề cương hoàn thiện sau chỉnh sửa.',
          'Xác nhận hoàn thành khâu xét duyệt chuyên môn.'
        ],
        templates: [
          { code: 'BM7/NCKH', name: 'Mẫu Biên bản giải trình chỉnh sửa thuyết minh đề cương' }
        ]
      };
    case 6:
      return {
        stepNumber: 6,
        stepTitle: 'Thẩm định đạo đức',
        responsibleRoles: 'Hội đồng Đạo đức trong Nghiên cứu Y sinh & Chủ nhiệm',
        researcherTasks: [
          'Nộp hồ sơ đạo đức y sinh (ICF đồng thuận người bệnh, phiếu thu thập CRF).',
          'Giải trình khía cạnh đạo đức trước Hội đồng đạo đức (nếu yêu cầu họp riêng).'
        ],
        officeTasks: [
          'Tiếp nhận hồ sơ xin phê duyệt khía cạnh đạo đức nghiên cứu.',
          'Tổ chức họp thẩm định đạo đức và cấp Giấy chứng nhận đạo đức y sinh (IRB Certificate).'
        ],
        templates: [
          { code: 'BM-IRB/NCKH', name: 'Giấy chứng nhận thông qua đạo đức y sinh' }
        ]
      };
    case 7:
      return {
        stepNumber: 7,
        stepTitle: 'Phê duyệt & Giao thực hiện',
        responsibleRoles: 'Ban Giám đốc & Phòng Quản lý NCKH',
        researcherTasks: [
          'Nhận Quyết định phê duyệt đề tài và giao mã số đề tài chính thức.',
          'Chuẩn bị ký kết hợp đồng nghiên cứu (nếu thuộc diện có kinh phí).'
        ],
        officeTasks: [
          'Trình Ban Giám đốc phê duyệt đề tài.',
          'Ban hành Quyết định giao thực hiện đề tài chính thức gửi đến các chủ nhiệm.'
        ],
        templates: [
          { code: 'BM8/NCKH', name: 'Quyết định phê duyệt và giao thực hiện đề tài' }
        ]
      };
    case 8:
      return {
        stepNumber: 8,
        stepTitle: 'Triển khai nghiên cứu',
        responsibleRoles: 'Chủ nhiệm đề tài & Nhóm nghiên cứu',
        researcherTasks: [
          'Triển khai thu thập dữ liệu lâm sàng tại các khoa/phòng bệnh viện.',
          'Đảm bảo tuân thủ đầy đủ các cam kết đạo đức y sinh trong quá trình lấy mẫu.'
        ],
        officeTasks: [
          'Hỗ trợ kết nối khoa phòng lâm sàng phục vụ thu thập số liệu.',
          'Giám sát hoạt động nghiên cứu thực tế tại hiện trường.'
        ],
        templates: []
      };
    case 9:
      return {
        stepNumber: 9,
        stepTitle: 'Theo dõi tiến độ / Báo cáo / Gia hạn',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Gửi báo cáo tiến độ định kỳ (tần suất theo chính sách, ví dụ 1/3/6 tháng).',
          'Lập hồ sơ xin gia hạn đề tài (nếu tiến độ bị chậm trễ).'
        ],
        officeTasks: [
          'Tiếp nhận báo cáo tiến độ định kỳ, đánh giá mức độ hoàn thành nhiệm vụ.',
          'Xem xét và trình phê duyệt gia hạn đề tài nếu lý do hợp lệ.'
        ],
        templates: [
          { code: 'BM9/NCKH', name: 'Mẫu Báo cáo tiến độ định kỳ' }
        ]
      };
    case 10:
      return {
        stepNumber: 10,
        stepTitle: 'Nộp hồ sơ nghiệm thu',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [
          'Hoàn thiện toàn bộ báo cáo tổng kết đề tài và các bài báo khoa học xuất bản.',
          'Chuẩn bị hồ sơ nghiệm thu đầy đủ và nộp về Phòng NCKH.'
        ],
        officeTasks: [
          'Thẩm định hành chính hồ sơ xin nghiệm thu.',
          'Xác nhận hồ sơ đủ điều kiện nghiệm thu và chuẩn bị tờ trình lập Hội đồng nghiệm thu.'
        ],
        templates: [
          { code: 'BM11/NCKH', name: 'Mẫu Báo cáo kết quả nghiệm thu' }
        ]
      };
    case 11:
      return {
        stepNumber: 11,
        stepTitle: 'Đánh giá & Nghiệm thu',
        responsibleRoles: 'Hội đồng Nghiệm thu & Chủ nhiệm đề tài',
        researcherTasks: [
          'Báo cáo slide tổng kết kết quả nghiên cứu trước Hội đồng nghiệm thu.',
          'Trả lời chất vấn chuyên môn từ Hội đồng.'
        ],
        officeTasks: [
          'Tổ chức cuộc họp Hội đồng đánh giá nghiệm thu đề tài.',
          'Lập biên bản đánh giá và ghi nhận điểm số nghiệm thu.'
        ],
        templates: [
          { code: 'BM15/NCKH', name: 'Biên bản họp Hội đồng đánh giá nghiệm thu' }
        ]
      };
    case 12:
      return {
        stepNumber: 12,
        stepTitle: 'Hoàn thiện sau nghiệm thu',
        responsibleRoles: 'Chủ nhiệm đề tài & Chủ tịch Hội đồng',
        researcherTasks: [
          'Chỉnh sửa báo cáo tổng kết theo ý kiến góp ý cuối cùng của Hội đồng nghiệm thu.',
          'Nộp bản giải trình chỉnh sửa sau nghiệm thu có chữ ký của Chủ tịch Hội đồng.'
        ],
        officeTasks: [
          'Tiếp nhận báo cáo nghiệm thu hoàn chỉnh sau sửa đổi.',
          'Xác nhận hoàn tất nội dung chuyên môn sau nghiệm thu.'
        ],
        templates: [
          { code: 'BM16/NCKH', name: 'Mẫu Biên bản giải trình chỉnh sửa sau nghiệm thu' }
        ]
      };
    case 13:
      return {
        stepNumber: 13,
        stepTitle: 'Công nhận kết quả',
        responsibleRoles: 'Ban Giám đốc & Phòng Quản lý NCKH',
        researcherTasks: [
          'Nhận Quyết định công nhận kết quả nghiệm thu đề tài chính thức.'
        ],
        officeTasks: [
          'Trình Ban Giám đốc ký ban hành Quyết định công nhận kết quả nghiệm thu chính thức.'
        ],
        templates: [
          { code: 'BM17/NCKH', name: 'Quyết định công nhận kết quả nghiệm thu đề tài' }
        ]
      };
    case 14:
      return {
        stepNumber: 14,
        stepTitle: 'Nộp lưu & Đóng hồ sơ',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH & Thư viện',
        researcherTasks: [
          'Gửi đĩa CD/USB dữ liệu gốc và 01 quyển báo cáo bìa cứng về Thư viện bệnh viện.',
          'Hoàn tất thủ tục quyết toán tài chính và nhận biên nhận nộp lưu đề tài.'
        ],
        officeTasks: [
          'Kiểm tra biên nhận nộp lưu thư viện.',
          'Đóng hồ sơ đề tài trên hệ thống và chuyển trạng thái lưu trữ dài hạn.'
        ],
        templates: []
      };
    default:
      return {
        stepNumber: 1,
        stepTitle: 'Khởi tạo & Tiếp nhận đề xuất',
        responsibleRoles: 'Chủ nhiệm đề tài & Phòng Quản lý NCKH',
        researcherTasks: [],
        officeTasks: [],
        templates: []
      };
  }
}
