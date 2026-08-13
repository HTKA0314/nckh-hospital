'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MEDICAL_TEMPLATES_DATA,
  MedicalTemplate,
} from '@/lib/mock-data/templates-data';
import { DocxExportService } from '@/lib/services/docx-export-service';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import {
  Download,
  Search,
  Eye,
  ShieldCheck,
  Printer,
  X,
  List,
  LayoutGrid,
  CheckCircle2,
  FolderDown,
  Filter,
} from 'lucide-react';

export default function TemplatesPage() {
  const { info } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedLegalRef, setSelectedLegalRef] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<MedicalTemplate | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Lọc danh sách biểu mẫu
  const filteredTemplates = MEDICAL_TEMPLATES_DATA.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (selectedFormat !== 'ALL' && t.format !== selectedFormat) return false;
    if (selectedLegalRef !== 'ALL' && !t.legalRef.includes(selectedLegalRef)) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.legalRef.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pagedTemplates = filteredTemplates.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasFilters =
    selectedCategory !== 'ALL' ||
    selectedFormat !== 'ALL' ||
    selectedLegalRef !== 'ALL' ||
    searchTerm.trim() !== '';

  const handleDownload = (template: MedicalTemplate) => {
    DocxExportService.downloadBlankTemplate(template);
  };

  const handleDownloadAll = () => {
    info('Đang nén và chuẩn bị tải xuống trọn bộ Biểu mẫu NCKH Y tế chuẩn Thông tư 09/2024 & TT 43/2024...');
  };

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 select-none">
        <div>
          <h1 className="text-base font-bold text-slate-800">Kho tài liệu & Biểu mẫu</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Hệ thống biểu mẫu, văn bản hướng dẫn và căn cứ pháp lý về hoạt động Nghiên cứu Khoa học
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-slate-50 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0A6EBD] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ Thẻ (Grid View)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0A6EBD] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ Bảng (Table View)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> In danh mục
          </button>

          <button
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white text-[13px] font-semibold shadow-xs transition whitespace-nowrap cursor-pointer"
          >
            <FolderDown className="w-4 h-4" /> Tải Trọn Bộ (ZIP)
          </button>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm biểu mẫu, mã số..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] text-xs outline-none bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PROPOSAL', label: 'Đăng ký & Thuyết minh' },
            { id: 'ETHICS', label: 'Đạo đức IRB' },
            { id: 'COUNCIL', label: 'Hội đồng' },
            { id: 'PROGRESS_FINANCE', label: 'Tiến độ & Tài chính' },
            { id: 'ACCEPTANCE', label: 'Nghiệm thu' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-sky-50 text-[#0A6EBD] border border-sky-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200 hidden lg:block" />

        {/* Format Selector */}
        <select
          value={selectedFormat}
          onChange={(e) => {
            setSelectedFormat(e.target.value);
            setCurrentPage(1);
          }}
          className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium outline-none transition cursor-pointer ${
            selectedFormat !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Định dạng: Tất cả</option>
          <option value="WORD">Microsoft Word (.docx)</option>
          <option value="EXCEL">Microsoft Excel (.xlsx)</option>
          <option value="PDF">Tài liệu PDF (.pdf)</option>
        </select>

        {/* Legal Ref Selector */}
        <select
          value={selectedLegalRef}
          onChange={(e) => {
            setSelectedLegalRef(e.target.value);
            setCurrentPage(1);
          }}
          className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold outline-none transition cursor-pointer ${
            selectedLegalRef !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Căn cứ: Tất cả</option>
          <option value="37/2010">TT 37/2010/TT-BYT</option>
          <option value="14/2014">TT 14/2014/TT-BKHCN</option>
          <option value="03/2017">TT 03/2017/TT-BKHCN</option>
          <option value="11/2014">TT 11/2014/TT-BKHCN</option>
          <option value="04/2015">TT 04/2015/TT-BKHCN</option>
          <option value="43/2024">TT 43/2024/TT-BYT</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedFormat('ALL');
              setSelectedLegalRef('ALL');
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 transition shadow-2xs cursor-pointer"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filteredTemplates.length}</strong> / {MEDICAL_TEMPLATES_DATA.length} biểu mẫu
        </span>
      </div>

      {/* ── GRID VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium">
              Không tìm thấy biểu mẫu nào phù hợp với điều kiện tìm kiếm.
            </div>
          ) : (
            pagedTemplates.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between hover:border-sky-300 hover:shadow-sm transition group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#0A6EBD] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
                      {item.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        item.format === 'WORD'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.format === 'EXCEL'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.format}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#0A6EBD] transition line-clamp-2">
                    {item.name}
                  </h3>

                  <p className="text-[12px] text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-1.5 border-t border-slate-100">
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Căn cứ: <strong>{item.legalRef}</strong></span>
                    </p>
                    <p className="text-slate-400">
                      Phiên bản: <strong className="text-slate-600 font-mono">{item.templateVersion}</strong> • Cập nhật: {item.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewTemplate(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0A6EBD] transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem trước
                  </button>

                  <button
                    onClick={() => handleDownload(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A6EBD] hover:bg-[#085999] rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải về ({item.format})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-32 whitespace-nowrap">MÃ BIỂU MẪU</th>
                  <th className="px-4 py-3 min-w-[320px]">TÊN BIỂU MẪU & MÔ TẢ</th>
                  <th className="px-4 py-3 w-48 whitespace-nowrap">NHÓM NGHIỆP VỤ</th>
                  <th className="px-4 py-3 w-56 whitespace-nowrap">CĂN CỨ PHÁP LÝ</th>
                  <th className="px-4 py-3 w-36 text-center whitespace-nowrap">ĐỊNH DẠNG</th>
                  <th className="px-4 py-3 w-32 text-center whitespace-nowrap">CẬP NHẬT</th>
                  <th className="px-4 py-3 text-center w-36 whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      Không tìm thấy biểu mẫu nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  pagedTemplates.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0A6EBD] whitespace-nowrap align-middle">
                        {item.code}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <button
                          onClick={() => setPreviewTemplate(item)}
                          className="font-semibold text-slate-900 hover:text-[#0A6EBD] text-left line-clamp-1 cursor-pointer"
                        >
                          {item.name}
                        </button>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap align-middle">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.categoryLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {item.legalRef}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            item.format === 'WORD'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.format === 'EXCEL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.format} • {item.size}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-500 whitespace-nowrap align-middle">
                        {item.updatedAt}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPreviewTemplate(item)}
                            className="p-1.5 text-slate-600 hover:text-[#0A6EBD] hover:bg-slate-100 rounded-md transition cursor-pointer"
                            title="Xem trước cấu trúc"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#0A6EBD] hover:bg-[#085999] rounded-md transition shadow-2xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Tải về
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredTemplates.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="biểu mẫu"
      />

      {/* ── MODAL PREVIEW A4 VĂN BẢN HÀNH CHÍNH ── */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 text-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#0A6EBD] bg-white px-2.5 py-0.5 rounded border border-sky-200">
                  {previewTemplate.code}
                </span>
                <span className="font-bold text-slate-900 text-sm">{previewTemplate.name}</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-5 bg-[#FAFCFF] rounded-xl border border-slate-200 shadow-inner space-y-3 font-serif">
                <div className="flex justify-between border-b border-slate-200 pb-3 text-[11px] font-sans">
                  <div>
                    <p className="font-bold uppercase text-slate-800">BỘ Y TẾ</p>
                    <p className="font-bold uppercase text-slate-900">BỆNH VIỆN ĐA KHOA TRUNG TÂM</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold uppercase text-slate-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="text-slate-600 italic">Độc lập - Tự do - Hạnh phúc</p>
                  </div>
                </div>

                <div className="text-center pt-2 font-sans">
                  <h3 className="font-bold text-base text-[#0B2A63] uppercase">{previewTemplate.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Mã số: <strong>{previewTemplate.code}</strong> • Phiên bản: <strong>{previewTemplate.templateVersion}</strong>
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">Căn cứ: {previewTemplate.legalRef}</p>
                </div>

                <div className="pt-2 font-sans text-xs text-slate-700 space-y-2">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">Mục đích áp dụng:</p>
                    <p className="leading-relaxed text-slate-600">{previewTemplate.description}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <p className="font-bold text-slate-900 mb-1">Cấu trúc các trường thông tin bắt buộc:</p>
                    {previewTemplate.previewSummary.map((sum, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-700 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0A6EBD] shrink-0 mt-0.5" />
                        <span>{sum}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-xs">
                Định dạng: <strong className="text-slate-800 font-mono">{previewTemplate.format}</strong> ({previewTemplate.size})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-white font-semibold transition cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => {
                    handleDownload(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải Biểu Mẫu Này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}