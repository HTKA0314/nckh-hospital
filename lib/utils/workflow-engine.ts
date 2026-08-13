import {
  AcceptanceDossierStatus,
  DocumentType,
  EthicsStatus,
  ProjectStatus,
  ProposalStatus,
  ResearchProject,
  WorkflowPolicy,
} from '@/lib/types';

export interface StepState {
  stepNumber: number;
  title: string;
  status:
    | 'COMPLETED'
    | 'CURRENT'
    | 'FUTURE'
    | 'SKIPPED'
    | 'NOT_APPLICABLE'
    | 'BLOCKED'
    | 'REVISION_REQUIRED';
  completedAt?: string;
  requiredDocuments: {
    type: DocumentType;
    label: string;
    required: boolean;
    uploaded: boolean;
  }[];
  skipReason?: string;
}

export interface ProjectWorkflowState {
  currentStepNumber: number;
  currentStepTitle: string;
  steps: StepState[];
}

export const WORKFLOW_STEP_NAMES: Record<number, string> = {
  1: 'Khởi tạo hồ sơ đăng ký',
  2: 'Tiếp nhận & kiểm tra hành chính hồ sơ',
  3: 'Nộp & hoàn thiện đề cương chi tiết',
  4: 'Hội đồng xét duyệt đề cương',
  5: 'Hoàn thiện sau xét duyệt đề cương',
  6: 'Thẩm định đạo đức nghiên cứu',
  7: 'Lập, ký & ban hành Quyết định giao thực hiện',
  8: 'Triển khai nghiên cứu',
  9: 'Theo dõi tiến độ / Báo cáo / Gia hạn & Điều chỉnh',
  10: 'Nộp & kiểm tra hồ sơ nghiệm thu',
  11: 'Hội đồng đánh giá nghiệm thu',
  12: 'Hoàn thiện sau nghiệm thu',
  13: 'Lập, ký & ban hành Quyết định công nhận kết quả',
  14: 'Nộp lưu & đóng hồ sơ',
};

const TERMINAL_PROJECT_STATUSES: ProjectStatus[] = [
  'CLOSED',
  'ARCHIVED',
];

const EXECUTION_OR_LATER_STATUSES: ProjectStatus[] = [
  'IN_PROGRESS',
  'SUSPENDED',
  'WAITING_ACCEPTANCE',
  'ACCEPTED',
  'RECOGNIZED',
  'CLOSED',
  'ARCHIVED',
];

const ACCEPTANCE_OR_LATER_STATUSES: ProjectStatus[] = [
  'ACCEPTED',
  'RECOGNIZED',
  'CLOSED',
  'ARCHIVED',
];

function hasIssuedDecision(
  project: ResearchProject,
  type: 'ASSIGNMENT' | 'RECOGNITION'
): boolean {
  return (project.decisions ?? []).some(
    (decision) =>
      decision.type === type &&
      decision.status === 'ISSUED'
  );
}

function isDocumentUploaded(
  project: ResearchProject,
  documentType: DocumentType
): boolean {
  return (project.documents ?? []).some(
    (doc) => doc.documentType === documentType
  );
}

function getDocumentsForStep(
  project: ResearchProject,
  policy: WorkflowPolicy,
  stepNum: number
): StepState['requiredDocuments'] {
  const policyDocs = policy.requiredDocumentsByStep[stepNum] ?? [];

  return policyDocs.map((req) => ({
    type: req.type,
    label: req.label,
    required: req.required,
    uploaded: isDocumentUploaded(project, req.type),
  }));
}

function areRequiredDocumentsValid(
  docs: StepState['requiredDocuments']
): boolean {
  return docs.every((doc) => !doc.required || doc.uploaded);
}

function finalizeStep(
  step: Omit<StepState, 'requiredDocuments'> & {
    requiredDocuments: StepState['requiredDocuments'];
  }
): StepState {
  if (
    step.status === 'COMPLETED' &&
    !areRequiredDocumentsValid(step.requiredDocuments)
  ) {
    return {
      ...step,
      status: 'BLOCKED',
    };
  }

  return step;
}

function getAcceptanceDossierStatus(
  project: ResearchProject
): AcceptanceDossierStatus | undefined {
  return project.acceptanceDossier?.status;
}

function hasPendingPostAcceptanceRevision(
  project: ResearchProject
): boolean {
  return (project.acceptanceDossier?.postAcceptanceRevisions ?? []).some(
    (revision) => revision.status !== 'CONFIRMED'
  );
}

function resolveStep1(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 1);

  const status: StepState['status'] =
    project.status === 'DRAFT' && project.proposalStatus === 'DRAFT'
      ? 'CURRENT'
      : 'COMPLETED';

  return finalizeStep({
    stepNumber: 1,
    title: WORKFLOW_STEP_NAMES[1],
    status,
    completedAt: status === 'COMPLETED' ? project.createdAt : undefined,
    requiredDocuments: docs,
  });
}

function resolveStep2(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 2);
  let status: StepState['status'] = 'FUTURE';

  if (
    project.proposalStatus === 'SUBMITTED' ||
    project.proposalStatus === 'UNDER_ADMIN_REVIEW' ||
    project.proposalStatus === 'RESUBMITTED'
  ) {
    status = 'CURRENT';
  } else if (project.proposalStatus === 'REVISION_REQUIRED') {
    status = 'REVISION_REQUIRED';
  } else if (
    [
      'ADMIN_VALIDATED',
      'OUTLINE_SUBMITTED',
      'UNDER_PROPOSAL_REVIEW',
      'PROPOSAL_REVISION_REQUIRED',
      'PROPOSAL_RESUBMITTED',
      'UNDER_PROPOSAL_REVISION_REVIEW',
      'PROPOSAL_APPROVED',
      'REJECTED',
    ].includes(project.proposalStatus as ProposalStatus)
  ) {
    status = 'COMPLETED';
  }

  return finalizeStep({
    stepNumber: 2,
    title: WORKFLOW_STEP_NAMES[2],
    status,
    completedAt: status === 'COMPLETED' ? project.submittedAt : undefined,
    requiredDocuments: docs,
  });
}

function resolveStep3(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 3);
  let status: StepState['status'] = 'FUTURE';

  if (project.proposalStatus === 'ADMIN_VALIDATED') {
    status = 'CURRENT';
  } else if (
    [
      'OUTLINE_SUBMITTED',
      'UNDER_PROPOSAL_REVIEW',
      'PROPOSAL_REVISION_REQUIRED',
      'PROPOSAL_RESUBMITTED',
      'UNDER_PROPOSAL_REVISION_REVIEW',
      'PROPOSAL_APPROVED',
    ].includes(project.proposalStatus as ProposalStatus)
  ) {
    status = 'COMPLETED';
  }

  return finalizeStep({
    stepNumber: 3,
    title: WORKFLOW_STEP_NAMES[3],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep4(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 4);

  const reviewSkipped =
    !policy.requiresScientificReview ||
    project.scientificReviewStatus === 'SKIPPED';

  if (reviewSkipped) {
    return {
      stepNumber: 4,
      title: WORKFLOW_STEP_NAMES[4],
      status: 'SKIPPED',
      skipReason:
        project.scientificReviewSkipReason ||
        'Không yêu cầu Hội đồng xét duyệt chuyên môn theo WorkflowPolicy.',
      requiredDocuments: docs,
    };
  }

  let status: StepState['status'] = 'FUTURE';

  if (
    project.proposalStatus === 'OUTLINE_SUBMITTED' ||
    project.proposalStatus === 'UNDER_PROPOSAL_REVIEW'
  ) {
    status = 'CURRENT';
  } else if (project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
    status = 'REVISION_REQUIRED';
  } else if (
    [
      'PROPOSAL_RESUBMITTED',
      'UNDER_PROPOSAL_REVISION_REVIEW',
    ].includes(project.proposalStatus as ProposalStatus)
  ) {
    status = 'CURRENT';
  } else if (
    project.proposalStatus === 'PROPOSAL_APPROVED' ||
    EXECUTION_OR_LATER_STATUSES.includes(project.status)
  ) {
    status = 'COMPLETED';
  }

  return finalizeStep({
    stepNumber: 4,
    title: WORKFLOW_STEP_NAMES[4],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep5(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 5);

  if (
    !policy.requiresScientificReview ||
    project.scientificReviewStatus === 'SKIPPED'
  ) {
    return {
      stepNumber: 5,
      title: WORKFLOW_STEP_NAMES[5],
      status: 'SKIPPED',
      skipReason:
        'Bước hoàn thiện sau xét duyệt không áp dụng khi bước xét duyệt chuyên môn được bỏ qua.',
      requiredDocuments: docs,
    };
  }

  let status: StepState['status'] = 'FUTURE';

  if (
    project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED' ||
    project.proposalStatus === 'PROPOSAL_RESUBMITTED' ||
    project.proposalStatus === 'UNDER_PROPOSAL_REVISION_REVIEW'
  ) {
    status = 'CURRENT';
  } else if (
    project.proposalStatus === 'PROPOSAL_APPROVED' ||
    EXECUTION_OR_LATER_STATUSES.includes(project.status)
  ) {
    status = 'COMPLETED';
  }

  return finalizeStep({
    stepNumber: 5,
    title: WORKFLOW_STEP_NAMES[5],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep6(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 6);

  const ethicsStatus = project.ethicsStatus as EthicsStatus;

  if (!policy.requiresEthicsReview || ethicsStatus === 'NOT_REQUIRED') {
    return {
      stepNumber: 6,
      title: WORKFLOW_STEP_NAMES[6],
      status: 'NOT_APPLICABLE',
      skipReason: 'Đề tài không thuộc diện thẩm định đạo đức.',
      requiredDocuments: docs,
    };
  }

  let status: StepState['status'] = 'FUTURE';

  if (ethicsStatus === 'ETHICS_APPROVED') {
    status = 'COMPLETED';
  } else if (ethicsStatus === 'ETHICS_REVISION_REQUIRED') {
    status = 'REVISION_REQUIRED';
  } else if (
    [
      'SCREENING_IN_PROGRESS',
      'DOSSIER_SUBMITTED',
      'UNDER_ETHICS_REVIEW',
      'CONDITIONALLY_APPROVED',
    ].includes(ethicsStatus)
  ) {
    status = 'CURRENT';
  } else if (
    [
      'ETHICS_REJECTED',
      'EXPIRED',
      'SUSPENDED',
      'WITHDRAWN',
      'TERMINATED',
    ].includes(ethicsStatus)
  ) {
    status = 'BLOCKED';
  }

  return finalizeStep({
    stepNumber: 6,
    title: WORKFLOW_STEP_NAMES[6],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep7(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 7);

  const assignmentIssued = hasIssuedDecision(project, 'ASSIGNMENT');

  let status: StepState['status'] = 'FUTURE';

  if (assignmentIssued || EXECUTION_OR_LATER_STATUSES.includes(project.status)) {
    status = 'COMPLETED';
  } else if (
    project.status === 'WAITING_ASSIGNMENT' &&
    (
      !policy.requiresEthicsReview ||
      project.ethicsStatus === 'NOT_REQUIRED' ||
      project.ethicsStatus === 'ETHICS_APPROVED'
    )
  ) {
    status = 'CURRENT';
  }

  return finalizeStep({
    stepNumber: 7,
    title: WORKFLOW_STEP_NAMES[7],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep8(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 8);

  let status: StepState['status'] = 'FUTURE';

  if (
    [
      'WAITING_ACCEPTANCE',
      'ACCEPTED',
      'RECOGNIZED',
      'CLOSED',
      'ARCHIVED',
    ].includes(project.status)
  ) {
    status = 'COMPLETED';
  } else if (
    project.status === 'IN_PROGRESS' ||
    project.status === 'SUSPENDED'
  ) {
    status = 'CURRENT';
  }

  return finalizeStep({
    stepNumber: 8,
    title: WORKFLOW_STEP_NAMES[8],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep9(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 9);

  let status: StepState['status'] = 'FUTURE';

  if (
    [
      'WAITING_ACCEPTANCE',
      'ACCEPTED',
      'RECOGNIZED',
      'CLOSED',
      'ARCHIVED',
    ].includes(project.status)
  ) {
    status = 'COMPLETED';
  } else if (
    project.status === 'IN_PROGRESS' ||
    project.status === 'SUSPENDED'
  ) {
    status = 'CURRENT';
  } else if (project.status === 'TERMINATED') {
    status = 'BLOCKED';
  }

  return finalizeStep({
    stepNumber: 9,
    title: WORKFLOW_STEP_NAMES[9],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep10(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 10);
  const dossierStatus = getAcceptanceDossierStatus(project);

  let status: StepState['status'] = 'FUTURE';

  if (ACCEPTANCE_OR_LATER_STATUSES.includes(project.status)) {
    status = 'COMPLETED';
  } else if (project.status === 'WAITING_ACCEPTANCE') {
    if (dossierStatus === 'REVISION_REQUIRED') {
      status = 'REVISION_REQUIRED';
    } else if (dossierStatus === 'FORWARDED_TO_COUNCIL') {
      status = 'COMPLETED';
    } else {
      status = 'CURRENT';
    }
  }

  return finalizeStep({
    stepNumber: 10,
    title: WORKFLOW_STEP_NAMES[10],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep11(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 11);
  const dossierStatus = getAcceptanceDossierStatus(project);

  let status: StepState['status'] = 'FUTURE';

  if (
    [
      'ACCEPTED',
      'RECOGNIZED',
      'CLOSED',
      'ARCHIVED',
    ].includes(project.status)
  ) {
    status = 'COMPLETED';
  } else if (
    project.status === 'WAITING_ACCEPTANCE' &&
    dossierStatus === 'FORWARDED_TO_COUNCIL'
  ) {
    status = 'CURRENT';
  }

  return finalizeStep({
    stepNumber: 11,
    title: WORKFLOW_STEP_NAMES[11],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep12(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 12);

  let status: StepState['status'] = 'FUTURE';

  if (
    [
      'RECOGNIZED',
      'CLOSED',
      'ARCHIVED',
    ].includes(project.status)
  ) {
    status = 'COMPLETED';
  } else if (project.status === 'ACCEPTED') {
    status = hasPendingPostAcceptanceRevision(project)
      ? 'CURRENT'
      : 'NOT_APPLICABLE';
  }

  return finalizeStep({
    stepNumber: 12,
    title: WORKFLOW_STEP_NAMES[12],
    status,
    skipReason:
      status === 'NOT_APPLICABLE'
        ? 'Hội đồng nghiệm thu không yêu cầu chỉnh sửa sau nghiệm thu.'
        : undefined,
    requiredDocuments: docs,
  });
}

function resolveStep13(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 13);

  const recognitionIssued = hasIssuedDecision(project, 'RECOGNITION');

  let status: StepState['status'] = 'FUTURE';

  if (
    recognitionIssued ||
    ['RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(project.status)
  ) {
    status = 'COMPLETED';
  } else if (
    project.status === 'ACCEPTED' &&
    !hasPendingPostAcceptanceRevision(project)
  ) {
    status = 'CURRENT';
  }

  return finalizeStep({
    stepNumber: 13,
    title: WORKFLOW_STEP_NAMES[13],
    status,
    requiredDocuments: docs,
  });
}

function resolveStep14(project: ResearchProject, policy: WorkflowPolicy): StepState {
  const docs = getDocumentsForStep(project, policy, 14);

  let status: StepState['status'] = 'FUTURE';

  if (TERMINAL_PROJECT_STATUSES.includes(project.status)) {
    status = 'COMPLETED';
  } else if (project.status === 'RECOGNIZED') {
    status = 'CURRENT';
  }

  return finalizeStep({
    stepNumber: 14,
    title: WORKFLOW_STEP_NAMES[14],
    status,
    completedAt: status === 'COMPLETED' ? project.completedAt : undefined,
    requiredDocuments: docs,
  });
}

export function getProjectWorkflowState(
  project: ResearchProject,
  policy: WorkflowPolicy
): ProjectWorkflowState {
  const steps: StepState[] = [
    resolveStep1(project, policy),
    resolveStep2(project, policy),
    resolveStep3(project, policy),
    resolveStep4(project, policy),
    resolveStep5(project, policy),
    resolveStep6(project, policy),
    resolveStep7(project, policy),
    resolveStep8(project, policy),
    resolveStep9(project, policy),
    resolveStep10(project, policy),
    resolveStep11(project, policy),
    resolveStep12(project, policy),
    resolveStep13(project, policy),
    resolveStep14(project, policy),
  ];

  const currentStep =
    steps.find((step) =>
      ['CURRENT', 'REVISION_REQUIRED', 'BLOCKED'].includes(step.status)
    ) ??
    steps.find((step) => step.status === 'FUTURE');

  const currentStepNumber = currentStep?.stepNumber ?? 14;

  return {
    currentStepNumber,
    currentStepTitle:
      WORKFLOW_STEP_NAMES[currentStepNumber] ?? 'Nghiên cứu',
    steps,
  };
}