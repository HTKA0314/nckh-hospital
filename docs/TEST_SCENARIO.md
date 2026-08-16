# KỊCH BẢN KIỂM THỬ ĐẦU CUỐI (END-TO-END TEST SCENARIO)
### QUY TRÌNH QUẢN LÝ ĐỀ TÀI NGHIÊN CỨU KHOA HỌC Y TẾ (CRMS)

Kịch bản này hướng dẫn từng bước chuyển đổi vai trò (Role Switch) và các thao tác trên giao diện để thực hiện demo luồng đi của một đề tài từ lúc đăng ký ý tưởng đến khi công nhận kết quả nghiệm thu cuối cùng.

---

## CÁC TÀI KHOẢN & VAI TRÒ DEMO (Góc trên bên phải màn hình)
1.  **Chủ nhiệm đề tài (RESEARCHER)**: BS.CKII Nguyễn Văn An
2.  **Phòng Quản lý NCKH (RESEARCH_OFFICE)**: ThS. Lê Hoàng Long
3.  **Thành viên Hội đồng (COUNCIL_MEMBER - Thư ký)**: BS.CKI Đỗ Bích Ngọc
4.  **Hội đồng Khoa học (COUNCIL_MEMBER - Chủ tịch)**: PGS.TS.BS Phạm Đức Dũng
5.  **Ban Giám đốc (DIRECTOR)**: GS.TS.BS Vũ Đình Khoa

---

## KỊCH BẢN 1: ĐĂNG KÝ, XÉT DUYỆT ĐỀ CƯƠNG VÀ GIAO THỰC HIỆN ĐỀ TÀI

### Bước 1.1: Đăng ký đề xuất đề tài mới
*   **Người thực hiện**: Chủ nhiệm đề tài (BS.CKII Nguyễn Văn An).
*   **Thao tác**:
    1.  Vào menu **"Đề tài của tôi"** (`/my-projects`) $\rightarrow$ Chọn **"Đăng ký đề tài"** ở góc phải.
    2.  Điền thông tin đề tài ý tưởng (ví dụ: *Nghiên cứu ứng dụng trí tuệ nhân tạo trong chẩn đoán hình ảnh*).
    3.  Nhập thông tin mục tiêu sơ bộ, chọn Khoa/Phòng chủ trì, dự kiến kinh phí.
    4.  Nhấn **"Gửi đề xuất"**.
*   **Kết quả**: Đề tài chuyển sang trạng thái **Chờ Phòng NCKH tiếp nhận** (`SUBMITTED`).

### Bước 1.2: Kiểm tra & duyệt đề xuất hành chính
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
*   **Thao tác**:
    1.  Vào menu **"Thẩm định hồ sơ"** (`/review`) $\rightarrow$ Tab **"Hồ sơ đăng ký"** $\rightarrow$ Tìm đề tài vừa nộp ở cột *"Chờ tiếp nhận"*.
    2.  Nhấn nút **"Tiếp nhận"** $\rightarrow$ Trạng thái chuyển sang *"Đang kiểm tra"* (`UNDER_ADMIN_REVIEW`).
    3.  Nhấn **"Mở kiểm tra"** $\rightarrow$ Tích chọn các nội dung kiểm tra bắt buộc ở Popup $\rightarrow$ Chọn kết quả **"Hồ sơ hợp lệ"** $\rightarrow$ Nhấn **"Hoàn tất kiểm tra"**.
*   **Kết quả**: Trạng thái chuyển thành **Hồ sơ hợp lệ** (`ADMIN_VALIDATED`).

### Bước 1.3: Nộp đề cương chi tiết
*   **Người thực hiện**: Chủ nhiệm đề tài (BS.CKII Nguyễn Văn An).
*   **Thao tác**:
    1.  Vào menu **"Đề tài của tôi"** $\rightarrow$ Đề tài vừa được duyệt hồ sơ sẽ hiển thị cột cảnh báo *"Cần xử lý"* $\rightarrow$ Nhấn nút **Upload** (Đính kèm/nộp đề cương).
    2.  Chọn khoảng thời gian thực hiện, tải file đề cương chi tiết (`.docx`) $\rightarrow$ Nhấn **"Nộp đề cương"**.
*   **Kết quả**: Trạng thái hồ sơ chuyển sang **Chờ xét duyệt đề cương** (`OUTLINE_SUBMITTED`).

### Bước 1.4: Lập Hội đồng xét duyệt đề cương & Trình quyết định thành lập HĐ
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
*   **Thao tác**:
    1.  Vào menu **"Hội đồng KH&CN"** (`/councils`) $\rightarrow$ Nhấn **"Tạo Hội đồng mới"** ở góc phải.
    2.  Chọn loại **"Xét duyệt đề cương"** $\rightarrow$ Đặt tên Hội đồng, ngày giờ họp, địa điểm.
    3.  Thêm đề tài vừa nộp đề cương vào danh sách Hội đồng.
    4.  Chọn các chức danh: Chủ tịch (Phạm Đức Dũng), Thư ký (Đỗ Bích Ngọc), Phản biện và Ủy viên.
    5.  Lưu lại $\rightarrow$ Nhấn nút **"Trình Quyết định thành lập"**.
*   **Kết quả**: Hội đồng ở trạng thái *Dự thảo* chuyển sang chờ ký.

### Bước 1.5: Phê duyệt thành lập Hội đồng
*   **Người thực hiện**: Ban Giám đốc (GS.TS.BS Vũ Đình Khoa).
*   **Thao tác**:
    1.  Vào menu **"Quản lý Quyết định"** (`/decisions`) $\rightarrow$ Chọn tab **"Chờ ký"**.
    2.  Nhấp mở Quyết định thành lập Hội đồng vừa trình $\rightarrow$ Nhấn **"Ký quyết định"**.
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
    1.  Quay lại menu **"Quản lý Quyết định"** $\rightarrow$ Chọn tab **"Đã ký"** $\rightarrow$ Mở Quyết định thành lập.
    2.  Nhập số quyết định (ví dụ: `45/QĐ-HĐ`) $\rightarrow$ Nhấn **"Ban hành quyết định"**.
*   **Kết quả**: Hội đồng chính thức chuyển sang trạng thái hoạt động (**ESTABLISHED**), đề tài tự động chuyển sang **Hội đồng đang xét duyệt đề cương** (`UNDER_PROPOSAL_REVIEW`).

### Bước 1.6: Thành viên chấm điểm chuyên môn
*   **Người thực hiện**: Lần lượt chuyển vai trò **Hội đồng Khoa học (Phạm Đức Dũng)** và **Thành viên Hội đồng (Đỗ Bích Ngọc)**.
*   **Thao tác**:
    1.  Vào menu **"Hội đồng KH&CN"** $\rightarrow$ Mở Hội đồng đang họp.
    2.  Vào tab **"Đánh giá & Chấm điểm"** $\rightarrow$ Nhấn nút **"Đánh giá"** bên cạnh đề tài.
    3.  Nhập điểm tiêu chí, ý kiến nhận xét và tích biểu quyết **"Tán thành"** $\rightarrow$ Nhấn **"Gửi phiếu đánh giá"**.

### Bước 1.7: Lập và Ký số biên bản họp Hội đồng đề cương
*   **Người thực hiện**: Thư ký Hội đồng (Đỗ Bích Ngọc).
*   **Thao tác**:
    1.  Vào Hội đồng $\rightarrow$ Nhấp tab **"Biên bản họp"** $\rightarrow$ Nhấn **"Lập biên bản"**.
    2.  Xem điểm trung bình tự động tính toán, nhập tóm tắt kết luận thống nhất và yêu cầu chỉnh sửa (nếu có) $\rightarrow$ Nhấn **"Lưu dự thảo biên bản"** $\rightarrow$ Nhấn **"Trình Chủ tịch xác nhận"**.
*   **Người thực hiện**: Chủ tịch Hội đồng (Phạm Đức Dũng).
    1.  Vào Hội đồng $\rightarrow$ Chọn tab **"Biên bản họp"** $\rightarrow$ Nhấn **"Xác nhận biên bản họp"**.
    2.  Sau khi xác nhận thành công, nhấn **"Ký số biên bản họp"** để thực hiện ký số với tư cách Chủ tịch.
*   **Người thực hiện**: Thư ký Hội đồng (Đỗ Bích Ngọc).
    1.  Vào lại tab Biên bản họp của Hội đồng $\rightarrow$ Nhấn **"Ký số biên bản họp"** để hoàn tất chữ ký thứ hai.
*   **Kết quả**: Biên bản họp chuyển trạng thái thành **SIGNED**. Đề tài tự động chuyển trạng thái vĩ mô sang **Chờ giao thực hiện** (`WAITING_ASSIGNMENT`) và trạng thái đề xuất thành **Đã duyệt đề cương** (`PROPOSAL_APPROVED`).

### Bước 1.8: Ban hành Quyết định giao thực hiện đề tài
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
*   **Thao tác**:
    1.  Vào menu **"Quản lý Quyết định"** $\rightarrow$ Nhấn nút **`+ QĐ giao thực hiện`** ở góc phải.
    2.  Đề tài vừa được duyệt đề cương sẽ nằm trong danh sách đủ điều kiện $\rightarrow$ Tích chọn đề tài $\rightarrow$ Chọn **"Tạo & trình ký"**.
*   **Người thực hiện**: Ban Giám đốc (GS.TS.BS Vũ Đình Khoa).
    1.  Vào menu **"Quản lý Quyết định"** $\rightarrow$ Tab **"Chờ ký"** $\rightarrow$ Mở quyết định giao thực hiện $\rightarrow$ Nhấn **"Ký quyết định"**.
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
    1.  Vào menu **"Quản lý Quyết định"** $\rightarrow$ Tab **"Đã ký"** $\rightarrow$ Mở quyết định $\rightarrow$ Nhập số Quyết định chính thức (ví dụ: `101/QĐ-BV`) $\rightarrow$ Nhấn **"Ban hành quyết định"**.
*   **Kết quả**: Đề tài chính thức được cấp mã số và chuyển sang trạng thái **Đang thực hiện** (`IN_PROGRESS`).

---

## KỊCH BẢN 2: BÁO CÁO TIẾN ĐỘ, NGHIỆM THU VÀ CÔNG NHẬN KẾT QUẢ ĐỀ TÀI

### Bước 2.1: Nộp Báo cáo Tiến độ (Trong giai đoạn thực hiện)
*   **Người thực hiện**: Chủ nhiệm đề tài (BS.CKII Nguyễn Văn An).
*   **Thao tác**:
    1.  Vào menu **"Đề tài của tôi"** $\rightarrow$ Tại dòng đề tài đang thực hiện, nhấn vào biểu tượng đồ thị hình cột (**Báo cáo tiến độ**).
    2.  Nhập nội dung đã làm, % tiến độ, đính kèm file báo cáo minh chứng $\rightarrow$ Nhấn **"Nộp báo cáo"**.
*   **Kết quả**: Báo cáo lưu trữ lịch sử báo cáo tiến độ thành công.

### Bước 2.2: Lập hồ sơ nghiệm thu đề tài
*   **Người thực hiện**: Chủ nhiệm đề tài (BS.CKII Nguyễn Văn An).
*   **Thao tác**:
    1.  Vào menu **"Đề tài của tôi"** $\rightarrow$ Nhấp biểu tượng ba chấm ngang cuối dòng đề tài $\rightarrow$ Chọn **"Lập hồ sơ nghiệm thu"**.
    2.  Tải lên các file báo cáo tổng kết, sản phẩm nghiên cứu, bài báo công bố và hồ sơ tài chính $\rightarrow$ Nhấn **"Gửi hồ sơ nghiệm thu"**.
*   **Kết quả**: Đề tài chuyển trạng thái sang **Chờ nghiệm thu** (`WAITING_ACCEPTANCE`), hồ sơ nghiệm thu là `SUBMITTED`.

### Bước 2.3: Thẩm định hồ sơ nghiệm thu
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
*   **Thao tác**:
    1.  Vào menu **"Nghiệm thu đề tài"** (`/acceptance`) $\rightarrow$ Mở hồ sơ vừa gửi ở danh sách.
    2.  Nhấn **"Tiếp nhận hồ sơ"** $\rightarrow$ Kiểm tra đối chiếu sản phẩm cam kết ban đầu và sản phẩm thực tế $\rightarrow$ Tích chọn các danh mục hồ sơ nghiệm thu hợp lệ.
    3.  Nhấn nút **"Xác nhận đủ điều kiện"**.
*   **Kết quả**: Hồ sơ nghiệm thu chuyển sang trạng thái **Đủ điều kiện nghiệm thu** (`ELIGIBLE_FOR_ACCEPTANCE`).

### Bước 2.4: Lập Hội đồng nghiệm thu & Đánh giá kết quả Đạt có sửa đổi
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
*   **Thao tác**:
    1.  Vào menu **"Hội đồng KH&CN"** $\rightarrow$ Nhấn **"Tạo Hội đồng mới"** $\rightarrow$ Chọn loại **"Nghiệm thu đề tài"**.
    2.  Chọn đề tài đã đủ điều kiện nghiệm thu đưa vào Hội đồng.
    3.  Bổ sung danh sách thành viên Hội đồng $\rightarrow$ Nhấn **"Lưu nháp"** $\rightarrow$ Nhấn **"Trình Quyết định thành lập"**.
*   **Ban Giám đốc & Phòng NCKH**: Thực hiện ký số và ban hành Quyết định thành lập tương tự quy trình ở Bước 1.5.
*   **Thành viên Hội đồng (Thư ký Ngọc & Chủ tịch Dũng)**: Thực hiện chấm phiếu điểm nghiệm thu tương tự Bước 1.6.

### Bước 2.5: Lập biên bản nghiệm thu Đạt có sửa đổi & Ký số
*   **Người thực hiện**: Thư ký Hội đồng (Đỗ Bích Ngọc).
*   **Thao tác**:
    1.  Vào Hội đồng $\rightarrow$ Tab **"Biên bản họp"** $\rightarrow$ Nhấn **"Lập biên bản"**.
    2.  Chọn kết luận nghiệm thu là **"Thông qua có sửa đổi"** $\rightarrow$ Nhập yêu cầu Hội đồng bắt buộc sửa đổi (ví dụ: *Chỉnh sửa lại số liệu thống kê tại chương 3*) $\rightarrow$ Lưu và Trình Chủ tịch.
*   **Chủ tịch & Thư ký**: Lần lượt nhấp nút **"Xác nhận biên bản"** và thực hiện **"Ký số biên bản họp"** tương tự như Bước 1.7.
*   **Kết quả**: Đề tài được nghiệm thu chuyên môn và chuyển trạng thái vĩ mô thành **Đã nghiệm thu** (`ACCEPTED`), tạo bản ghi hoàn thiện hồ sơ có trạng thái `PENDING`.

### Bước 2.6: Giải trình hoàn thiện sau nghiệm thu
*   **Người thực hiện**: Chủ nhiệm đề tài (BS.CKII Nguyễn Văn An).
*   **Thao tác**:
    1.  Hệ thống xuất hiện thêm menu riêng **"Hoàn thiện sau nghiệm thu"** (`/acceptance/revision`) ở vai trò Nghiên cứu viên.
    2.  Chủ nhiệm mở đề tài cần hoàn thiện $\rightarrow$ Nhấp **"Hoàn thiện"**.
    3.  Nhập nội dung giải trình sửa đổi theo góp ý Hội đồng, upload bản báo cáo đã chỉnh sửa $\rightarrow$ Nhấn **"Nộp báo cáo giải trình"**.
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
    1.  Vào menu **"Hoàn thiện sau nghiệm thu"** (`/acceptance/revision`) $\rightarrow$ Mở đề tài $\rightarrow$ Xem nội dung giải trình và bản báo cáo $\rightarrow$ Nhấp nút **"Xác nhận hoàn thành giải trình"**.
*   **Kết quả**: Hồ sơ sửa đổi được xác nhận thành công (`CONFIRMED`), đề tài đủ điều kiện ban hành quyết định công nhận kết quả.

### Bước 2.7: Ban hành Quyết định công nhận kết quả đề tài
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
*   **Thao tác**:
    1.  Vào menu **"Quản lý Quyết định"** $\rightarrow$ Nhấn nút **`+ QĐ công nhận`** ở góc phải.
    2.  Chọn đề tài đã hoàn tất giải trình nghiệm thu $\rightarrow$ Nhấn **"Tạo & trình ký"**.
*   **Người thực hiện**: Ban Giám đốc (GS.TS.BS Vũ Đình Khoa).
    1.  Vào menu **"Quản lý Quyết định"** $\rightarrow$ Tab **"Chờ ký"** $\rightarrow$ Mở quyết định công nhận $\rightarrow$ Nhấn **"Ký quyết định"**.
*   **Người thực hiện**: Phòng Quản lý NCKH (ThS. Lê Hoàng Long).
    1.  Vào menu **"Quản lý Quyết định"** $\rightarrow$ Tab **"Đã ký"** $\rightarrow$ Mở quyết định $\rightarrow$ Nhập số Quyết định chính thức (ví dụ: `250/QĐ-BV`) $\rightarrow$ Nhấn **"Ban hành quyết định"**.
*   **Kết quả**: Đề tài chính thức chuyển sang trạng thái cuối cùng là **Đã công nhận kết quả** (`RECOGNIZED`), hoàn thành trọn vẹn chu trình quản lý đề tài.
