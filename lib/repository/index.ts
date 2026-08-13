import {
  Department,
  User,
  RegistrationRound,
  ResearchProject,
  Council,
  AuditLog,
  Notification,
  Role,
  Decision,
  ChangeRequest,
  WorkflowPolicy,
  SubmissionVersion,
} from '@/lib/types';
import {
  SEED_DEPARTMENTS,
  SEED_USERS,
  SEED_REGISTRATION_ROUNDS,
  SEED_PROJECTS,
  SEED_COUNCILS,
  SEED_WORKFLOW_POLICIES,
  SEED_DECISIONS,
} from '@/lib/mock-data/seed-data';

// ==========================================
// IN-MEMORY / LOCAL STORAGE REPOSITORY LAYER
// Tách riêng biệt để dễ dàng thay bằng API hoặc Prisma DB thật
// ==========================================

class MockRepository {
  private departments: Department[] = [...SEED_DEPARTMENTS];
  private users: User[] = [...SEED_USERS];
  private rounds: RegistrationRound[] = [...SEED_REGISTRATION_ROUNDS];
  private policies: WorkflowPolicy[] = [...SEED_WORKFLOW_POLICIES];
  private projects: ResearchProject[] = SEED_PROJECTS.map((p) => ({
    ...p,
    workflowPolicyId: p.workflowPolicyId || 'policy-a',
    projectCategory: p.projectCategory || 'CAP_CO_SO',
    acceptanceAuthority: p.acceptanceAuthority || 'BENH_VIEN',
    scientificReviewStatus: p.scientificReviewStatus || 'REQUIRED',
  }));
  private councils: Council[] = [...SEED_COUNCILS];
  private notifications: Notification[] = [
    {
      id: 'notif-01',
      userId: 'user-01',
      title: 'Đề tài DT-2025-001 được phê duyệt thực hiện',
      content: 'Giám đốc Bệnh viện đã ký Quyết định số QĐ-NCKH/2025/45 giao thực hiện đề tài.',
      type: 'SUCCESS',
      link: '/projects/proj-01',
      isRead: false,
      createdAt: '25/03/2025 16:30',
    },
    {
      id: 'notif-02',
      userId: 'user-01',
      title: 'Thông báo mở Đợt đăng ký Đề tài Năm 2026',
      content: 'Phòng NCKH mở đợt đăng ký đề tài cấp cơ sở Đợt 1 Năm 2026 đến hết 31/03/2026.',
      type: 'INFO',
      link: '/rounds',
      isRead: true,
      createdAt: '05/01/2026 08:00',
    },
    {
      id: 'notif-03',
      userId: 'user-05',
      title: 'Phân công Chủ tịch Hội đồng xét duyệt đề cương',
      content: 'Bạn được phân công làm Chủ tịch Hội đồng mã HD-XD-2026-01 họp ngày 15/02/2026.',
      type: 'WARNING',
      link: '/councils/council-01',
      isRead: false,
      createdAt: '01/02/2026 14:00',
    },
  ];
  private auditLogs: AuditLog[] = [
    {
      id: 'log-01',
      timestamp: '25/03/2025 16:00',
      userId: 'user-10',
      userFullName: 'GS.TS.BS. Vũ Đình Khoa',
      userRole: 'DIRECTOR',
      actionCode: 'APPROVE_DECISION',
      entityType: 'DECISION',
      entityId: 'dec-01',
      notes: 'Ký phê duyệt Quyết định giao thực hiện đề tài DT-2025-001',
    },
  ];

  private decisions: Decision[] = [...SEED_DECISIONS];

  // 1. Projects
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
      const kw = filters.keyword.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.proposalCode.toLowerCase().includes(kw) ||
          (p.projectCode && p.projectCode.toLowerCase().includes(kw)) ||
          p.principalInvestigatorName.toLowerCase().includes(kw)
      );
    }

    if (filters.departmentId && filters.departmentId !== 'ALL') {
      result = result.filter((p) => p.departmentId === filters.departmentId);
    }

    if (filters.roundId && filters.roundId !== 'ALL') {
      result = result.filter((p) => p.registrationRoundId === filters.roundId);
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.ethicsRequired !== undefined) {
      result = result.filter((p) => p.ethicsRequired === filters.ethicsRequired);
    }

    if (filters.piId) {
      result = result.filter((p) => p.principalInvestigatorId === filters.piId);
    }

    return result;
  }

  getProjectById(id: string): ResearchProject | undefined {
    return this.projects.find((p) => p.id === id);
  }

  createProject(newProject: ResearchProject): ResearchProject {
    this.projects.unshift(newProject);
    return newProject;
  }

  updateProject(id: string, updates: Partial<ResearchProject>): ResearchProject | undefined {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.projects[idx] = { ...this.projects[idx], ...updates };
    return this.projects[idx];
  }

  // SubmissionVersion helpers
  getSubmissionVersions(projectId: string): SubmissionVersion[] {
    const p = this.getProjectById(projectId);
    return p?.submissionVersions ? [...p.submissionVersions] : [];
  }

  getCurrentSubmissionVersion(projectId: string): SubmissionVersion | undefined {
    const p = this.getProjectById(projectId);
    return p?.submissionVersions?.find((v) => v.isCurrent);
  }

  addSubmissionVersion(projectId: string, sv: SubmissionVersion): SubmissionVersion | undefined {
    const p = this.getProjectById(projectId);
    if (!p) return undefined;

    // Mark existing versions as not current
    const existing = p.submissionVersions || [];
    const updatedExisting = existing.map((v) => ({ ...v, isCurrent: false }));

    const newSv = { ...sv, isCurrent: true } as SubmissionVersion;
    p.submissionVersions = [newSv, ...updatedExisting];

    // Persist back
    this.updateProject(projectId, { submissionVersions: p.submissionVersions });

    // Audit log
    this.addAuditLog({
      userId: sv.submittedBy,
      userFullName: sv.submittedByName,
      userRole: (this.getUserById(sv.submittedBy)?.role as Role) || 'RESEARCHER',
      actionCode: 'ADD_SUBMISSION_VERSION',
      entityType: 'SUBMISSION_VERSION',
      entityId: sv.id,
      notes: `Nộp bản nộp lại v${sv.versionNo} cho đề tài ${projectId}`,
    });

    // Notify Research Office users
    this.users
      .filter((u) => u.role === 'RESEARCH_OFFICE')
      .forEach((u) => {
        this.addNotification({
          userId: u.id,
          title: `Đã có nộp lại hồ sơ: ${p.proposalCode}`,
          content: `Đề tài ${p.proposalCode} vừa nộp lại phiên bản ${sv.versionNo}. Vui lòng thẩm định.`,
          type: 'INFO',
          link: `/projects/${projectId}`,
        });
      });

    return newSv;
  }

  markSubmissionVersionSuperseded(projectId: string, versionId: string): boolean {
    const p = this.getProjectById(projectId);
    if (!p || !p.submissionVersions) return false;
    let changed = false;
    p.submissionVersions = p.submissionVersions.map((v) => {
      if (v.id === versionId && v.isCurrent) {
        changed = true;
        return { ...v, isCurrent: false, status: 'SUPERSEDED' } as SubmissionVersion;
      }
      return v;
    });
    if (changed) this.updateProject(projectId, { submissionVersions: p.submissionVersions });
    return changed;
  }

  deleteProject(id: string): boolean {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.projects.splice(idx, 1);
    return true;
  }

  // 2. Registration Rounds
  getRounds(): RegistrationRound[] {
    return [...this.rounds];
  }

  getRoundById(id: string): RegistrationRound | undefined {
    return this.rounds.find((r) => r.id === id);
  }

  createRound(round: RegistrationRound): RegistrationRound {
    this.rounds.unshift(round);
    return round;
  }

  updateRound(id: string, updates: Partial<RegistrationRound>): RegistrationRound | undefined {
    const idx = this.rounds.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.rounds[idx] = { ...this.rounds[idx], ...updates };
    return this.rounds[idx];
  }

  // 3. Councils
  getCouncils(type?: 'PROPOSAL_REVIEW' | 'ACCEPTANCE_REVIEW'): Council[] {
    if (type) {
      return this.councils.filter((c) => c.type === type);
    }
    return [...this.councils];
  }

  getCouncilById(id: string): Council | undefined {
    return this.councils.find((c) => c.id === id);
  }

  createCouncil(newCouncil: Council): Council {
    this.councils.unshift(newCouncil);
    return newCouncil;
  }

  updateCouncil(id: string, updates: Partial<Council>): Council | undefined {
    const idx = this.councils.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.councils[idx] = { ...this.councils[idx], ...updates };
    return this.councils[idx];
  }

  // 4. Users & Departments
  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getDepartments(): Department[] {
    return [...this.departments];
  }

  getDepartmentById(id: string): Department | undefined {
    return this.departments.find((d) => d.id === id);
  }

  // 5. Notifications & Audit Logs
  getNotifications(userId: string): Notification[] {
    return this.notifications.filter((n) => n.userId === userId);
  }

  addNotification(notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  // 6. ChangeRequests, and Ethics

  updateDecision(id: string, updates: Partial<Decision>): Decision | undefined {
    // Cập nhật trong mảng decisions top-level
    const decIdx = this.decisions.findIndex((d) => d.id === id);
    if (decIdx !== -1) {
      this.decisions[decIdx] = { ...this.decisions[decIdx], ...updates };
    }
    
    // Cập nhật trong projects
    let foundDec: Decision | undefined;
    this.projects.forEach((p) => {
      if (p.decisions) {
        const idx = p.decisions.findIndex((d) => d.id === id);
        if (idx !== -1) {
          p.decisions[idx] = { ...p.decisions[idx], ...updates };
          foundDec = p.decisions[idx];
        }
      }
    });
    return foundDec || (decIdx !== -1 ? this.decisions[decIdx] : undefined);
  }

  createDecision(decision: Decision): Decision {
    this.decisions.push(decision);
    const project = this.projects.find(p => p.id === decision.projectId);
    if (project) {
      if (!project.decisions) project.decisions = [];
      project.decisions.push(decision);
    }
    return decision;
  }

  getChangeRequests(): ChangeRequest[] {
    const list: ChangeRequest[] = [];
    this.projects.forEach((p) => {
      if (p.changeRequests) {
        list.push(...p.changeRequests);
      }
    });
    return list;
  }

  updateChangeRequest(id: string, updates: Partial<ChangeRequest>): ChangeRequest | undefined {
    let foundCr: ChangeRequest | undefined;
    this.projects.forEach((p) => {
      if (p.changeRequests) {
        const idx = p.changeRequests.findIndex((cr) => cr.id === id);
        if (idx !== -1) {
          p.changeRequests[idx] = { ...p.changeRequests[idx], ...updates };
          foundCr = p.changeRequests[idx];
        }
      }
    });
    return foundCr;
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  getPolicies(): WorkflowPolicy[] {
    return [...this.policies];
  }

  getPolicyById(id: string): WorkflowPolicy | undefined {
    return this.policies.find((p) => p.id === id);
  }

  // Helper KPI Stats cho Dashboard
  getStats(userRole: Role, userId: string) {
    const all = this.projects;
    const myProjects = all.filter((p) => p.principalInvestigatorId === userId);

    return {
      totalProjects: all.length,
      underReviewProposals: all.filter((p) => p.proposalStatus === 'UNDER_ADMIN_REVIEW' || p.proposalStatus === 'SUBMITTED').length,
      revisionRequiredProposals: all.filter((p) => p.proposalStatus === 'REVISION_REQUIRED').length,
      waitingCouncil: all.filter((p) => (p.status as any) === 'APPROVED' || p.status === 'WAITING_ASSIGNMENT').length,
      inProgressProjects: all.filter((p) => p.status === 'IN_PROGRESS').length,
      delayedProjects: all.filter((p) => p.status === 'IN_PROGRESS' && p.progressPercentage < 50).length,
      waitingAcceptance: all.filter((p) => p.acceptanceDossier && p.acceptanceDossier.status === 'SUBMITTED').length,
      acceptedAndArchived: all.filter((p) => p.status === 'ACCEPTED' || p.status === 'ARCHIVED' || p.status === 'CLOSED').length,
      myProjectsCount: myProjects.length,
      myInProgressCount: myProjects.filter((p) => p.status === 'IN_PROGRESS').length,
    };
  }

  // ==========================================
  // DECISIONS
  // ==========================================
  getDecisions(filters?: {
    type?: 'ASSIGNMENT' | 'RECOGNITION';
    status?: Decision['status'];
    projectId?: string;
  }): Decision[] {
    let result = [...this.decisions];
    if (filters) {
      if (filters.type) result = result.filter((d) => d.type === filters.type);
      if (filters.status) result = result.filter((d) => d.status === filters.status);
      if (filters.projectId) result = result.filter((d) => d.projectId === filters.projectId);
    }
    // Sort by createdAt desc
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDecisionById(id: string): Decision | undefined {
    return this.decisions.find((d) => d.id === id);
  }
}

export const repo = new MockRepository();
