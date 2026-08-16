import { repo } from '@/lib/repository';
import type { Council, CouncilConclusion, EvaluationResult, MeetingMinutes } from '@/lib/types';

function formatDateVi(value?: string) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function conclusionLabel(type: string, conclusion: CouncilConclusion) {
  if (type === 'ACCEPTANCE') {
    if (conclusion === 'APPROVED') return 'Đạt nghiệm thu';
    if (conclusion === 'APPROVED_WITH_REVISION') return 'Đạt, yêu cầu hoàn thiện';
    if (conclusion === 'RE_EVALUATE') return 'Đánh giá lại';
    return 'Không đạt nghiệm thu';
  }

  if (conclusion === 'APPROVED') return 'Thông qua đề cương';
  if (conclusion === 'APPROVED_WITH_REVISION') return 'Thông qua, yêu cầu chỉnh sửa';
  if (conclusion === 'RE_EVALUATE') return 'Đánh giá lại';
  return 'Không thông qua';
}

export function exportCouncilMinutesToWord(
  council: Council,
  meetingMinutes: MeetingMinutes,
  allResults: EvaluationResult[]
) {
  const resultSections = meetingMinutes.projectResults
    .map((result, index) => {
      const project = repo.getProjectById(result.projectId);
      const evaluations = allResults.filter(
        (evaluation) => evaluation.projectId === result.projectId && evaluation.status === 'SIGNED'
      );
      const rows = evaluations
        .map(
          (evaluation, rowIndex) => `<tr>
            <td style="text-align:center">${rowIndex + 1}</td>
            <td>${evaluation.councilMemberName}</td>
            <td style="text-align:center">${evaluation.totalScore.toFixed(1)}</td>
            <td>${evaluation.voteResult === 'APPROVE' ? 'Đạt' : evaluation.voteResult === 'APPROVE_WITH_REVISION' ? 'Đạt, cần chỉnh sửa' : 'Không đạt'}</td>
          </tr>`
        )
        .join('');

      return `<h3>${index + 1}. ${project?.title || result.projectId}</h3>
        <p><strong>Mã:</strong> ${project?.projectCode || project?.proposalCode || result.projectId}</p>
        <p><strong>Chủ nhiệm:</strong> ${project?.principalInvestigatorName || ''}</p>
        <table><thead><tr><th>STT</th><th>Thành viên</th><th>Điểm</th><th>Kết luận phiếu</th></tr></thead><tbody>${rows}</tbody></table>
        <p><strong>Điểm trung bình:</strong> ${result.averageScore === undefined ? '—' : result.averageScore.toFixed(1)}</p>
        <p><strong>Kết luận:</strong> ${conclusionLabel(council.type, result.conclusion)}</p>
        <p><strong>Ý kiến Hội đồng:</strong> ${result.summaryOpinion}</p>
        ${result.revisionRequirements ? `<p><strong>Yêu cầu hoàn thiện:</strong> ${result.revisionRequirements}</p>` : ''}`;
    })
    .join('<hr/>');

  const htmlContent = `<!doctype html><html><head><meta charset="utf-8" />
    <style>body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.35}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #000;padding:6px}h2{text-align:center}.sign td{border:0;text-align:center;width:50%;vertical-align:top;padding-top:28px}</style>
    </head><body>
    <p><strong>BỆNH VIỆN ĐA KHOA TRUNG TÂM</strong></p>
    <h2>BIÊN BẢN HỌP HỘI ĐỒNG ${council.type === 'ACCEPTANCE' ? 'NGHIỆM THU ĐỀ TÀI' : 'XÉT DUYỆT ĐỀ CƯƠNG'}</h2>
    <p><strong>Hội đồng:</strong> ${council.name}</p>
    <p><strong>Thời gian:</strong> ${council.meetingTime || ''} ngày ${formatDateVi(council.meetingDate)}</p>
    <p><strong>Địa điểm:</strong> ${council.location}</p>
    <p><strong>Thành viên tham dự:</strong> ${meetingMinutes.attendance.filter((item) => item.attended).length}/${council.members.length}</p>
    <p><strong>Tóm tắt diễn biến:</strong> ${meetingMinutes.summaryOpinions}</p>
    ${resultSections}
    <table class="sign"><tr><td><strong>THƯ KÝ HỘI ĐỒNG</strong><br/><br/><br/>${meetingMinutes.secretaryName}</td><td><strong>CHỦ TỊCH HỘI ĐỒNG</strong><br/><br/><br/>${meetingMinutes.chairName}</td></tr></table>
    </body></html>`;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bien_ban_hop_${council.code}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
