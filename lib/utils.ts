// ====================================================
// UTILITY FUNCTIONS: FORMAT TIỀN TỆ, NGÀY THÁNG, PHÂN LOẠI & VI HÓA ENUM
// ====================================================

export function formatVND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '---';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'RESEARCHER':
      return 'Cán bộ Nghiên cứu';
    case 'RESEARCH_OFFICE':
      return 'Phòng Quản lý NCKH';
    case 'COUNCIL_MEMBER':
      return 'Thành viên Hội đồng';
    case 'COUNCIL_SECRETARY':
      return 'Thư ký Hội đồng';
    case 'ETHICS_OFFICE':
      return 'Hội đồng Đạo đức Y sinh';
    case 'FINANCE_OFFICER':
      return 'Phòng Tài chính - Kế toán';
    case 'DIRECTOR':
      return 'Ban Giám đốc Bệnh viện';
    case 'ADMIN':
      return 'Quản trị viên Hệ thống';
    default:
      return role;
  }
}

export function getProjectTypeDisplayName(type: string): string {
  switch (type) {
    case 'NGHIÊN_CỨU_LÂM_SÀNG':
      return 'Nghiên cứu lâm sàng';
    case 'CAN_THIỆP_CỘNG_ĐỒNG':
      return 'Can thiệp cộng đồng';
    case 'DỊCH_TỄ_HỌC':
      return 'Dịch tễ học';
    case 'QUẢN_LÝ_Y_TẾ':
      return 'Quản lý y tế';
    case 'CẢI_TIẾN_KỸ_THUẬT':
      return 'Cải tiến kỹ thuật';
    default:
      return type;
  }
}

export function getFundingSourceDisplayName(source: string): string {
  switch (source) {
    case 'NGÂN_SÁCH_BỆNH_VIỆN':
      return 'Ngân sách Bệnh viện';
    case 'TỰ_TÚC':
      return 'Kinh phí tự túc';
    case 'TÀI_TRỢ_NGOÀI':
      return 'Tài trợ ngoài / Hợp tác';
    case 'HỖN_HỢP':
      return 'Nguồn hỗn hợp';
    default:
      return source;
  }
}

export function getManagementLevelDisplayName(level: string): string {
  switch (level) {
    case 'CẤP_CƠ_SỞ':
      return 'Cấp cơ sở (Bệnh viện)';
    case 'CẤP_TỈNH':
      return 'Cấp Tỉnh / Thành phố';
    case 'CẤP_BỘ':
      return 'Cấp Bộ Y tế';
    case 'CẤP_QUỐC_GIA':
      return 'Cấp Quốc gia / Nhà nước';
    default:
      return level;
  }
}

export function getEthicsStatusDisplayName(status: string): string {
  switch (status) {
    case 'NOT_REQUIRED':
      return 'Không thuộc diện';
    case 'DOSSIER_SUBMITTED':
      return 'Đã nộp hồ sơ';
    case 'UNDER_ETHICS_REVIEW':
      return 'Đang thẩm định';
    case 'ETHICS_APPROVED':
      return 'Đã chấp thuận';
    case 'ETHICS_REJECTED':
      return 'Từ chối chấp thuận';
    default:
      return status;
  }
}

export function getProposalStatusDisplayName(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Bản nháp';
    case 'SUBMITTED':
      return 'Đã nộp hồ sơ';
    case 'UNDER_ADMIN_REVIEW':
      return 'Đang kiểm tra hồ sơ';
    case 'REVISION_REQUIRED':
      return 'Yêu cầu bổ sung';
    case 'RESUBMITTED':
      return 'Đã nộp lại';
    case 'VALID':
      return 'Hồ sơ hợp lệ';
    case 'REJECTED':
      return 'Từ chối tiếp nhận';
    default:
      return status;
  }
}

export function getDocumentTypeDisplayName(type: string): string {
  switch (type) {
    case 'REGISTRATION_FORM':
      return 'Đơn đăng ký đề tài';
    case 'DETAILED_OUTLINE':
      return 'Đề cương nghiên cứu chi tiết';
    case 'CV_PI':
      return 'Lý lịch khoa học Chủ nhiệm (CV)';
    case 'ETHICS_DOSSIER':
      return 'Hồ sơ đạo đức y sinh';
    case 'ESTIMATED_BUDGET':
      return 'Thuyết minh dự toán kinh phí';
    case 'ACCEPTANCE_DOSSIER':
      return 'Hồ sơ nghiệm thu kết quả';
    default:
      return type;
  }
}
