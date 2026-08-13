import { ResearchProject, WorkflowPolicy, DocumentType } from '@/lib/types';

export interface StepState {
  stepNumber: number;
  title: string;
  status: 'COMPLETED' | 'CURRENT' | 'FUTURE' | 'SKIPPED' | 'NOT_APPLICABLE' | 'BLOCKED' | 'REVISION_REQUIRED';
  completedAt?: string;
  requiredDocuments: { type: DocumentType; label: string; required: boolean; uploaded: boolean }[];
  skipReason?: string;
}

export interface ProjectWorkflowState {
  currentStepNumber: number;
  currentStepTitle: string;
  steps: StepState[];
}

export const WORKFLOW_STEP_NAMES: Record<number, string> = {
  1: 'Khởi tạo & Tiếp nhận đề xuất',
  2: 'Kiểm tra hồ sơ ban đầu',
  3: 'Xây dựng & Hoàn thiện đề cương',
  4: 'Xét duyệt chuyên môn',
  5: 'Hoàn thiện sau xét duyệt',
  6: 'Thẩm định đạo đức',
  7: 'Phê duyệt & Giao thực hiện',
  8: 'Triển khai nghiên cứu',
  9: 'Theo dõi tiến độ / Báo cáo / Gia hạn',
  10: 'Nộp hồ sơ nghiệm thu',
  11: 'Đánh giá & Nghiệm thu',
  12: 'Hoàn thiện sau nghiệm thu',
  13: 'Công nhận kết quả',
  14: 'Nộp lưu & Đóng hồ sơ',
};

export function getProjectWorkflowState(
  project: ResearchProject,
  policy: WorkflowPolicy
): ProjectWorkflowState {
  const steps: StepState[] = [];
  const projectDocs = project.documents || [];

  // Helper kiểm tra tài liệu
  const getDocumentsForStep = (stepNum: number) => {
    const policyDocs = policy.requiredDocumentsByStep[stepNum] || [];
    return policyDocs.map((req) => {
      const isUploaded = projectDocs.some(
        (doc) => doc.documentType === req.type
      );
      return {
        type: req.type,
        label: req.label,
        required: req.required,
        uploaded: isUploaded,
      };
    });
  };

  const isStepDocumentsValid = (stepDocs: { required: boolean; uploaded: boolean }[]) => {
    return stepDocs.every((doc) => !doc.required || doc.uploaded);
  };

  // --- BƯỚC 1: Khởi tạo & Tiếp nhận đề xuất ---
  const step1Docs = getDocumentsForStep(1);
  let step1Status: StepState['status'] = 'COMPLETED';
  if (project.proposalStatus === 'DRAFT') {
    step1Status = 'CURRENT';
  }
  if (step1Status === 'COMPLETED' && !isStepDocumentsValid(step1Docs)) {
    step1Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 1,
    title: WORKFLOW_STEP_NAMES[1],
    status: step1Status,
    completedAt: step1Status === 'COMPLETED' ? project.createdAt : undefined,
    requiredDocuments: step1Docs,
  });

  // --- BƯỚC 2: Kiểm tra hồ sơ ban đầu ---
  const step2Docs = getDocumentsForStep(2);
  let step2Status: StepState['status'] = 'FUTURE';
  if (steps[0].status === 'COMPLETED') {
    if (project.proposalStatus === 'SUBMITTED' || project.proposalStatus === 'UNDER_ADMIN_REVIEW') {
      step2Status = 'CURRENT';
    } else if (project.proposalStatus === 'REVISION_REQUIRED') {
      step2Status = 'REVISION_REQUIRED';
    } else if (project.proposalStatus !== 'DRAFT') {
      step2Status = 'COMPLETED';
    }
  }
  if (step2Status === 'COMPLETED' && !isStepDocumentsValid(step2Docs)) {
    step2Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 2,
    title: WORKFLOW_STEP_NAMES[2],
    status: step2Status,
    completedAt: step2Status === 'COMPLETED' ? project.submittedAt : undefined,
    requiredDocuments: step2Docs,
  });

  // --- BƯỚC 3: Xây dựng & Hoàn thiện đề cương ---
  const step3Docs = getDocumentsForStep(3);
  let step3Status: StepState['status'] = 'FUTURE';
  if (steps[1].status === 'COMPLETED') {
    if (project.proposalStatus === 'ADMIN_VALIDATED' || project.proposalStatus === 'RESUBMITTED') {
      step3Status = 'CURRENT';
    } else if (
      project.proposalStatus !== 'DRAFT' &&
      project.proposalStatus !== 'SUBMITTED' &&
      project.proposalStatus !== 'UNDER_ADMIN_REVIEW' &&
      project.proposalStatus !== 'REVISION_REQUIRED'
    ) {
      step3Status = 'COMPLETED';
    }
  }
  if (step3Status === 'COMPLETED' && !isStepDocumentsValid(step3Docs)) {
    step3Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 3,
    title: WORKFLOW_STEP_NAMES[3],
    status: step3Status,
    requiredDocuments: step3Docs,
  });

  // --- BƯỚC 4: Xét duyệt chuyên môn ---
  const step4Docs = getDocumentsForStep(4);
  let step4Status: StepState['status'] = 'FUTURE';
  let skipReason4: string | undefined;

  const isOutlineSkipped = !policy.requiresScientificReview || project.scientificReviewStatus === 'SKIPPED';

  if (isOutlineSkipped) {
    step4Status = 'SKIPPED';
    skipReason4 = project.scientificReviewSkipReason || 'Đề tài đã được Hội đồng chuyên môn ngoài viện xét duyệt.';
  } else if (steps[2].status === 'COMPLETED' || steps[2].status === 'BLOCKED') {
    const activeCore = ['APPROVED', 'WAITING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'SUSPENDED', 'WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
      step4Status = 'REVISION_REQUIRED';
    } else if (project.proposalStatus === 'PROPOSAL_APPROVED' || activeCore.includes(project.status)) {
      step4Status = 'COMPLETED';
    } else if (project.proposalStatus === 'ADMIN_VALIDATED' || project.proposalStatus === 'RESUBMITTED') {
      step4Status = 'CURRENT';
    }
  }
  if (step4Status === 'COMPLETED' && !isStepDocumentsValid(step4Docs)) {
    step4Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 4,
    title: WORKFLOW_STEP_NAMES[4],
    status: step4Status,
    skipReason: skipReason4,
    requiredDocuments: step4Docs,
  });

  // --- BƯỚC 5: Hoàn thiện sau xét duyệt ---
  const step5Docs = getDocumentsForStep(5);
  let step5Status: StepState['status'] = 'FUTURE';
  if (step4Status === 'SKIPPED') {
    step5Status = 'SKIPPED';
  } else if (step4Status === 'COMPLETED' || step4Status === 'BLOCKED') {
    const activeCore = ['WAITING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'SUSPENDED', 'WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (project.proposalStatus === 'PROPOSAL_APPROVED' || activeCore.includes(project.status)) {
      step5Status = 'COMPLETED';
    } else if (project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED' || project.proposalStatus === 'PROPOSAL_RESUBMITTED') {
      step5Status = 'CURRENT';
    }
  }
  if (step5Status === 'COMPLETED' && !isStepDocumentsValid(step5Docs)) {
    step5Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 5,
    title: WORKFLOW_STEP_NAMES[5],
    status: step5Status,
    requiredDocuments: step5Docs,
  });

  // --- BƯỚC 6: Thẩm định đạo đức (nếu áp dụng) ---
  const step6Docs = getDocumentsForStep(6);
  let step6Status: StepState['status'] = 'FUTURE';
  let skipReason6: string | undefined;

  const prevStepCompleted = steps[4].status === 'COMPLETED' || steps[4].status === 'SKIPPED';

  if (!policy.requiresEthicsReview || project.ethicsStatus === 'NOT_REQUIRED') {
    step6Status = 'NOT_APPLICABLE';
    skipReason6 = 'Đề tài không thuộc diện thẩm định đạo đức.';
  } else if (policy.ethicsReviewMode === 'INTEGRATED') {
    // Hội đồng ghép
    if (steps[3].status === 'COMPLETED' || steps[3].status === 'SKIPPED') {
      step6Status = 'COMPLETED';
      skipReason6 = 'Hội đồng đạo đức được tích hợp chung với Hội đồng chuyên môn (Đề tài Cấp cơ sở).';
    } else if (steps[3].status === 'CURRENT' || steps[3].status === 'REVISION_REQUIRED') {
      step6Status = 'CURRENT';
    }
  } else if (prevStepCompleted) {
    if (project.ethicsStatus === 'ETHICS_APPROVED') {
      step6Status = 'COMPLETED';
    } else if (project.ethicsStatus === 'ETHICS_REVISION_REQUIRED') {
      step6Status = 'REVISION_REQUIRED';
    } else if (
      project.status === 'WAITING_ASSIGNMENT' ||
      project.ethicsStatus === 'DOSSIER_SUBMITTED' ||
      project.ethicsStatus === 'UNDER_ETHICS_REVIEW'
    ) {
      step6Status = 'CURRENT';
    }
  }
  if (step6Status === 'COMPLETED' && !isStepDocumentsValid(step6Docs)) {
    step6Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 6,
    title: WORKFLOW_STEP_NAMES[6],
    status: step6Status,
    skipReason: skipReason6,
    requiredDocuments: step6Docs,
  });

  // --- BƯỚC 7: Phê duyệt & Giao thực hiện ---
  const step7Docs = getDocumentsForStep(7);
  let step7Status: StepState['status'] = 'FUTURE';
  const irbCompleted = steps[5].status === 'COMPLETED' || steps[5].status === 'SKIPPED' || steps[5].status === 'NOT_APPLICABLE';

  if (irbCompleted) {
    const activeExecution = ['IN_PROGRESS', 'SUSPENDED', 'WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (activeExecution.includes(project.status)) {
      step7Status = 'COMPLETED';
    } else if ((project.status as any) === 'ASSIGNED') {
      step7Status = 'CURRENT';
    }
  }
  if (step7Status === 'COMPLETED' && !isStepDocumentsValid(step7Docs)) {
    step7Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 7,
    title: WORKFLOW_STEP_NAMES[7],
    status: step7Status,
    completedAt: step7Status === 'COMPLETED' ? project.approvedAt : undefined,
    requiredDocuments: step7Docs,
  });

  // --- BƯỚC 8: Triển khai nghiên cứu ---
  const step8Docs = getDocumentsForStep(8);
  let step8Status: StepState['status'] = 'FUTURE';
  if (steps[6].status === 'COMPLETED') {
    const afterExecution = ['WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (afterExecution.includes(project.status)) {
      step8Status = 'COMPLETED';
    } else if (project.status === 'IN_PROGRESS' || project.status === 'SUSPENDED') {
      step8Status = 'CURRENT';
    }
  }
  if (step8Status === 'COMPLETED' && !isStepDocumentsValid(step8Docs)) {
    step8Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 8,
    title: WORKFLOW_STEP_NAMES[8],
    status: step8Status,
    requiredDocuments: step8Docs,
  });

  // --- BƯỚC 9: Theo dõi tiến độ / Báo cáo / Gia hạn ---
  const step9Docs = getDocumentsForStep(9);
  let step9Status: StepState['status'] = 'FUTURE';
  if (steps[7].status === 'COMPLETED' || steps[7].status === 'CURRENT') {
    const afterExecution = ['WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (afterExecution.includes(project.status)) {
      step9Status = 'COMPLETED';
    } else if (project.status === 'IN_PROGRESS' || project.status === 'SUSPENDED') {
      step9Status = 'CURRENT';
    }
  }
  if (step9Status === 'COMPLETED' && !isStepDocumentsValid(step9Docs)) {
    step9Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 9,
    title: WORKFLOW_STEP_NAMES[9],
    status: step9Status,
    requiredDocuments: step9Docs,
  });

  // --- BƯỚC 10: Nộp hồ sơ nghiệm thu ---
  const step10Docs = getDocumentsForStep(10);
  let step10Status: StepState['status'] = 'FUTURE';
  if (steps[8].status === 'COMPLETED') {
    const afterSubmission = ['ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (afterSubmission.includes(project.status)) {
      step10Status = 'COMPLETED';
    } else if (project.status === 'WAITING_ACCEPTANCE') {
      step10Status = 'CURRENT';
    }
  }
  if (step10Status === 'COMPLETED' && !isStepDocumentsValid(step10Docs)) {
    step10Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 10,
    title: WORKFLOW_STEP_NAMES[10],
    status: step10Status,
    requiredDocuments: step10Docs,
  });

  // --- BƯỚC 11: Đánh giá & Nghiệm thu ---
  const step11Docs = getDocumentsForStep(11);
  let step11Status: StepState['status'] = 'FUTURE';
  if (steps[9].status === 'COMPLETED') {
    const afterReview = ['RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (afterReview.includes(project.status)) {
      step11Status = 'COMPLETED';
    } else if (project.status === 'ACCEPTED') {
      step11Status = 'CURRENT';
    }
  }
  if (step11Status === 'COMPLETED' && !isStepDocumentsValid(step11Docs)) {
    step11Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 11,
    title: WORKFLOW_STEP_NAMES[11],
    status: step11Status,
    requiredDocuments: step11Docs,
  });

  // --- BƯỚC 12: Hoàn thiện sau nghiệm thu ---
  const step12Docs = getDocumentsForStep(12);
  let step12Status: StepState['status'] = 'FUTURE';
  if (steps[10].status === 'COMPLETED') {
    const afterRevision = ['RECOGNIZED', 'CLOSED', 'ARCHIVED'];
    if (afterRevision.includes(project.status)) {
      step12Status = 'COMPLETED';
    } else if (project.status === 'ACCEPTED') {
      step12Status = 'CURRENT';
    }
  }
  if (step12Status === 'COMPLETED' && !isStepDocumentsValid(step12Docs)) {
    step12Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 12,
    title: WORKFLOW_STEP_NAMES[12],
    status: step12Status,
    requiredDocuments: step12Docs,
  });

  // --- BƯỚC 13: Công nhận kết quả ---
  const step13Docs = getDocumentsForStep(13);
  let step13Status: StepState['status'] = 'FUTURE';
  if (steps[11].status === 'COMPLETED') {
    const afterRecognition = ['CLOSED', 'ARCHIVED'];
    if (afterRecognition.includes(project.status)) {
      step13Status = 'COMPLETED';
    } else if (project.status === 'RECOGNIZED') {
      step13Status = 'CURRENT';
    }
  }
  if (step13Status === 'COMPLETED' && !isStepDocumentsValid(step13Docs)) {
    step13Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 13,
    title: WORKFLOW_STEP_NAMES[13],
    status: step13Status,
    requiredDocuments: step13Docs,
  });

  // --- BƯỚC 14: Nộp lưu & Đóng hồ sơ ---
  const step14Docs = getDocumentsForStep(14);
  let step14Status: StepState['status'] = 'FUTURE';
  if (steps[12].status === 'COMPLETED') {
    if (project.status === 'CLOSED' || project.status === 'ARCHIVED') {
      step14Status = 'COMPLETED';
    } else if (project.status === 'RECOGNIZED') {
      step14Status = 'CURRENT';
    }
  }
  if (step14Status === 'COMPLETED' && !isStepDocumentsValid(step14Docs)) {
    step14Status = 'BLOCKED';
  }
  steps.push({
    stepNumber: 14,
    title: WORKFLOW_STEP_NAMES[14],
    status: step14Status,
    completedAt: step14Status === 'COMPLETED' ? project.completedAt : undefined,
    requiredDocuments: step14Docs,
  });

  // Tìm bước hiện tại
  let currentStepNumber = 1;
  const currentStep = steps.find(
    (s) => s.status === 'CURRENT' || s.status === 'REVISION_REQUIRED' || s.status === 'BLOCKED'
  );
  if (currentStep) {
    currentStepNumber = currentStep.stepNumber;
  } else {
    // Nếu tất cả là completed hoặc skipped hoặc future
    const lastCompleted = [...steps].reverse().find((s) => s.status === 'COMPLETED');
    if (lastCompleted) {
      currentStepNumber = Math.min(lastCompleted.stepNumber + 1, 14);
    }
  }

  const currentStepTitle = WORKFLOW_STEP_NAMES[currentStepNumber] || 'Nghiên cứu';

  return {
    currentStepNumber,
    currentStepTitle,
    steps,
  };
}
