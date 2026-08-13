'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { Decision, DecisionStatus, Role, ResearchProject } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowLeft, BookOpen, CheckCircle2, Clock, CheckSquare,
  AlertTriangle, FileText, User, Calendar, Save, Send, PenTool, XCircle
} from 'lucide-react';

export default function DecisionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const isNew = params.id === 'new';
  
  const [decision, setDecision] = useState<Decision | null>(null);
  const [project, setProject] = useState<ResearchProject | null>(null);
  
  useEffect(() => {
    if (isNew) {
      const type = searchParams.get('type') as 'ASSIGNMENT' | 'RECOGNITION' || 'ASSIGNMENT';
      const projectId = searchParams.get('projectId');
      
      const newDec: Decision = {
        id: 'new-draft',
        type: type,
        status: 'DRAFT',
        projectId: projectId || '',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || '',
        history: []
      };
      setDecision(newDec);
      if (projectId) {
        setProject(repo.getProjectById(projectId) || null);
      }
    } else {
      const d = repo.getDecisionById(params.id as string);
      if (d) {
        setDecision(d);
        setProject(repo.getProjectById(d.projectId) || null);
      }
    }
  }, [isNew, params.id, searchParams, currentUser]);

  if (!decision || !project) {
    return <div className="p-8 text-center text-slate-500">Đang tải hoặc không tìm thấy thông tin...</div>;
  }

  // --- GATE LOGIC ---
  const checkGate = () => {
    if (decision.type === 'ASSIGNMENT') {
      const isApproved = project.status === 'WAITING_ASSIGNMENT' || (project.status as any) === 'ASSIGNED';
      const isRevisionCompleted = project.proposalStatus !== 'PROPOSAL_REVISION_REQUIRED';
      const isEthicsOk = project.ethicsStatus === 'ETHICS_APPROVED' || project.ethicsStatus === 'NOT_REQUIRED';
      
      return {
        checks: [
          { label: 'Đề cương đã được Hội đồng thông qua', passed: isApproved },
          { label: 'Đã hoàn thiện sau xét duyệt', passed: isRevisionCompleted },
          { label: 'Đạo đức đã đạt (nếu áp dụng)', passed: isEthicsOk },
        ],
        isReady: isApproved && isRevisionCompleted && isEthicsOk
      };
    } else {
      const isAccepted = project.status === 'ACCEPTED';
      const isRevisionCompleted = true; // Dữ liệu lấy từ AcceptanceDossier
      return {
        checks: [
          { label: 'Hội đồng nghiệm thu đã thông qua', passed: isAccepted },
          { label: 'Hoàn thiện sau nghiệm thu', passed: isRevisionCompleted },
        ],
        isReady: isAccepted && isRevisionCompleted
      };
    }
  };

  const gate = checkGate();

  // ACTIONS
  const handleAction = (action: 'SUBMIT' | 'APPROVE' | 'ISSUE') => {
    if (isNew) {
      alert('Vui lòng lưu dự thảo trước khi thực hiện các hành động tiếp theo.');
      return;
    }

    let nextStatus: DecisionStatus = decision.status;
    let successMessage = '';

    if (action === 'SUBMIT') {
      nextStatus = 'PENDING_SIGNATURE';
      successMessage = 'Đã trình quyết định này lên Giám đốc ký duyệt thành công!';
    } else if (action === 'APPROVE') {
      nextStatus = 'SIGNED';
      successMessage = 'Đã ký phê duyệt quyết định thành công!';
    } else if (action === 'ISSUE') {
      nextStatus = 'ISSUED';
      successMessage = 'Quyết định đã được ký ban hành chính thức!';
    }

    const updatedHistory = [
      ...decision.history,
      {
        id: `dh-${Date.now()}`,
        decisionId: decision.id,
        action: action === 'SUBMIT' ? 'SUBMITTED_FOR_SIGNATURE' : action === 'APPROVE' ? 'SIGNED' : 'ISSUED',
        toStatus: nextStatus,
        actorId: currentUser?.id || '',
        actorName: currentUser?.fullName || '',
        actorRole: currentUser?.role || 'ADMIN',
        timestamp: new Date().toISOString(),
        notes: action === 'SUBMIT' ? 'Trình ký quyết định' : action === 'APPROVE' ? 'Giám đốc ký phê duyệt' : 'Ban hành quyết định chính thức'
      }
    ];

    const updates: Partial<Decision> = {
      status: nextStatus,
      history: updatedHistory as any
    };

    if (action === 'APPROVE') {
      updates.signedBy = currentUser?.fullName;
      updates.signedDate = new Date().toISOString();
    } else if (action === 'ISSUE') {
      updates.issuedDate = new Date().toISOString();
      // If it is an ASSIGNMENT decision, activate the project to IN_PROGRESS!
      if (decision.type === 'ASSIGNMENT') {
        repo.updateProject(project.id, {
          status: 'IN_PROGRESS',
          projectCode: `DT-${new Date().getFullYear()}-${String(project.id.split('-').pop()).padStart(3, '0')}`
        });
      } else if (decision.type === 'RECOGNITION') {
        repo.updateProject(project.id, {
          status: 'CLOSED'
        });
      }
    }

    const updatedDec = repo.updateDecision(decision.id, updates);
    if (updatedDec) {
      setDecision(updatedDec);
      setProject(repo.getProjectById(project.id) || null);
      alert(successMessage);
      router.push('/decisions');
    } else {
      alert('Có lỗi xảy ra khi cập nhật quyết định.');
    }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      <Link href="/decisions" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách Quyết định
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#0A6EBD]" />
            {isNew ? 'Lập dự thảo Quyết định' : 'Chi tiết Quyết định'}
          </h1>
          <p className="text-slate-500 mt-1">
            {decision.type === 'ASSIGNMENT' ? 'Quyết định Giao thực hiện đề tài' : 'Quyết định Công nhận kết quả nghiên cứu'}
          </p>
        </div>
        
        {/* Status Badge */}
        <div className="px-4 py-2 rounded-lg font-bold border text-sm flex items-center gap-2 bg-slate-50 border-slate-200 text-slate-700">
          Trạng thái: 
          {decision.status === 'DRAFT' && <span className="text-slate-600">Dự thảo</span>}
          {decision.status === 'PENDING_SIGNATURE' && <span className="text-amber-600">Đang trình ký</span>}
          {decision.status === 'SIGNED' && <span className="text-blue-600">Đã ký</span>}
          {decision.status === 'ISSUED' && <span className="text-emerald-600">Đã ban hành</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Info & Project */}
        <div className="col-span-2 space-y-6">
          
          {/* Box 1: Thông tin quyết định */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Thông tin quyết định
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Số Quyết định</span>
                <p className="font-semibold text-slate-900">
                  {decision.decisionNumber || <span className="text-slate-400 italic">Chưa cấp số (cấp khi ban hành)</span>}
                </p>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Ngày lập</span>
                <p className="font-medium text-slate-900">{new Date(decision.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
              {decision.status !== 'DRAFT' && (
                <>
                  <div>
                    <span className="block text-slate-500 mb-1">Người ký</span>
                    <p className="font-medium text-slate-900">{decision.signedBy || 'Chưa có'}</p>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Ngày ban hành</span>
                    <p className="font-medium text-slate-900">{decision.issuedDate ? new Date(decision.issuedDate).toLocaleDateString('vi-VN') : '—'}</p>
                  </div>
                </>
              )}
            </div>
            
            {/* File đính kèm */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="block text-slate-500 mb-2 text-sm font-medium">Tài liệu dự thảo / Quyết định gốc</span>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <FileText className="w-8 h-8 text-rose-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{decision.signedFile || decision.draftFile || 'Chưa có file đính kèm'}</p>
                  <p className="text-xs text-slate-400">Nhấp để xem/tải xuống</p>
                </div>
              </div>
              {decision.status === 'DRAFT' && (
                <button className="mt-3 text-sm text-[#0A6EBD] font-medium hover:underline">
                  + Tải lên / Cập nhật file dự thảo
                </button>
              )}
            </div>
          </div>

          {/* Box 2: Đề tài liên quan */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" />
              Đề tài liên quan
            </h2>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm">
                  {(project.projectCode || project.proposalCode || 'DT').split('-').pop()}
                </div>
                <div>
                  <Link href={`/projects/${project.id}`} className="font-bold text-slate-900 hover:text-[#0A6EBD] text-base transition-colors">
                    {project.title}
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> {project.principalInvestigatorName}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {project.durationMonths} tháng</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Conditions & Actions */}
        <div className="space-y-6">
          
          {/* Gate Conditions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Điều kiện ban hành</h3>
            <div className="space-y-2 mb-4">
              {gate.checks.map((chk, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  )}
                  <span className={chk.passed ? 'text-slate-700' : 'text-slate-500 line-through decoration-slate-300'}>
                    {chk.label}
                  </span>
                </div>
              ))}
            </div>
            
            {!gate.isReady && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm flex items-start gap-2 border border-rose-100">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Chưa đủ điều kiện trình ký/ban hành quyết định.</p>
              </div>
            )}
            {gate.isReady && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-start gap-2 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Đã đủ điều kiện trình ký.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Thao tác</h3>
            
            {decision.status === 'DRAFT' && (
              <>
                <button className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Lưu nháp
                </button>
                <button 
                  disabled={!gate.isReady}
                  onClick={() => handleAction('SUBMIT')}
                  className="w-full py-2.5 rounded-lg bg-[#0A6EBD] text-white font-medium hover:bg-[#085a9c] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" /> Trình ký
                </button>
              </>
            )}

            {decision.status === 'PENDING_SIGNATURE' && currentUser?.role === 'DIRECTOR' && (
              <>
                <button 
                  onClick={() => handleAction('APPROVE')}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <PenTool className="w-4 h-4" /> Ký phê duyệt
                </button>
                <button className="w-full py-2.5 rounded-lg border border-rose-200 text-rose-600 font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Trả lại
                </button>
              </>
            )}

            {decision.status === 'SIGNED' && currentUser?.role === 'RESEARCH_OFFICE' && (
              <button 
                onClick={() => handleAction('ISSUE')}
                className="w-full py-2.5 rounded-lg bg-[#0A6EBD] text-white font-medium hover:bg-[#085a9c] transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Cập nhật & Ban hành
              </button>
            )}

            {decision.status === 'ISSUED' && (
              <div className="p-3 bg-slate-50 text-slate-600 text-sm text-center rounded-lg border border-slate-100">
                Quyết định đã được ban hành
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
