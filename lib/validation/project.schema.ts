import { z } from 'zod';

export const projectRegistrationSchema = z.object({
  title: z.string().min(10, 'Tên đề tài phải có ít nhất 10 ký tự'),
  departmentId: z.string().min(1, 'Vui lòng chọn khoa phòng'),
  principalInvestigatorId: z.string().min(1, 'Chủ nhiệm đề tài không được để trống'),
  estimatedBudget: z.number().min(1000000, 'Kinh phí dự toán tối thiểu là 1.000.000đ'),
  durationMonths: z.number().min(3).max(36, 'Thời gian thực hiện từ 3 đến 36 tháng'),
});

export const councilCreationSchema = z.object({
  name: z.string().min(10, 'Tên hội đồng phải có ít nhất 10 ký tự'),
  type: z.enum(['PROPOSAL_REVIEW', 'ACCEPTANCE_REVIEW']),
  meetingDate: z.string().min(1, 'Ngày họp không được để trống'),
  location: z.string().min(3, 'Vui lòng điền địa điểm họp'),
});
