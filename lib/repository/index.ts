import {
  Department,
  User,
  RegistrationRound,
  ResearchProject,
  Council,
  AuditLog,
  Notification,
  Role,
} from '@/lib/types';
import {
  SEED_DEPARTMENTS,
  SEED_USERS,
  SEED_REGISTRATION_ROUNDS,
  SEED_PROJECTS,
  SEED_COUNCILS,
} from '@/lib/mock-data/seed-data';

// ==========================================
// IN-MEMORY / LOCAL STORAGE REPOSITORY LAYER
// Tách riêng biệt để dễ dàng thay bằng API hoặc Prisma DB thật
// ==========================================

class MockRepository {
  private departments: Department[] = [...SEED_DEPARTMENTS];
  private users: User[] = [...SEED_USERS];
  private rounds: RegistrationRound[] = [...SEED_REGISTRATION_ROUNDS];
  private projects: ResearchProject[] = [...SEED_PROJECTS];
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
      userId: 'user-10',
      userName: 'GS.TS.BS. Vũ Đình Khoa',
      userRole: 'DIRECTOR',
      action: 'APPROVE_DECISION',
      entityType: 'Decision',
      entityId: 'dec-01',
      details: 'Ký phê duyệt Quyết định giao thực hiện đề tài DT-2025-001',
      createdAt: '25/03/2025 16:00',
    },
  ];

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

  addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // Helper KPI Stats cho Dashboard
  getStats(userRole: Role, userId: string) {
    const all = this.projects;
    const myProjects = all.filter((p) => p.principalInvestigatorId === userId);

    return {
      totalProjects: all.length,
      underReviewProposals: all.filter((p) => p.proposalStatus === 'UNDER_ADMIN_REVIEW' || p.proposalStatus === 'SUBMITTED').length,
      revisionRequiredProposals: all.filter((p) => p.proposalStatus === 'REVISION_REQUIRED').length,
      waitingCouncil: all.filter((p) => p.status === 'PROPOSAL_APPROVED' || (p.proposalStatus === 'VALID' && p.status === 'DRAFT')).length,
      inProgressProjects: all.filter((p) => p.status === 'IN_PROGRESS').length,
      delayedProjects: all.filter((p) => p.status === 'IN_PROGRESS' && p.progressPercentage < 50).length,
      waitingAcceptance: all.filter((p) => p.acceptanceDossier && p.acceptanceDossier.status === 'SUBMITTED').length,
      acceptedAndArchived: all.filter((p) => p.status === 'ACCEPTED' || p.status === 'ARCHIVED' || p.status === 'CLOSED').length,
      myProjectsCount: myProjects.length,
      myInProgressCount: myProjects.filter((p) => p.status === 'IN_PROGRESS').length,
    };
  }
}

// Export singleton instance
export const repo = new MockRepository();
