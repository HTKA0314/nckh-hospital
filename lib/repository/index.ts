import {
  AuditLog,
  ChangeRequest,
  Council,
  Department,
  Decision,
  DocumentVersion,
  EthicsApproval,
  EthicsStatus,
  Notification,
  ProjectDocument,
  RegistrationRound,
  ResearchProject,
  Role,
  SubmissionVersion,
  User,
  WorkflowPolicy,
} from '@/lib/types';

import {
  SEED_COUNCILS,
  SEED_DECISIONS,
  SEED_DEPARTMENTS,
  SEED_PROJECTS,
  SEED_REGISTRATION_ROUNDS,
  SEED_USERS,
  SEED_WORKFLOW_POLICIES,
} from '@/lib/mock-data/seed-data';

class MockRepository {
  private departments: Department[] = [...SEED_DEPARTMENTS];
  private users: User[] = [...SEED_USERS];
  private rounds: RegistrationRound[] = [...SEED_REGISTRATION_ROUNDS];
  private policies: WorkflowPolicy[] = [...SEED_WORKFLOW_POLICIES];

  private projects: ResearchProject[] = SEED_PROJECTS.map((project) => ({
    ...project,
    workflowPolicyId: project.workflowPolicyId || 'policy-a',
    projectCategory: project.projectCategory || 'CAP_CO_SO',
    acceptanceAuthority: project.acceptanceAuthority || 'BENH_VIEN',
    scientificReviewStatus:
      project.scientificReviewStatus || 'REQUIRED',
    decisions: project.decisions || [],
    documents: project.documents || [],
    milestones: project.milestones || [],
    progressReports: project.progressReports || [],
    changeRequests: project.changeRequests || [],
    statusHistory: project.statusHistory || [],
  }));

  private councils: Council[] = [...SEED_COUNCILS];
  private decisions: Decision[] = [...SEED_DECISIONS];

  private notifications: Notification[] = [
    {
      id: 'notif-01',
      userId: 'user-01',
      title: 'Đề tài DT-2025-001 được phê duyệt thực hiện',
      content:
        'Giám đốc Bệnh viện đã ký Quyết định số QĐ-NCKH/2025/45 giao thực hiện đề tài.',
      type: 'SUCCESS',
      link: '/projects/proj-01',
      isRead: false,
      createdAt: '2025-03-25T16:30:00+07:00',
    },
    {
      id: 'notif-02',
      userId: 'user-01',
      title: 'Thông báo mở Đợt đăng ký Đề tài Năm 2026',
      content:
        'Phòng NCKH mở đợt đăng ký đề tài cấp cơ sở Đợt 1 Năm 2026 đến hết 31/03/2026.',
      type: 'INFO',
      link: '/rounds',
      isRead: true,
      createdAt: '2026-01-05T08:00:00+07:00',
    },
    {
      id: 'notif-03',
      userId: 'user-05',
      title: 'Phân công Chủ tịch Hội đồng xét duyệt đề cương',
      content:
        'Bạn được phân công làm Chủ tịch Hội đồng mã HD-XD-2026-01 họp ngày 15/02/2026.',
      type: 'WARNING',
      link: '/councils/council-01',
      isRead: false,
      createdAt: '2026-02-01T14:00:00+07:00',
    },
  ];

  private auditLogs: AuditLog[] = [
    {
      id: 'log-01',
      timestamp: '2025-03-25T16:00:00+07:00',
      userId: 'user-10',
      userFullName: 'GS.TS.BS. Vũ Đình Khoa',
      userRole: 'DIRECTOR',
      actionCode: 'APPROVE_DECISION',
      entityType: 'DECISION',
      entityId: 'dec-01',
      notes:
        'Ký phê duyệt Quyết định giao thực hiện đề tài DT-2025-001',
    },
  ];

  // ---------------------------------------------------------------------------
  // PROJECTS
  // ---------------------------------------------------------------------------

  getProjects(filters?: {
    keyword?: string;
    departmentId?: string;
    year?: number;
    roundId?: string;
    status?: string;
    ethicsRequired?: boolean;
    piId?: string;
  }): ResearchProject[] {
    let result = [...this.projects];

    if (!filters) return result;

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase().trim();

      result = result.filter((project) =>
        [
          project.title,
          project.proposalCode,
          project.projectCode,
          project.principalInvestigatorName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      );
    }

    if (filters.departmentId && filters.departmentId !== 'ALL') {
      result = result.filter(
        (project) => project.departmentId === filters.departmentId
      );
    }

    if (filters.roundId && filters.roundId !== 'ALL') {
      result = result.filter(
        (project) => project.registrationRoundId === filters.roundId
      );
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(
        (project) => project.status === filters.status
      );
    }

    if (filters.ethicsRequired !== undefined) {
      result = result.filter(
        (project) =>
          project.ethicsRequired === filters.ethicsRequired
      );
    }

    if (filters.piId) {
      result = result.filter(
        (project) => project.principalInvestigatorId === filters.piId
      );
    }

    if (filters.year !== undefined) {
      result = result.filter((project) => {
        const registrationRound = this.getRoundById(
          project.registrationRoundId
        );

        if (registrationRound) {
          return registrationRound.year === filters.year;
        }

        const createdYear = new Date(project.createdAt).getFullYear();
        return createdYear === filters.year;
      });
    }

    return result;
  }

  getProjectById(id: string): ResearchProject | undefined {
    return this.projects.find((project) => project.id === id);
  }

  createProject(project: ResearchProject): ResearchProject {
    this.projects.unshift(project);
    return project;
  }

  updateProject(
    id: string,
    updates: Partial<ResearchProject>
  ): ResearchProject | undefined {
    const index = this.projects.findIndex(
      (project) => project.id === id
    );

    if (index === -1) return undefined;

    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };

    return this.projects[index];
  }

  deleteProject(id: string): boolean {
    const project = this.getProjectById(id);

    if (!project) return false;

    // Business rule: chỉ xóa bản nháp chưa nộp.
    if (
      project.status !== 'DRAFT' ||
      project.proposalStatus !== 'DRAFT'
    ) {
      return false;
    }

    const index = this.projects.findIndex(
      (item) => item.id === id
    );

    this.projects.splice(index, 1);
    return true;
  }

  // ---------------------------------------------------------------------------
  // SUBMISSION VERSIONS
  // ---------------------------------------------------------------------------

  getSubmissionVersions(projectId: string): SubmissionVersion[] {
    const project = this.getProjectById(projectId);
    return project?.submissionVersions
      ? [...project.submissionVersions]
      : [];
  }

  getCurrentSubmissionVersion(
    projectId: string
  ): SubmissionVersion | undefined {
    return this.getProjectById(projectId)?.submissionVersions?.find(
      (version) => version.isCurrent
    );
  }

  addSubmissionVersion(
    projectId: string,
    submissionVersion: SubmissionVersion
  ): SubmissionVersion | undefined {
    const project = this.getProjectById(projectId);

    if (!project) return undefined;

    const submittingUser = this.getUserById(
      submissionVersion.submittedBy
    );

    if (!submittingUser) {
      return undefined;
    }

    const existingVersions = project.submissionVersions || [];
    const updatedExisting = existingVersions.map((version) => ({
      ...version,
      isCurrent: false,
      status:
        version.status === 'ACTIVE'
          ? ('SUPERSEDED' as const)
          : version.status,
    }));

    const newVersion: SubmissionVersion = {
      ...submissionVersion,
      isCurrent: true,
      status: 'ACTIVE',
    };

    this.updateProject(projectId, {
      submissionVersions: [newVersion, ...updatedExisting],
    });

    this.addAuditLog({
      userId: submittingUser.id,
      userFullName: submittingUser.fullName,
      userRole: submittingUser.role,
      actionCode: 'ADD_SUBMISSION_VERSION',
      entityType: 'SUBMISSION_VERSION',
      entityId: submissionVersion.id,
      notes: `Nộp phiên bản ${submissionVersion.versionNo} cho đề tài ${project.proposalCode}.`,
    });

    this.users
      .filter((user) => user.role === 'RESEARCH_OFFICE')
      .forEach((user) => {
        this.addNotification({
          userId: user.id,
          title: `Có phiên bản hồ sơ mới: ${project.proposalCode}`,
          content: `Đề tài ${project.proposalCode} vừa nộp phiên bản ${submissionVersion.versionNo}.`,
          type: 'INFO',
          link: `/projects/${projectId}`,
        });
      });

    return newVersion;
  }

  markSubmissionVersionSuperseded(
    projectId: string,
    versionId: string
  ): boolean {
    const project = this.getProjectById(projectId);

    if (!project?.submissionVersions) return false;

    let changed = false;

    const versions = project.submissionVersions.map((version) => {
      if (version.id !== versionId || !version.isCurrent) {
        return version;
      }

      changed = true;

      return {
        ...version,
        isCurrent: false,
        status: 'SUPERSEDED' as const,
      };
    });

    if (changed) {
      this.updateProject(projectId, {
        submissionVersions: versions,
      });
    }

    return changed;
  }

  // ---------------------------------------------------------------------------
  // DOCUMENTS / DOCUMENT VERSIONS
  // ---------------------------------------------------------------------------

  getProjectDocuments(projectId: string): ProjectDocument[] {
    return [
      ...(this.getProjectById(projectId)?.documents || []),
    ];
  }

  getProjectDocumentById(
    projectId: string,
    documentId: string
  ): ProjectDocument | undefined {
    return this.getProjectById(projectId)?.documents.find(
      (document) => document.id === documentId
    );
  }

  addProjectDocument(
    projectId: string,
    document: ProjectDocument
  ): ProjectDocument | undefined {
    const project = this.getProjectById(projectId);

    if (!project) return undefined;
    if (document.projectId !== projectId) return undefined;

    if (
      project.documents.some(
        (existing) => existing.id === document.id
      )
    ) {
      return undefined;
    }

    this.updateProject(projectId, {
      documents: [document, ...project.documents],
    });

    return document;
  }

  addDocumentVersion(
    projectId: string,
    documentId: string,
    version: DocumentVersion
  ): ProjectDocument | undefined {
    const project = this.getProjectById(projectId);

    if (!project) return undefined;

    const index = project.documents.findIndex(
      (document) => document.id === documentId
    );

    if (index === -1) return undefined;

    const currentDocument = project.documents[index];

    const previousVersions = currentDocument.versions.map(
      (item) => ({
        ...item,
        isCurrent: false,
      })
    );

    const nextVersionNumber =
      Math.max(
        0,
        ...currentDocument.versions.map((item) => item.version)
      ) + 1;

    const newVersion: DocumentVersion = {
      ...version,
      documentId,
      version: nextVersionNumber,
      isCurrent: true,
    };

    const updatedDocument: ProjectDocument = {
      ...currentDocument,
      currentVersion: nextVersionNumber,
      currentVersionId: newVersion.id,
      versions: [newVersion, ...previousVersions],
    };

    const documents = [...project.documents];
    documents[index] = updatedDocument;

    this.updateProject(projectId, { documents });

    return updatedDocument;
  }

  // ---------------------------------------------------------------------------
  // REGISTRATION ROUNDS
  // ---------------------------------------------------------------------------

  getRounds(): RegistrationRound[] {
    return [...this.rounds];
  }

  getRoundById(id: string): RegistrationRound | undefined {
    return this.rounds.find((round) => round.id === id);
  }

  createRound(round: RegistrationRound): RegistrationRound {
    this.rounds.unshift(round);
    return round;
  }

  updateRound(
    id: string,
    updates: Partial<RegistrationRound>
  ): RegistrationRound | undefined {
    const index = this.rounds.findIndex((round) => round.id === id);

    if (index === -1) return undefined;

    this.rounds[index] = {
      ...this.rounds[index],
      ...updates,
    };

    return this.rounds[index];
  }

  // ---------------------------------------------------------------------------
  // COUNCILS
  // ---------------------------------------------------------------------------

  getCouncils(
    type?: 'PROPOSAL_REVIEW' | 'ACCEPTANCE_REVIEW'
  ): Council[] {
    return type
      ? this.councils.filter((council) => council.type === type)
      : [...this.councils];
  }

  getCouncilById(id: string): Council | undefined {
    return this.councils.find((council) => council.id === id);
  }

  createCouncil(council: Council): Council {
    this.councils.unshift(council);
    return council;
  }

  updateCouncil(
    id: string,
    updates: Partial<Council>
  ): Council | undefined {
    const index = this.councils.findIndex(
      (council) => council.id === id
    );

    if (index === -1) return undefined;

    this.councils[index] = {
      ...this.councils[index],
      ...updates,
    };

    return this.councils[index];
  }

  // ---------------------------------------------------------------------------
  // ETHICS
  // ---------------------------------------------------------------------------

  getEthicsProjects(): ResearchProject[] {
    return this.projects.filter(
      (project) => project.ethicsRequired
    );
  }

  getEthicsApprovalByProjectId(
    projectId: string
  ): EthicsApproval | undefined {
    return this.getProjectById(projectId)?.ethicsApproval;
  }

  updateEthicsApproval(
    projectId: string,
    updates: Partial<EthicsApproval>
  ): EthicsApproval | undefined {
    const project = this.getProjectById(projectId);

    if (!project) return undefined;

    const existing = project.ethicsApproval;

    if (!existing) {
      return undefined;
    }

    const updatedApproval: EthicsApproval = {
      ...existing,
      ...updates,
      projectId,
    };

    this.updateProject(projectId, {
      ethicsApproval: updatedApproval,
      ethicsRequired: updatedApproval.ethicsRequired,
      ethicsStatus: updatedApproval.status,
    });

    return updatedApproval;
  }

  createEthicsApproval(
    projectId: string,
    approval: EthicsApproval
  ): EthicsApproval | undefined {
    const project = this.getProjectById(projectId);

    if (!project || approval.projectId !== projectId) {
      return undefined;
    }

    this.updateProject(projectId, {
      ethicsApproval: approval,
      ethicsRequired: approval.ethicsRequired,
      ethicsStatus: approval.status,
    });

    return approval;
  }

  transitionEthicsStatus(
    projectId: string,
    nextStatus: EthicsStatus,
    actorId: string,
    notes?: string
  ): EthicsApproval | undefined {
    const project = this.getProjectById(projectId);
    const actor = this.getUserById(actorId);

    if (!project || !actor) return undefined;

    const currentStatus = project.ethicsStatus;

    if (!this.isAllowedEthicsTransition(currentStatus, nextStatus)) {
      return undefined;
    }

    const approval = project.ethicsApproval;

    // Không tự tạo dữ liệu sàng lọc giả. Hồ sơ EthicsApproval phải được
    // khởi tạo bằng createEthicsApproval() từ dữ liệu sàng lọc thực tế.
    if (!approval) {
      return undefined;
    }

    const updatedApproval: EthicsApproval = {
      ...approval,
      status: nextStatus,
    };

    this.updateProject(projectId, {
      ethicsApproval: updatedApproval,
      ethicsStatus: nextStatus,
    });

    this.addAuditLog({
      userId: actor.id,
      userFullName: actor.fullName,
      userRole: actor.role,
      entityType: 'ETHICS',
      entityId: updatedApproval.id,
      actionCode: 'ETHICS_STATUS_UPDATED',
      fromStatus: currentStatus,
      toStatus: nextStatus,
      notes,
    });

    return updatedApproval;
  }

  private isAllowedEthicsTransition(
    from: EthicsStatus,
    to: EthicsStatus
  ): boolean {
    const transitions: Partial<
      Record<EthicsStatus, EthicsStatus[]>
    > = {
      SCREENING_IN_PROGRESS: [
        'NOT_REQUIRED',
        'DOSSIER_SUBMITTED',
        'WITHDRAWN',
      ],
      DOSSIER_SUBMITTED: [
        'UNDER_ETHICS_REVIEW',
        'WITHDRAWN',
      ],
      UNDER_ETHICS_REVIEW: [
        'ETHICS_REVISION_REQUIRED',
        'CONDITIONALLY_APPROVED',
        'ETHICS_APPROVED',
        'ETHICS_REJECTED',
        'WITHDRAWN',
      ],
      ETHICS_REVISION_REQUIRED: [
        'DOSSIER_SUBMITTED',
        'WITHDRAWN',
      ],
      CONDITIONALLY_APPROVED: [
        'ETHICS_APPROVED',
        'ETHICS_REVISION_REQUIRED',
        'TERMINATED',
      ],
      ETHICS_APPROVED: [
        'EXPIRED',
        'SUSPENDED',
        'TERMINATED',
      ],
      EXPIRED: [
        'DOSSIER_SUBMITTED',
        'TERMINATED',
      ],
      SUSPENDED: [
        'ETHICS_APPROVED',
        'TERMINATED',
      ],
    };

    return transitions[from]?.includes(to) ?? false;
  }

  // ---------------------------------------------------------------------------
  // DECISIONS
  // ---------------------------------------------------------------------------

  getDecisions(filters?: {
    type?: 'ASSIGNMENT' | 'RECOGNITION';
    status?: Decision['status'];
    projectId?: string;
  }): Decision[] {
    let result = [...this.decisions];

    if (filters?.type) {
      result = result.filter(
        (decision) => decision.type === filters.type
      );
    }

    if (filters?.status) {
      result = result.filter(
        (decision) => decision.status === filters.status
      );
    }

    if (filters?.projectId) {
      result = result.filter(
        (decision) =>
          decision.projectId === filters.projectId
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }

  getDecisionById(id: string): Decision | undefined {
    return this.decisions.find(
      (decision) => decision.id === id
    );
  }

  createDecision(decision: Decision): Decision | undefined {
    if (this.decisions.some((item) => item.id === decision.id)) {
      return undefined;
    }

    if (!this.getProjectById(decision.projectId)) {
      return undefined;
    }

    const sameTypeExists = this.decisions.some(
      (item) =>
        item.projectId === decision.projectId &&
        item.type === decision.type
    );

    if (sameTypeExists) {
      return undefined;
    }

    this.decisions.unshift(decision);
    this.syncProjectDecisionSnapshot(decision.projectId);

    return decision;
  }

  updateDecision(
    id: string,
    updates: Partial<Decision>
  ): Decision | undefined {
    const index = this.decisions.findIndex(
      (decision) => decision.id === id
    );

    if (index === -1) return undefined;

    const current = this.decisions[index];

    const updatedDecision: Decision = {
      ...current,
      ...updates,
      id: current.id,
      projectId: current.projectId,
      type: current.type,
    };

    this.decisions[index] = updatedDecision;
    this.syncProjectDecisionSnapshot(current.projectId);

    return updatedDecision;
  }

  deleteDecision(id: string): boolean {
    const decision = this.getDecisionById(id);

    if (!decision || decision.status !== 'DRAFT') {
      return false;
    }

    const index = this.decisions.findIndex(
      (item) => item.id === id
    );

    this.decisions.splice(index, 1);
    this.syncProjectDecisionSnapshot(decision.projectId);

    return true;
  }

  private syncProjectDecisionSnapshot(projectId: string): void {
    const project = this.getProjectById(projectId);

    if (!project) return;

    const projectDecisions = this.decisions.filter(
      (decision) => decision.projectId === projectId
    );

    this.updateProject(projectId, {
      decisions: projectDecisions,
    });
  }

  // ---------------------------------------------------------------------------
  // CHANGE REQUESTS
  // ---------------------------------------------------------------------------

  getChangeRequests(): ChangeRequest[] {
    return this.projects.flatMap(
      (project) => project.changeRequests || []
    );
  }

  updateChangeRequest(
    id: string,
    updates: Partial<ChangeRequest>
  ): ChangeRequest | undefined {
    for (const project of this.projects) {
      const index = project.changeRequests?.findIndex(
        (request) => request.id === id
      );

      if (
        index === undefined ||
        index === -1 ||
        !project.changeRequests
      ) {
        continue;
      }

      const requests = [...project.changeRequests];
      requests[index] = {
        ...requests[index],
        ...updates,
      };

      this.updateProject(project.id, {
        changeRequests: requests,
      });

      return requests[index];
    }

    return undefined;
  }

  // ---------------------------------------------------------------------------
  // USERS / DEPARTMENTS / POLICIES
  // ---------------------------------------------------------------------------

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  getDepartments(): Department[] {
    return [...this.departments];
  }

  getDepartmentById(id: string): Department | undefined {
    return this.departments.find(
      (department) => department.id === id
    );
  }

  getPolicies(): WorkflowPolicy[] {
    return [...this.policies];
  }

  getPolicyById(id: string): WorkflowPolicy | undefined {
    return this.policies.find((policy) => policy.id === id);
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS / AUDIT LOGS
  // ---------------------------------------------------------------------------

  getNotifications(userId: string): Notification[] {
    return this.notifications
      .filter(
        (notification) => notification.userId === userId
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }

  addNotification(
    notification: Omit<
      Notification,
      'id' | 'createdAt' | 'isRead'
    >
  ): Notification {
    const created: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(created);

    return created;
  }

  addAuditLog(
    log: Omit<AuditLog, 'id' | 'timestamp'>
  ): AuditLog {
    const created: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.unshift(created);

    return created;
  }

  getAuditLogs(filters?: {
    entityType?: AuditLog['entityType'];
    entityId?: string;
    userId?: string;
  }): AuditLog[] {
    let result = [...this.auditLogs];

    if (filters?.entityType) {
      result = result.filter(
        (log) => log.entityType === filters.entityType
      );
    }

    if (filters?.entityId) {
      result = result.filter(
        (log) => log.entityId === filters.entityId
      );
    }

    if (filters?.userId) {
      result = result.filter(
        (log) => log.userId === filters.userId
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    );
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD STATS
  // ---------------------------------------------------------------------------

  getStats(userRole: Role, userId: string) {
    const allProjects = this.projects;

    const myProjects = allProjects.filter(
      (project) =>
        project.principalInvestigatorId === userId ||
        project.members.some(
          (member: any) => member.userId === userId
        )
    );

    return {
      totalProjects: allProjects.length,

      underReviewProposals: allProjects.filter(
        (project) =>
          project.proposalStatus === 'SUBMITTED' ||
          project.proposalStatus === 'UNDER_ADMIN_REVIEW' ||
          project.proposalStatus === 'RESUBMITTED'
      ).length,

      revisionRequiredProposals: allProjects.filter(
        (project) =>
          project.proposalStatus === 'REVISION_REQUIRED'
      ).length,

      waitingCouncil: allProjects.filter(
        (project) =>
          project.proposalStatus === 'OUTLINE_SUBMITTED' ||
          project.proposalStatus === 'UNDER_PROPOSAL_REVIEW'
      ).length,

      waitingAssignment: allProjects.filter(
        (project) => project.status === 'WAITING_ASSIGNMENT'
      ).length,

      inProgressProjects: allProjects.filter(
        (project) => project.status === 'IN_PROGRESS'
      ).length,

      waitingAcceptance: allProjects.filter(
        (project) =>
          project.status === 'WAITING_ACCEPTANCE' ||
          project.acceptanceDossier?.status === 'SUBMITTED' ||
          project.acceptanceDossier?.status === 'UNDER_ADMIN_REVIEW'
      ).length,

      acceptedProjects: allProjects.filter(
        (project) => project.status === 'ACCEPTED'
      ).length,

      completedProjects: allProjects.filter(
        (project) =>
          project.status === 'RECOGNIZED' ||
          project.status === 'CLOSED' ||
          project.status === 'ARCHIVED'
      ).length,

      myProjectsCount: myProjects.length,

      myInProgressCount: myProjects.filter(
        (project) => project.status === 'IN_PROGRESS'
      ).length,

      viewerRole: userRole,
    };
  }
}
export const repo = new MockRepository();
