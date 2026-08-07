# HỆ THỐNG QUẢN LÝ NGHIÊN CỨU KHOA HỌC CẤP CƠ SỞ TẠI BỆNH VIỆN

Prototype web quản lý toàn diện vòng đời đề tài nghiên cứu khoa học cấp cơ sở theo chuẩn **Thông tư 09/2024/TT-BKHCN**, **Thông tư 43/2024/TT-BYT** và Quy chế Quản lý NCKH Bệnh viện.

---

## 🏛️ CĂN CỨ PHÁP LÝ & QUY CHUẨN NGHIỆP VỤ

1. **Thông tư số 09/2024/TT-BKHCN** (Bộ KH&CN): Quy định quản lý nhiệm vụ KH&CN cấp cơ sở, tuyển chọn, giao trực tiếp, kiểm tra tiến độ, nghiệm thu và đánh giá kết quả.
2. **Thông tư số 43/2024/TT-BYT** (Bộ Y tế): Quy định về tổ chức và hoạt động của Hội đồng Đạo đức trong nghiên cứu Y sinh học, bảo đảm an toàn đối tượng nghiên cứu và bảo mật dữ liệu y tế.
3. **Quy chế Quản lý Nghiên cứu Khoa học Bệnh viện**: Quy định về mở đợt, thành lập Hội đồng, định mức hỗ trợ đề tài cơ sở.
4. **Quy chế Chi tiêu & Tài chính Nội bộ Bệnh viện**: Hướng dẫn lập dự toán, tạm ứng, thanh quyết toán và thanh lý hợp đồng NCKH.

---

## 👥 MA TRẬN 8 VAI TRÒ & PHÂN QUYỀN (RBAC)

1. **`RESEARCHER` (Chủ nhiệm / Thành viên đề tài)**: Tạo, chỉnh sửa bản nháp, nộp hồ sơ 5 bước, nhận phản hồi thẩm định, nộp bổ sung v2.0, nộp báo cáo tiến độ, nộp hồ sơ nghiệm thu.
2. **`RESEARCH_OFFICE` (Chuyên viên Phòng Quản lý NCKH)**: Mở/đóng đợt nộp, tiếp nhận thẩm định hồ sơ (Workspace Thẩm định), lập checklist hợp lệ, yêu cầu bổ sung, dự thảo quyết định thành lập Hội đồng, theo dõi tiến độ toàn viện.
3. **`COUNCIL_MEMBER` (Thành viên Hội đồng KH&CN / Nghiệm thu)**: Xem hồ sơ phân công, chấm điểm tiêu chí, bỏ phiếu biểu quyết, ghi nhận xét.
4. **`COUNCIL_SECRETARY` (Thư ký Hội đồng)**: Tổng hợp phiếu chấm, lập Biên bản họp Hội đồng, cập nhật kết luận thông qua/yêu cầu sửa đổi.
5. **`ETHICS_OFFICE` (Hội đồng Đạo đức Y sinh)**: Tiếp nhận hồ sơ sàng lọc đạo đức, cấp Giấy chấp thuận đạo đức (IRB Approval).
6. **`FINANCE_OFFICER` (Phòng Tài chính - Kế toán)**: Thẩm tra dự toán, ghi nhận giải ngân/tạm ứng, kiểm tra chứng từ quyết toán kinh phí đề tài.
7. **`DIRECTOR` (Ban Giám đốc Bệnh viện)**: Phê duyệt đợt đăng ký, phê duyệt thành lập HĐ, ký Quyết định giao thực hiện & Công nhận kết quả, xem Dashboard điều hành.
8. **`ADMIN` (Quản trị viên Hệ thống)**: Quản lý người dùng, phân vai trò, xem Audit Log toàn hệ thống, cấu hình danh mục.

---

## 🔄 8 MÁY TRẠNG THÁI (STATE MACHINES) ĐỘC LẬP

- **Đề tài (`ProjectStatus`)**: `DRAFT` ➔ `PROPOSAL_APPROVED` ➔ `IN_PROGRESS` ➔ `ACCEPTED` ➔ `CLOSED` ➔ `ARCHIVED` (hoặc `REJECTED`, `TERMINATED`, `SUSPENDED`).
- **Hồ sơ Đăng ký Đề xuất (`ProposalStatus`)**: `DRAFT` ➔ `SUBMITTED` ➔ `UNDER_ADMIN_REVIEW` ➔ `REVISION_REQUIRED` ➔ `RESUBMITTED` ➔ `VALID` ➔ `REJECTED`.
- **Hội đồng (`CouncilStatus`)**: `DRAFT` ➔ `ESTABLISHED` ➔ `EVALUATING` ➔ `MINUTES_DRAFTED` ➔ `CONCLUDED` ➔ `DISSOLVED`.
- **Đạo đức Y sinh (`EthicsStatus`)**: `NOT_REQUIRED` ➔ `DOSSIER_SUBMITTED` ➔ `UNDER_ETHICS_REVIEW` ➔ `ETHICS_APPROVED` (hoặc `ETHICS_REVISION_REQUIRED`, `ETHICS_REJECTED`, `ETHICS_EXPIRED`).
- **Báo cáo Tiến độ (`ProgressReportStatus`)**: `DRAFT` ➔ `SUBMITTED` ➔ `UNDER_REVIEW` ➔ `APPROVED` ➔ `REVISION_REQUIRED`.
- **Yêu cầu Điều chỉnh (`ChangeRequestStatus`)**: `DRAFT` ➔ `SUBMITTED` ➔ `UNDER_REVIEW` ➔ `APPROVED` ➔ `REJECTED`.
- **Hồ sơ Nghiệm thu (`AcceptanceDossierStatus`)**: `DRAFT` ➔ `SUBMITTED` ➔ `UNDER_ADMIN_REVIEW` ➔ `QUALIFIED_FOR_COUNCIL` ➔ `REVISION_REQUIRED`.
- **Tài chính & Quyết toán (`FinancialStatus`)**: `NOT_SETTLED` ➔ `SETTLEMENT_SUBMITTED` ➔ `SETTLING` ➔ `SETTLED` ➔ `FINANCIAL_COMPLETED`.

---

## 🚀 TIẾN ĐỘ TRIỂN KHAI THEO GIAI ĐOẠN

### Phase 1: Nền tảng, Shell Ứng dụng & Master Detail (Hoàn thành 100%)
- [x] Cấu trúc Next.js 14 App Router, TypeScript, Tailwind CSS.
- [x] Mock Repository tách biệt, RBAC Auth Context giả lập 8 vai trò người dùng (chuyển đổi nhanh ở Header).
- [x] Layout Dashboard: Sidebar thông minh thu gọn, Header Capsule, Breadcrumb động.
- [x] Dashboard KPIs tổng thể và Biểu đồ thống kê đề tài theo khoa phòng & trạng thái.
- [x] Trang Danh sách Đề tài với bộ lọc đa tiêu chí (khoa, đợt, trạng thái, yêu cầu đạo đức).
- [x] Trang Chi tiết Đề tài với **11 Tabs nghiệp vụ toàn diện** và **Lifecycle Stepper 5 bước**.

### Phase 2: Quản lý Đợt đăng ký & Tiếp nhận Hồ sơ Đề xuất (Hoàn thành 100%)
- [x] **Quản lý Đợt đăng ký (`/rounds`)**: Mở/đóng đợt nộp, thống kê số đề xuất, kiểm tra thời hạn.
- [x] **Form Đăng ký 5 Bước (`/projects/register`)**:
  - Bước 1: Thông tin chung & Lĩnh vực nghiên cứu.
  - Bước 2: Nhóm nghiên cứu & Tỷ lệ đóng góp.
  - Bước 3: Dự toán kinh phí & Nguồn vốn theo định mức bệnh viện.
  - Bước 4: **Sàng lọc Đạo đức Y sinh 4 câu hỏi (Thông tư 43/2024/TT-BYT)**.
  - Bước 5: Tài liệu đính kèm & Cam kết của Chủ nhiệm.
- [x] **Đề tài của tôi (`/my-projects`)**: Phân loại theo tab (Tất cả, Cần bổ sung, Đang thực hiện, Bản nháp).
- [x] **Workspace Thẩm định Hồ sơ (`/review`)**: Chuyên viên NCKH kiểm tra checklist 4 tiêu chí, thẩm định Hợp lệ / Yêu cầu bổ sung / Từ chối tiếp nhận.
- [x] **Luồng Trả Bổ sung & Nộp lại (`/projects/[id]/resubmit`)**: Nhập biên bản giải trình, tải lên bản đề cương hoàn thiện v2.0, tự động ghi Audit Log và bắn thông báo.

---

## 💻 HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ NGHIỆM

```bash
# Cài đặt dependencies
npm install

# Kiểm tra tính hợp lệ TypeScript
npm run type-check

# Kiểm tra chuẩn cú pháp ESLint
npm run lint

# Chạy máy chủ phát triển
npm run dev
# Truy cập: http://localhost:3000
```

> **Lưu ý nghiệp vụ:** Đây là prototype mô phỏng quy trình nghiệp vụ phục vụ phân tích BA và đào tạo nghiệp vụ bệnh viện. Toàn bộ dữ liệu bệnh nhân và đề tài là dữ liệu giả lập (synthetic data) tuân thủ bảo mật thông tin y tế.
