'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import {
  Save,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  FolderKanban,
  ExternalLink,
} from 'lucide-react';
import { repo } from '@/lib/repository';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { success, warning, confirm } = useToast();
  const [activeTab, setActiveTab] = useState<'FIELDS' | 'DEPTS' | 'CONFIG'>('FIELDS');

  const isAdmin = ['ADMIN', 'RESEARCH_OFFICE', 'DIRECTOR'].includes(currentUser.role);

  // ── Lĩnh vực nghiên cứu ──
  const [researchFields, setResearchFields] = useState([
    { id: '1', code: 'LÂM SÀNG',     name: 'Nghiên cứu Y học Lâm sàng & Can thiệp' },
    { id: '2', code: 'CẬN LÂM SÀNG', name: 'Nghiên cứu Cận lâm sàng & Chẩn đoán hình ảnh' },
    { id: '3', code: 'DƯỢC',         name: 'Nghiên cứu Dược lâm sàng & Dược lý bệnh viện' },
    { id: '4', code: 'ĐIỀU DƯỠNG',   name: 'Nghiên cứu Chăm sóc & Điều dưỡng' },
    { id: '5', code: 'QUẢN LÝ Y TẾ', name: 'Nghiên cứu Quản lý Bệnh viện & Kinh tế Y tế' },
  ]);
  const [editFieldId, setEditFieldId] = useState<string | null>(null);
  const [editFieldName, setEditFieldName] = useState('');
  const [newFieldCode, setNewFieldCode] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  const handleAddField = () => {
    if (!newFieldCode.trim() || !newFieldName.trim()) {
      warning('Vui lòng nhập đầy đủ Mã định danh và Tên lĩnh vực', 'Thiếu thông tin');
      return;
    }
    const isDup = researchFields.some((f) => f.code.toUpperCase() === newFieldCode.trim().toUpperCase());
    if (isDup) {
      warning('Mã định danh lĩnh vực đã tồn tại trong danh mục', 'Trùng mã');
      return;
    }
    setResearchFields([
      ...researchFields,
      { id: String(Date.now()), code: newFieldCode.trim().toUpperCase(), name: newFieldName.trim() },
    ]);
    success(`Đã thêm lĩnh vực "${newFieldName.trim()}" vào danh mục`);
    setNewFieldCode('');
    setNewFieldName('');
    setShowAddField(false);
  };

  const handleSaveEditField = (id: string) => {
    if (!editFieldName.trim()) {
      warning('Tên lĩnh vực không được để trống', 'Thiếu thông tin');
      return;
    }
    setResearchFields(researchFields.map((f) => f.id === id ? { ...f, name: editFieldName.trim() } : f));
    success('Đã cập nhật tên lĩnh vực nghiên cứu');
    setEditFieldId(null);
  };

  const handleDeleteField = (id: string, name: string) => {
    confirm({
      title: 'Xác nhận xóa lĩnh vực nghiên cứu',
      message: `Bạn có chắc chắn muốn xóa lĩnh vực "${name}" khỏi danh mục? Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa lĩnh vực',
      type: 'danger',
      onConfirm: () => {
        setResearchFields(researchFields.filter((f) => f.id !== id));
        success(`Đã xóa lĩnh vực "${name}" khỏi danh mục`);
      },
    });
  };

  const handleSaveAll = () => {
    success('Đã lưu toàn bộ cấu hình danh mục hệ thống thành công!');
  };

  // ── Khoa / Phòng từ repo ──
  const departments = repo.getDepartments();

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800">
      {/* ── Toolbar: Tabs + Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
          {([
            { key: 'FIELDS', label: 'Lĩnh vực nghiên cứu' },
            { key: 'DEPTS',  label: `Danh mục Khoa/Phòng (${departments.length})` },
            { key: 'CONFIG', label: 'Quy chuẩn & Biểu mẫu' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === t.key
                  ? 'bg-sky-50 text-[#0A6EBD] border border-sky-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#0A6EBD]" /> Xem Kho Biểu Mẫu
          </Link>

          {isAdmin && (
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white text-[13px] font-semibold shadow-xs transition whitespace-nowrap cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Lưu cấu hình
            </button>
          )}
        </div>
      </div>

      {/* Tab: Lĩnh vực nghiên cứu */}
      {activeTab === 'FIELDS' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Danh mục các lĩnh vực nghiên cứu y khoa</h3>
            {isAdmin && (
              <button
                onClick={() => setShowAddField(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0A6EBD] text-white rounded-lg text-xs font-semibold hover:bg-[#085896] transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm lĩnh vực mới
              </button>
            )}
          </div>

          {showAddField && (
            <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg animate-in fade-in">
              <input
                type="text"
                placeholder="Mã VD: Y_HỌC_GEN"
                value={newFieldCode}
                onChange={(e) => setNewFieldCode(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs w-36 outline-none focus:ring-1 focus:ring-[#0A6EBD] bg-white font-mono uppercase"
              />
              <input
                type="text"
                placeholder="Tên lĩnh vực nghiên cứu..."
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0A6EBD] bg-white font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
              />
              <button
                onClick={handleAddField}
                className="p-1.5 bg-[#0A6EBD] text-white rounded hover:bg-[#085896] transition cursor-pointer"
                title="Xác nhận thêm"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setShowAddField(false); setNewFieldCode(''); setNewFieldName(''); }}
                className="p-1.5 bg-white border border-slate-300 text-slate-500 rounded hover:bg-slate-100 transition cursor-pointer"
                title="Hủy bỏ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-semibold select-none">
                <tr>
                  <th className="p-2.5 w-12 text-center">STT</th>
                  <th className="p-2.5 w-36">Mã định danh</th>
                  <th className="p-2.5">Tên lĩnh vực nghiên cứu y khoa</th>
                  {isAdmin && <th className="p-2.5 w-24 text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {researchFields.map((f, idx) => (
                  <tr key={f.id} className="hover:bg-slate-50 group">
                    <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-[#0A6EBD]">{f.code}</td>
                    <td className="p-2.5">
                      {editFieldId === f.id ? (
                        <input
                          autoFocus
                          value={editFieldName}
                          onChange={(e) => setEditFieldName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditField(f.id)}
                          className="w-full px-2 py-1 border border-[#0A6EBD] rounded text-xs outline-none bg-white font-medium"
                        />
                      ) : (
                        <span className="font-medium text-slate-900">{f.name}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {editFieldId === f.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEditField(f.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                title="Lưu thay đổi"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditFieldId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditFieldId(f.id); setEditFieldName(f.name); }}
                                className="p-1 text-slate-400 hover:text-[#0A6EBD] rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                title="Sửa tên lĩnh vực"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteField(f.id, f.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                title="Xóa lĩnh vực"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Khoa / Phòng */}
      {activeTab === 'DEPTS' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Danh mục Khoa / Phòng ({departments.length} đơn vị)
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded font-mono">
              Đồng bộ từ HIS
            </span>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-semibold select-none">
                <tr>
                  <th className="p-2.5 w-12 text-center">STT</th>
                  <th className="p-2.5 w-24">Mã</th>
                  <th className="p-2.5">Tên Khoa / Phòng</th>
                  <th className="p-2.5 w-32">Phân loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((d: any, idx: number) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-[#0A6EBD]">{d.code}</td>
                    <td className="p-2.5 font-medium text-slate-900">{d.name}</td>
                    <td className="p-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        d.type === 'CLINICAL'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : d.type === 'SUB_CLINICAL'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {d.type === 'CLINICAL' ? 'Lâm sàng'
                          : d.type === 'SUB_CLINICAL' ? 'Cận lâm sàng'
                          : 'Phòng chức năng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 text-center select-none">
            Danh mục Khoa / Phòng được đồng bộ tự động từ hệ thống HIS. Liên hệ Quản trị viên để cập nhật.
          </p>
        </div>
      )}

      {/* Tab: Quy định & Biểu mẫu */}
      {activeTab === 'CONFIG' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Quy chuẩn Biểu mẫu NCKH Y tế</h3>
              <p className="text-xs text-slate-500 mt-0.5">Áp dụng Thông tư 09/2024/TT-BYT & Thông tư 43/2024/TT-BYT (IRB)</p>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1 text-xs text-[#0A6EBD] font-semibold hover:underline"
            >
              Mở Kho biểu mẫu đầy đủ <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { code: 'BM-ĐK-01', name: 'Đơn đăng ký đề tài NCKH cấp cơ sở', ref: 'Thông tư 09/2024/TT-BYT – Mẫu ĐK-01', active: true },
              { code: 'BM-TM-01', name: 'Thuyết minh đề cương nghiên cứu y sinh học', ref: 'Thông tư 09/2024/TT-BYT – Mẫu TM-01', active: true },
              { code: 'BM-KP-01', name: 'Bảng dự toán chi tiết kinh phí đề tài NCKH', ref: 'Thông tư 09/2024/TT-BYT – Mẫu KP-01', active: true },
              { code: 'BM-HĐ-01', name: 'Phiếu nhận xét / Thẩm định đề cương', ref: 'Thông tư 09/2024/TT-BYT – Mẫu HĐ-01', active: true },
              { code: 'BM-HĐ-02', name: 'Biên bản họp Hội đồng xét duyệt đề cương', ref: 'Thông tư 09/2024/TT-BYT – Mẫu HĐ-02', active: true },
              { code: 'BM-IRB-01', name: 'Hồ sơ & Phiếu thẩm định Đạo đức trong nghiên cứu y sinh', ref: 'Thông tư 43/2024/TT-BYT (IRB)', active: true },
              { code: 'BM-TĐ-01', name: 'Báo cáo tiến độ định kỳ (6 tháng / 12 tháng)', ref: 'Thông tư 09/2024/TT-BYT – Mẫu TĐ-01', active: true },
              { code: 'BM-NT-02', name: 'Biên bản họp Hội đồng nghiệm thu chính thức', ref: 'Thông tư 09/2024/TT-BYT – Mẫu NT-02', active: true },
            ].map((m) => (
              <div key={m.code} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                <div>
                  <span className="font-mono font-bold text-[#0A6EBD] text-[11px]">{m.code}</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{m.name}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{m.ref}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 ml-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    m.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {m.active ? 'Đang dùng' : 'Tạm dừng'}
                  </span>
                  <Link
                    href="/templates"
                    className="text-[10px] text-[#0A6EBD] font-semibold hover:underline"
                  >
                    Xem mẫu →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}