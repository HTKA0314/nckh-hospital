'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { RegistrationRound } from '@/lib/types';
import { formatVND } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  Clock,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  DollarSign,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  Printer,
  Building2,
  Eye,
  X,
  Filter,
} from 'lucide-react';

export default function RegistrationRoundsPage() {
  const { currentUser, switchRole } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const [rounds, setRounds] = useState<RegistrationRound[]>(repo.getRounds());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [selectedRoundDetail, setSelectedRoundDetail] = useState<RegistrationRound | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [roundCode, setRoundCode] = useState('');
  const [roundName, setRoundName] = useState('');
  const [roundYear, setRoundYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [maxBudget, setMaxBudget] = useState(150000000);
  const [description, setDescription] = useState('');

  const canManage =
    currentUser.role === 'RESEARCH_OFFICE' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'DIRECTOR';

  // Chuyển đổi trạng thái đóng/mở đợt có xác nhận
  const handleToggleStatus = (round: RegistrationRound) => {
    const nextStatus = round.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const isClosing = nextStatus === 'CLOSED';

    confirm({
      title: isClosing ? 'Xác nhận đóng đợt đăng ký' : 'Xác nhận mở lại đợt đăng ký',
      message: isClosing
        ? `Bạn có chắc chắn muốn đóng đợt đăng ký "${round.name}" (${round.code})? Sau khi đóng, các cán bộ/bác sĩ sẽ không thể nộp thêm hồ sơ mới vào đợt này.`
        : `Bạn có muốn mở lại đợt đăng ký "${round.name}" (${round.code}) để tiếp tục nhận hồ sơ?`,
      confirmLabel: isClosing ? 'Đóng đợt đăng ký' : 'Mở lại đợt',
      type: isClosing ? 'danger' : 'info',
      onConfirm: () => {
        const updated = repo.updateRound(round.id, { status: nextStatus });
        if (updated) {
          setRounds(repo.getRounds());
          success(
            isClosing
              ? `Đã đóng đợt đăng ký ${round.code} thành công!`
              : `Đã mở lại đợt đăng ký ${round.code} thành công!`
          );
        } else {
          error('Không thể cập nhật trạng thái đợt đăng ký');
        }
      },
    });
  };

  // Tạo đợt mới
  const handleCreateRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundCode.trim() || !roundName.trim()) {
      warning('Vui lòng nhập đầy đủ Mã đợt và Tên đợt đăng ký', 'Thiếu thông tin');
      return;
    }

    const newRound: RegistrationRound = {
      id: `round-${Date.now()}`,
      code: roundCode.toUpperCase().trim(),
      name: roundName.trim(),
      year: Number(roundYear),
      startDate,
      endDate,
      targetAudience: 'Toàn thể Bác sĩ, Dược sĩ, Điều dưỡng và Cán bộ y tế',
      maxBudget: Number(maxBudget),
      status: 'OPEN',
      description: description || 'Đợt đăng ký đề tài nghiên cứu khoa học cấp cơ sở.',
      totalSubmissions: 0,
    };

    repo.createRound(newRound);
    setRounds(repo.getRounds());
    success(`Đã tạo đợt đăng ký mới ${newRound.code} thành công!`);
    setShowCreateModal(false);
    setRoundCode('');
    setRoundName('');
    setDescription('');
  };

  // Filtered rounds
  const filteredRounds = rounds.filter((r) => {
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchKw =
      searchKeyword.trim() === '' ||
      r.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchStatus && matchKw;
  });

  const pagedRounds = filteredRounds.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters = filterStatus !== 'ALL' || searchKeyword.trim();

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── Toolbar: Search + Actions trên 1 hàng ── */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã hoặc tên đợt đăng ký..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-[13px] outline-none bg-white shadow-xs"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" /> In danh mục
        </button>

        {canManage ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold px-3.5 py-2 rounded-lg text-[13px] shadow-xs transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm đợt đăng ký mới
          </button>
        ) : (
          <button
            onClick={() => switchRole('RESEARCH_OFFICE')}
            className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-[#0A6EBD] font-semibold px-3.5 py-2 rounded-lg text-[13px] border border-sky-200 transition whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Quản trị đợt
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className={`py-1.5 px-3 rounded-lg border text-[13px] font-medium outline-none transition ${
            filterStatus !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả trạng thái đợt</option>
          <option value="OPEN">Đang mở tiếp nhận</option>
          <option value="CLOSED">Đã đóng đợt</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setFilterStatus('ALL'); setSearchKeyword(''); }}
            className="text-[12px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filteredRounds.length}</strong> / {rounds.length} đợt đăng ký
        </span>
      </div>

      {/* 3. BẢNG DỮ LIỆU ĐỢT ĐĂNG KÝ (Đồng nhất, rõ ràng) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 w-32 whitespace-nowrap">MÃ ĐỢT</th>
                <th className="px-5 py-3 min-w-[300px]">TÊN ĐỢT ĐĂNG KÝ & MÔ TẢ</th>
                <th className="px-5 py-3 w-36 whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-5 py-3 w-48 whitespace-nowrap">THỜI GIAN TIẾP NHẬN</th>
                <th className="px-5 py-3 text-right w-36 whitespace-nowrap">ĐỊNH MỨC KINH PHÍ</th>
                <th className="px-5 py-3 text-center w-24 whitespace-nowrap">ĐÃ NỘP</th>
                <th className="px-5 py-3 text-center w-36 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRounds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Không tìm thấy đợt đăng ký nào phù hợp.
                  </td>
                </tr>
              ) : (
                pagedRounds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    {/* Mã đợt */}
                    <td className="px-5 py-3.5 font-mono font-bold text-xs text-[#0A6EBD] whitespace-nowrap align-middle">
                      <button
                        onClick={() => setSelectedRoundDetail(r)}
                        className="hover:underline font-mono text-left"
                      >
                        {r.code}
                      </button>
                    </td>

                    {/* Tên & Mô tả */}
                    <td className="px-5 py-3.5 align-middle">
                      <button
                        onClick={() => setSelectedRoundDetail(r)}
                        className="font-semibold text-slate-900 hover:text-[#0A6EBD] transition text-left line-clamp-1 leading-snug"
                      >
                        {r.name}
                      </button>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{r.description}</p>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${r.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                      >
                        {r.status === 'OPEN' ? 'Đang mở tiếp nhận' : 'Đã đóng đợt'}
                      </span>
                    </td>

                    {/* Thời gian tiếp nhận */}
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap align-middle">
                      {r.startDate} → {r.endDate}
                    </td>

                    {/* Định mức kinh phí */}
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap align-middle text-right">
                      {formatVND(r.maxBudget)}
                    </td>

                    {/* Đã nộp */}
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-[#0A6EBD] align-middle">
                      {r.totalSubmissions || 0}
                    </td>

                    {/* Thao tác (Eye & Lock/Unlock) */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Nút Xem chi tiết (Eye) */}
                        <button
                          onClick={() => setSelectedRoundDetail(r)}
                          title="Xem chi tiết đợt đăng ký"
                          className="p-1.5 rounded-lg bg-[#EBF4FC] hover:bg-[#D8ECF9] text-[#0A6EBD] border border-[#B8D7F5] transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Nút Đăng ký nhanh nếu đang mở */}
                        {r.status === 'OPEN' && (
                          <Link
                            href="/projects/register"
                            title="Nộp đề tài vào đợt này"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                          >
                            <Plus className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Nút Khóa / Mở đợt cho Quản lý */}
                        {canManage && (
                          <button
                            onClick={() => handleToggleStatus(r)}
                            title={r.status === 'OPEN' ? 'Đóng tiếp nhận hồ sơ đợt này' : 'Mở lại tiếp nhận hồ sơ'}
                            className={`p-1.5 rounded-lg border transition ${r.status === 'OPEN'
                                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-600'
                                : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-[#0A6EBD]'
                              }`}
                          >
                            {r.status === 'OPEN' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredRounds.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="đợt đăng ký"
      />

      {/* 4. MODAL CHI TIẾT ĐỢT ĐĂNG KÝ */}
      {selectedRoundDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="font-mono font-bold text-xs bg-[#EBF4FC] text-[#0A6EBD] px-2 py-0.5 rounded border border-[#B8D7F5] mr-2">
                  {selectedRoundDetail.code}
                </span>
                <span className="font-bold text-slate-800 text-sm">Chi tiết đợt đăng ký NCKH</span>
              </div>
              <button
                onClick={() => setSelectedRoundDetail(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="text-slate-400 block mb-0.5">Tên đợt đăng ký:</label>
                <p className="font-bold text-slate-900 text-sm">{selectedRoundDetail.name}</p>
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Mô tả & Định hướng ưu tiên:</label>
                <p className="p-2.5 bg-[#F8FAFC] rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                  {selectedRoundDetail.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Thời gian mở - đóng:</span>
                  <p className="font-mono font-semibold text-slate-900 mt-1">
                    {selectedRoundDetail.startDate} → {selectedRoundDetail.endDate}
                  </p>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Định mức kinh phí tối đa:</span>
                  <p className="font-mono font-bold text-slate-900 mt-1">
                    {formatVND(selectedRoundDetail.maxBudget)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Trạng thái tiếp nhận:</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border mt-1 ${selectedRoundDetail.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                  >
                    {selectedRoundDetail.status === 'OPEN' ? 'Đang mở tiếp nhận' : 'Đã đóng đợt'}
                  </span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Số lượng hồ sơ đã nộp:</span>
                  <p className="font-mono font-bold text-[#0A6EBD] text-base mt-0.5">
                    {selectedRoundDetail.totalSubmissions || 0} hồ sơ
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRoundDetail(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition"
              >
                Đóng
              </button>
              {selectedRoundDetail.status === 'OPEN' && (
                <Link
                  href="/projects/register"
                  className="px-4 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Nộp đề tài ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL THÊM ĐỢT ĐĂNG KÝ MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-lg w-full shadow-xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Thêm kế hoạch đợt đăng ký mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRound} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mã đợt (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: DOT-2026-02"
                    value={roundCode}
                    onChange={(e) => setRoundCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono outline-none focus:ring-1 focus:ring-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Năm kế hoạch</label>
                  <input
                    type="number"
                    value={roundYear}
                    onChange={(e) => setRoundYear(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono outline-none focus:ring-1 focus:ring-[#0A6EBD]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên đợt đăng ký (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đợt đăng ký Đề tài NCKH Cấp cơ sở Đợt 2 Năm 2026"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0A6EBD]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Định mức kinh phí tối đa (VND)</label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả & Định hướng ưu tiên</label>
                <textarea
                  rows={2}
                  placeholder="Ưu tiên các đề tài cải tiến quy trình lâm sàng, ứng dụng kỹ thuật mới..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg text-xs font-semibold shadow-2xs"
                >
                  Tạo đợt mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
