# LUỒNG NGHIỆP VỤ & BẢN ĐỒ MÀN HÌNH HỆ THỐNG (SITEMAP & WORKFLOW)

Tài liệu này mô tả chi tiết luồng nghiệp vụ nghiên cứu khoa học (NCKH) và bản đồ các màn hình tương ứng trong hệ thống dành cho 3 nhóm vai trò người dùng.

---

## 1. Sơ đồ Luồng Nghiệp vụ rút gọn (Business Lifecycle)

Dưới đây là chu trình vận hành cốt lõi của một đề tài:

```mermaid
flowchart LR
    A([1. Đăng ký Đề cương]) 
    --> B[2. Duyệt chuyên môn & Y đức] 
    --> C([3. Quyết định giao việc])
    --> D[4. Triển khai & Báo cáo]
    --> E[5. Duyệt nghiệm thu]
    --> F([6. Quyết định công nhận])
    --> G([7. Kết thúc đề tài])

    style C fill:#3b82f6,color:#fff
    style F fill:#10b981,color:#fff
    style G fill:#6b7280,color:#fff
```

### Các ràng buộc cốt lõi (Business Gates):
- **Chốt chặn Giao thực hiện (Giai đoạn Đề cương)**: Đề tài chỉ được chuyển sang trạng thái *Đang thực hiện* (`IN_PROGRESS`) sau khi đạt hai điều kiện: Đề cương chuyên môn đạt + Hồ sơ Y đức được phê duyệt (`ETHICS_APPROVED` hoặc `NOT_REQUIRED`), và **Quyết định Giao thực hiện** (`Decision` loại `ASSIGNMENT`) đã được Giám đốc ký ban hành.
- **Chốt chặn Nghiệm thu (Giai đoạn Kết thúc)**: Đề tài chỉ chuyển sang trạng thái *Hoàn thành* (`ACCEPTED` / `RECOGNIZED`) sau khi hồ sơ thẩm định đạt và **Quyết định Công nhận kết quả** (`Decision` loại `RECOGNITION`) đã được Giám đốc ký ban hành.

---

## 2. Bản đồ Màn hình & Điều hướng (Sitemap & Navigation Flow)

Phần mềm tổ chức giao diện theo chức năng và phân quyền vai trò người dùng:

```mermaid
flowchart TD
    %% Nhóm Vai trò
    subgraph Role1 ["1. CHỦ NHIỆM ĐỀ TÀI (Giảng viên, Bác sĩ...)"]
        A[Trang cá nhân: /my-projects] 
        --> B[Đăng ký đề tài mới: /projects/register]
        A --> C[Xem chi tiết đề tài: /projects/[id]]
        C --> D[Báo cáo tiến độ định kỳ: /progress]
        C --> E[Nộp Hồ sơ Nghiệm thu: /projects/[id]/acceptance]
        A --> F[Tải biểu mẫu mẫu: /templates]
    end

    subgraph Role2 ["2. PHÒNG QUẢN LÝ NCKH (Chuyên viên NCKH)"]
        G[Danh sách toàn viện: /projects] 
        --> H[Kiểm tra hồ sơ đăng ký: /review]
        G --> I[Quản lý Hội đồng: /councils]
        I --> J[Workspace chấm điểm & Biên bản: /councils/[id]]
        G --> K[Thẩm định hồ sơ nghiệm thu: /acceptance]
        G --> L[Ban hành Quyết định: /decisions]
        G --> M[Quản lý Đạo đức y sinh: /ethics]
        G --> N[Theo dõi Tài chính: /finance]
    end

    subgraph Role3 ["3. THÀNH VIÊN HỘI ĐỒNG (Chủ tịch, Phản biên...)"]
        O[Trang danh sách HĐ tham gia: /councils]
        --> P[Workspace chấm điểm phiếu bầu & ký: /councils/[id]]
    end

    %% Luồng liên kết giữa các vai trò & màn hình
    B -- Nộp hồ sơ đề xuất --> H
    J -- Góp ý chuyên môn/Biên bản họp đạt --> L
    E -- Gửi hồ sơ nghiệm thu --> K
    K -- Duyệt đạt hồ sơ --> I
    P -- Ký xác nhận kết quả họp --> J
    L -- Giao thực hiện/Công nhận --> C

    style Role1 fill:#f9fafb,stroke:#475569,stroke-width:1.5px
    style Role2 fill:#f0f8ff,stroke:#0A6EBD,stroke-width:1.5px
    style Role3 fill:#f0fdf4,stroke:#15803d,stroke-width:1.5px
    
    style J fill:#bfdbfe,stroke:#2563eb,stroke-width:2px
    style K fill:#bfdbfe,stroke:#2563eb,stroke-width:2px
    style P fill:#bbf7d0,stroke:#16a34a,stroke-width:2px
```

---

## 3. Chi tiết chức năng từng Màn hình (Routes)

### 3.1. Phân hệ Chủ nhiệm đề tài (Researchers)
*   ``/my-projects``: Quản lý danh sách các đề tài cá nhân đăng ký làm chủ nhiệm hoặc thành viên tham gia.
*   ``/projects/register``: Form nhập thông tin đăng ký đề cương đề tài mới (Tên đề tài, đối tượng, phương pháp, kinh phí đề xuất...).
*   ``/projects/[id]``: Dashboard chi tiết của đề tài để theo dõi tiến độ, xem phản hồi của Hội đồng khoa học, tải chứng nhận IRB y đức, nộp báo cáo.
*   ``/progress``: Màn hình nộp báo cáo tiến độ định kỳ (1/3/6 tháng) đính kèm minh chứng.
*   ``/templates``: Kho chứa toàn bộ biểu mẫu hành chính (chuẩn Thông tư 43/2024/TT-BYT & Quyết định bệnh viện) dưới dạng Word, Excel để tải về.

### 3.2. Phân hệ Phòng Quản lý NCKH (Research Office)
*   ``/projects``: Quản lý và lọc toàn bộ danh sách các đề tài khoa học toàn viện.
*   ``/review``: Nơi chuyên viên tiếp nhận và đối soát hồ sơ đăng ký đề cương ban đầu từ chủ nhiệm.
*   ``/ethics``: Quản lý, kiểm tra hồ sơ đạo đức y sinh (IRB) của các đề tài có liên quan đến bệnh nhân.
*   ``/councils``: Quản lý danh sách, thành lập Hội đồng xét duyệt đề cương hoặc nghiệm thu sản phẩm.
*   ``/acceptance``: Bàn thẩm định đối soát hồ sơ nghiệm thu thực tế (đối chiếu sản phẩm thực tế với sản phẩm cam kết ban đầu).
*   ``/decisions``: Nơi khởi tạo, trình ký số và ban hành các văn bản Quyết định giao việc/công nhận kết quả từ Ban Giám đốc.
*   ``/finance``: Theo dõi phân bổ kinh phí, tiếp nhận chứng từ chi tiêu và quyết toán tài chính đề tài.

### 3.3. Phân hệ Thành viên Hội đồng (Council Members)
*   ``/councils/[id]``: Bàn làm việc số của thành viên hội đồng. Cho phép nhập điểm, đánh giá ý kiến, bỏ phiếu kết luận và thực hiện ký số điện tử xác nhận phiếu chấm điểm.
