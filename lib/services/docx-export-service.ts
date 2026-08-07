import { ResearchProject } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/utils';
import { MedicalTemplate } from '@/lib/mock-data/templates-data';

/**
 * Service hỗ trợ xuất biểu mẫu tự động (Smart Auto-fill Document Generation)
 * Chuẩn hóa theo Thông tư 09/2024/TT-BYT & Thông tư 43/2024/TT-BYT
 */

// Helper download file dạng blob text/html/xml có thể mở trực tiếp trong Word hoặc PDF reader
function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const DocxExportService = {
  /**
   * 1. Xuất Thuyết minh đề tài NCKH Y tế chuẩn BM-02/NCKH (Word format)
   */
  exportProposalDocx(project: ResearchProject) {
    const filename = `BM-02-NCKH_Thuyet-minh_${project.proposalCode || project.id}.doc`;
    const budget = project.approvedBudget || project.estimatedBudget;

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>THUYẾT MINH ĐỀ TÀI NGHIÊN CỨU KHOA HỌC Y TẾ</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.3; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { vertical-align: top; text-align: center; font-size: 11pt; }
          .title { text-align: center; font-weight: bold; font-size: 16pt; margin: 20px 0; color: #0B2A63; }
          .subtitle { text-align: center; font-style: italic; margin-bottom: 20px; font-size: 11pt; }
          .section-title { font-weight: bold; font-size: 14pt; margin-top: 15px; margin-bottom: 5px; color: #0A6EBD; text-transform: uppercase; }
          .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .info-table th, .info-table td { border: 1px solid #333; padding: 6px 10px; font-size: 12pt; }
          .info-table th { background-color: #F0F4F8; text-align: left; }
          .footer-table { width: 100%; margin-top: 40px; }
          .footer-table td { text-align: center; vertical-align: top; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 45%;">
              BỘ Y TẾ<br/>
              <strong>BỆNH VIỆN ĐA KHOA TRUNG TÂM</strong><br/>
              Số: ${project.proposalCode}/TM-NCKH
            </td>
            <td style="width: 55%;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
              <em>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
            </td>
          </tr>
        </table>

        <div class="title">THUYẾT MINH ĐỀ TÀI NGHIÊN CỨU KHOA HỌC CẤP CƠ SỞ</div>
        <div class="subtitle">(Ban hành kèm theo Thông tư số 09/2024/TT-BYT của Bộ Y tế)</div>

        <div class="section-title">I. THÔNG TIN CHUNG VỀ ĐỀ TÀI</div>
        <table class="info-table">
          <tr>
            <th style="width: 30%;">Mã số đề tài / Đề xuất:</th>
            <td><strong>${project.projectCode || project.proposalCode}</strong></td>
          </tr>
          <tr>
            <th>Tên đề tài nghiên cứu:</th>
            <td><strong>${project.title}</strong></td>
          </tr>
          <tr>
            <th>Chủ nhiệm đề tài:</th>
            <td>${project.principalInvestigatorName} (${project.departmentName})</td>
          </tr>
          <tr>
            <th>Đơn vị chủ trì:</th>
            <td>${project.departmentName} - Bệnh viện Đa khoa Trung tâm</td>
          </tr>
          <tr>
            <th>Thời gian thực hiện:</th>
            <td>${formatDate(project.startDate)} đến ${formatDate(project.endDate)}</td>
          </tr>
          <tr>
            <th>Tổng kinh phí dự toán:</th>
            <td><strong>${formatVND(budget)}</strong> (Bằng chữ: Theo dự toán chi tiết)</td>
          </tr>
          <tr>
            <th>Thuộc đợt đăng ký:</th>
            <td>${project.registrationRoundName || 'Đợt 1 năm 2026'}</td>
          </tr>
        </table>

        <div class="section-title">II. TÓM TẮT & MỤC TIÊU NGHIÊN CỨU</div>
        <p style="text-align: justify;"><strong>1. Tóm tắt nội dung:</strong> ${project.summary}</p>
        <p style="text-align: justify;"><strong>2. Mục tiêu nghiên cứu:</strong> Đánh giá hiệu quả lâm sàng, hoàn thiện quy trình chẩn đoán và điều trị tại bệnh viện, nâng cao chất lượng phục vụ người bệnh.</p>

        <div class="section-title">III. DANH SÁCH THÀNH VIÊN NGHIÊN CỨU</div>
        <table class="info-table">
          <thead>
            <tr style="background-color: #E2E8F0;">
              <th>TT</th>
              <th>Họ và tên</th>
              <th>Học hàm / Học vị</th>
              <th>Đơn vị công tác</th>
              <th>Vai trò trong đề tài</th>
            </tr>
          </thead>
          <tbody>
            ${project.members
              .map(
                (m, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${m.fullName}</strong></td>
                <td>${m.academicRank || 'Bác sĩ'}</td>
                <td>${m.unit || project.departmentName}</td>
                <td>${m.roleInProject}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="section-title">IV. CAM KẾT & XÁC NHẬN</div>
        <p>Chúng tôi cam đoan thực hiện đúng quy chế quản lý khoa học công nghệ của Bộ Y tế và Bệnh viện.</p>

        <table class="footer-table">
          <tr>
            <td style="width: 50%;">
              <strong>TRƯỞNG KHOA / PHÒNG CHỦ QUẢN</strong><br/>
              <em>(Ký, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
            </td>
            <td style="width: 50%;">
              <strong>CHỦ NHIỆM ĐỀ TÀI</strong><br/>
              <em>(Ký, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
              <strong>${project.principalInvestigatorName}</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    downloadBlob(filename, content, 'application/msword;charset=utf-8');
  },

  /**
   * 2. Xuất Giấy Chứng nhận Chấp thuận Đạo đức Y sinh (IRB Approval Certificate)
   */
  exportEthicsCertificatePdf(project: ResearchProject) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const certNumber = `IRB-2026/${project.proposalCode?.replace('DX-', '') || '01'}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>GIẤY CHỨNG NHẬN CHẤP THUẬN ĐẠO ĐỨC Y SINH - ${certNumber}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #111; padding: 20px; }
          .border-frame { border: 3px double #0B2A63; padding: 30px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 25px; }
          .hospital { font-size: 12pt; font-weight: bold; text-transform: uppercase; color: #0B2A63; }
          .committee { font-size: 13pt; font-weight: bold; color: #0A6EBD; text-transform: uppercase; margin-top: 4px; }
          .national { font-size: 11pt; font-weight: bold; text-transform: uppercase; }
          .title { font-size: 20pt; font-weight: bold; text-align: center; color: #0B2A63; margin: 25px 0 10px 0; text-transform: uppercase; }
          .cert-num { text-align: center; font-size: 12pt; font-style: italic; margin-bottom: 25px; color: #444; }
          .content-block { margin: 15px 0; text-align: justify; }
          .highlight { font-weight: bold; color: #0B2A63; }
          .footer-box { margin-top: 40px; display: flex; justify-content: space-between; }
          .stamp-box { border: 2px dashed #0A6EBD; padding: 10px 15px; border-radius: 6px; font-size: 10pt; color: #0A6EBD; width: 220px; text-align: center; margin-top: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #0A6EBD; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            In Giấy Chứng Nhận (Print / Save PDF)
          </button>
        </div>

        <div class="border-frame">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
              <td style="width: 45%; text-align: center; vertical-align: top;">
                <div class="hospital">BỆNH VIỆN ĐA KHOA TRUNG TÂM</div>
                <div class="committee">HỘI ĐỒNG ĐẠO ĐỨC TRONG NGHIÊN CỨU Y SINH HỌC (IRB)</div>
              </td>
              <td style="width: 55%; text-align: center; vertical-align: top;">
                <div class="national">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style="font-weight: bold; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</div>
                <div style="font-style: italic; font-size: 10pt; margin-top: 4px;">Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</div>
              </td>
            </tr>
          </table>

          <div class="title">GIẤY CHỨNG NHẬN CHẤP THUẬN ĐẠO ĐỨC</div>
          <div class="cert-num">Số Giấy phép: <strong>${certNumber}</strong> / GCN-HĐĐĐ</div>

          <div class="content-block">
            Căn cứ <strong>Thông tư số 43/2024/TT-BYT</strong> ngày 31/12/2024 của Bộ Y tế quy định về thử nghiệm lâm sàng và hoạt động của Hội đồng Đạo đức trong nghiên cứu y sinh học;<br/>
            Căn cứ Biên bản họp Hội đồng Đạo đức trong Nghiên cứu Y sinh học Bệnh viện Đa khoa Trung tâm;
          </div>

          <div class="content-block" style="background: #F8FAFC; padding: 15px; border-left: 4px solid #0A6EBD;">
            <p><strong>1. Tên đề tài:</strong> <span class="highlight">${project.title}</span></p>
            <p><strong>2. Mã số hồ sơ:</strong> ${project.projectCode || project.proposalCode}</p>
            <p><strong>3. Chủ nhiệm đề tài:</strong> <span class="highlight">${project.principalInvestigatorName}</span></p>
            <p><strong>4. Đơn vị thực hiện:</strong> ${project.departmentName} - Bệnh viện Đa khoa Trung tâm</p>
            <p><strong>5. Kết luận thẩm định:</strong> Hồ sơ nghiên cứu tuân thủ đầy đủ các nguyên tắc đạo đức y sinh theo Tuyên ngôn Helsinki, đảm bảo an toàn, bảo mật thông tin và quyền lợi của người bệnh tham gia nghiên cứu.</p>
          </div>

          <div class="content-block">
            <p><strong>Thời hạn hiệu lực:</strong> Từ ngày cấp đến hết ngày <strong>${formatDate(project.endDate)}</strong>.</p>
          </div>

          <table style="width: 100%; margin-top: 30px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div class="stamp-box">
                  <strong>CHỨNG THỰC ĐIỆN TỬ</strong><br/>
                  Hội đồng Đạo đức Y sinh<br/>
                  Bệnh viện Đa khoa Trung tâm<br/>
                  <em>(Đã xác thực chữ ký số)</em>
                </div>
              </td>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <strong>TM. HỘI ĐỒNG ĐẠO ĐỨC TRONG NCKH Y SINH</strong><br/>
                <strong>CHỦ TỊCH HỘI ĐỒNG</strong><br/>
                <em>(Ký, đóng dấu)</em>
                <br/><br/><br/><br/>
                <strong>PGS.TS.BS. NGUYỄN VĂN QUÂN</strong>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  },

  /**
   * 3. Xuất Biên bản Họp Hội đồng Xét duyệt / Nghiệm thu (BM-HĐ-02 / BM-NT-02)
   */
  exportCouncilMinutesDocx(councilName: string, councilCode: string, projectTitle: string, piName: string, result: string, conclusion: string) {
    const filename = `BM-HD-02_Bien-ban-hop-Hoi-dong_${councilCode}.doc`;

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>BIÊN BẢN HỌP HỘI ĐỒNG KHOA HỌC</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { vertical-align: top; text-align: center; font-size: 11pt; }
          .title { text-align: center; font-weight: bold; font-size: 16pt; margin: 20px 0; color: #0B2A63; }
          .box { border: 1px solid #999; padding: 12px; margin: 15px 0; background-color: #F8FAFC; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 45%;">
              BỆNH VIỆN ĐA KHOA TRUNG TÂM<br/>
              <strong>HỘI ĐỒNG KHOA HỌC & CÔNG NGHỆ</strong><br/>
              Số: ${councilCode}/BB-HĐKH
            </td>
            <td style="width: 55%;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
              <em>Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
            </td>
          </tr>
        </table>

        <div class="title">BIÊN BẢN HỌP HỘI ĐỒNG KHOA HỌC XÉT DUYỆT</div>

        <p><strong>1. Hội đồng:</strong> ${councilName} (Mã: ${councilCode})</p>
        <p><strong>2. Đề tài đánh giá:</strong> ${projectTitle}</p>
        <p><strong>3. Chủ nhiệm đề tài:</strong> ${piName}</p>
        
        <div class="box">
          <p><strong>4. Kết quả biểu quyết của Hội đồng:</strong> 
            <span style="color: #0A6EBD; font-weight: bold;">
              ${result === 'APPROVED' ? 'THÔNG QUA (ĐẠT)' : result === 'REVISION' ? 'THÔNG QUA CÓ CHỈNH SỬA, BỔ SUNG' : 'KHÔNG THÔNG QUA'}
            </span>
          </p>
          <p><strong>5. Kết luận và nội dung yêu cầu hoàn thiện:</strong></p>
          <p style="text-align: justify; font-style: italic;">"${conclusion}"</p>
        </div>

        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <strong>THƯ KÝ HỘI ĐỒNG</strong><br/><em>(Ký, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
            </td>
            <td style="width: 50%; text-align: center;">
              <strong>CHỦ TỊCH HỘI ĐỒNG</strong><br/><em>(Ký, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    downloadBlob(filename, content, 'application/msword;charset=utf-8');
  },

  /**
   * 4. Tải file mẫu trống theo định dạng tương ứng
   */
  downloadBlankTemplate(template: MedicalTemplate) {
    if (template.format === 'EXCEL') {
      const csvContent = `\uFEFFMÃ BIỂU MẪU;TÊN BIỂU MẪU;CĂN CỨ PHÁP LÝ;PHIÊN BẢN\n${template.code};${template.name};${template.legalRef};${template.templateVersion}\n\nSTT;HẠNG MỤC CHI;ĐƠN VỊ TÍNH;SỐ LƯỢNG;ĐƠN GIÁ (VNĐ);THÀNH TIỀN (VNĐ);GHI CHÚ\n1;Thù lao công lao động khoa học;Tháng;12;5000000;60000000;Khoa lâm sàng\n2;Mua sắm hóa chất, sinh phẩm, kit test;Bộ;50;800000;40000000;Phòng xét nghiệm\n3;Thu thập và xử lý bệnh án nghiên cứu (CRF);Bệnh án;100;150000;15000000;Khoa HSTC\n4;Hội thảo khoa học & Báo cáo kết quả;Buổi;2;10000000;20000000;Hội trường BV\n;TỔNG KINH PHÍ DỰ TOÁN;;;;135000000;`;
      downloadBlob(template.downloadFileName.replace('.xlsx', '.csv'), csvContent, 'text/csv;charset=utf-8');
    } else {
      const sampleDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset="utf-8"><title>${template.name}</title></head>
        <body style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 11pt;">BỘ Y TẾ - BỆNH VIỆN ĐA KHOA TRUNG TÂM</p>
            <p style="margin: 0; font-weight: bold; font-size: 12pt;">HỘI ĐỒNG KHOA HỌC & CÔNG NGHỆ</p>
            <p style="margin: 5px 0 0 0; font-size: 10pt; font-style: italic;">Căn cứ: ${template.legalRef}</p>
          </div>
          <h2 style="text-align: center; color: #0B2A63; text-transform: uppercase;">${template.name}</h2>
          <p style="text-align: center; font-weight: bold; color: #0A6EBD;">Mã biểu mẫu: ${template.code} (${template.templateVersion})</p>
          <hr/>
          <div style="margin: 20px 0;">
            <p><strong>Mục đích:</strong> ${template.description}</p>
            <p><strong>Cấu trúc nội dung chính:</strong></p>
            <ul>
              ${template.previewSummary.map((s) => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          <div style="margin-top: 40px; text-align: right;">
            <em>Hà Nội, ngày ..... tháng ..... năm 2026</em><br/>
            <strong>ĐẠI DIỆN ĐƠN VỊ THỰC HIỆN</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em>
          </div>
        </body>
        </html>
      `;
      downloadBlob(template.downloadFileName, sampleDoc, 'application/msword;charset=utf-8');
    }
  },
};
